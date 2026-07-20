import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.domain.freight.loads.models import LoadStatus
from app.domain.identity.models import Company, VerificationStatus

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_loads.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def _get_shipper_token(verify=True):
    payload = {
        "email": "shipper@company.com",
        "password": "strongpassword123",
        "first_name": "Shipper",
        "last_name": "Admin",
        "company": {
            "name": "Acme Shipping",
            "type": "SHIPPER"
        }
    }
    client.post("/api/v1/auth/signup", json=payload)
    login_res = client.post("/api/v1/auth/login", json={"email": "shipper@company.com", "password": "strongpassword123"})
    token = login_res.json()["access_token"]
    
    if verify:
        client.post("/api/v1/companies/me/verify", headers={"Authorization": f"Bearer {token}"})
        
    return token

def test_create_load_unverified():
    token = _get_shipper_token(verify=False)
    load_payload = {
        "origin_address": "Chicago, IL",
        "destination_address": "Dallas, TX",
        "pickup_date": "2026-08-01T10:00:00Z",
        "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN",
        "weight_lbs": 40000
    }
    res = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_create_load_verified():
    token = _get_shipper_token(verify=True)
    load_payload = {
        "origin_address": "Chicago, IL",
        "destination_address": "Dallas, TX",
        "pickup_date": "2026-08-01T10:00:00Z",
        "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN",
        "weight_lbs": 40000
    }
    res = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "OPEN_FOR_BIDDING"
    assert res.json()["origin_address"] == "Chicago, IL"
    return token, res.json()["id"]

def test_edit_load():
    token, load_id = test_create_load_verified()
    update_payload = {"weight_lbs": 42000}
    res = client.put(f"/api/v1/loads/{load_id}", json=update_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["weight_lbs"] == 42000

def test_cancel_load():
    token, load_id = test_create_load_verified()
    res = client.patch(f"/api/v1/loads/{load_id}/cancel", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "CANCELLED"
    
    # Try editing a cancelled load
    res2 = client.put(f"/api/v1/loads/{load_id}", json={"weight_lbs": 42000}, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 400

def test_marketplace_search():
    token = _get_shipper_token(verify=True)
    
    # Create two loads
    l1 = {
        "origin_address": "Chicago, IL",
        "destination_address": "Dallas, TX",
        "pickup_date": "2026-08-01T10:00:00Z",
        "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN",
        "weight_lbs": 40000
    }
    l2 = {
        "origin_address": "Miami, FL",
        "destination_address": "Atlanta, GA",
        "pickup_date": "2026-08-01T10:00:00Z",
        "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "REEFER",
        "weight_lbs": 30000
    }
    client.post("/api/v1/loads", json=l1, headers={"Authorization": f"Bearer {token}"})
    client.post("/api/v1/loads", json=l2, headers={"Authorization": f"Bearer {token}"})
    
    # Test empty search
    res = client.get("/api/v1/loads/marketplace", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["total"] == 2
    
    # Test text search
    res2 = client.get("/api/v1/loads/marketplace?search=miami", headers={"Authorization": f"Bearer {token}"})
    assert res2.json()["total"] == 1
    assert res2.json()["items"][0]["origin_address"] == "Miami, FL"
    
    # Test equipment filter
    res3 = client.get("/api/v1/loads/marketplace?equipment_type=DRY_VAN", headers={"Authorization": f"Bearer {token}"})
    assert res3.json()["total"] == 1
    assert res3.json()["items"][0]["equipment_type"] == "DRY_VAN"

    # Test sorting by weight
    res4 = client.get("/api/v1/loads/marketplace?sort_by=weight_lbs&sort_desc=true", headers={"Authorization": f"Bearer {token}"})
    assert res4.json()["items"][0]["weight_lbs"] == 40000
