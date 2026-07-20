import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
import datetime
from datetime import timedelta, timezone

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_tenders.db"
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

def _get_token(email, company_type, company_name):
    payload = {
        "email": email,
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "company": {
            "name": company_name,
            "type": company_type
        }
    }
    client.post("/api/v1/auth/signup", json=payload)
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    token = login_res.json()["access_token"]
    
    # Verify the company
    client.post("/api/v1/companies/me/verify", headers={"Authorization": f"Bearer {token}"})
    
    return token

def test_tendering_flow():
    shipper_token = _get_token("shipper_t1@acme.com", "SHIPPER", "Acme Tenders")
    
    # Get carrier details
    payload = {
        "email": "carrier_t1@swift.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "company": {
            "name": "Swift Tenders",
            "type": "CARRIER"
        }
    }
    client.post("/api/v1/auth/signup", json=payload)
    login_res = client.post("/api/v1/auth/login", json={"email": "carrier_t1@swift.com", "password": "password123"})
    carrier_token = login_res.json()["access_token"]
    client.post("/api/v1/companies/me/verify", headers={"Authorization": f"Bearer {carrier_token}"})
    
    carrier_company_id = client.get("/api/v1/companies/me", headers={"Authorization": f"Bearer {carrier_token}"}).json()["id"]

    # 1. Create Load
    load_payload = {
        "origin_address": "CHI", "destination_address": "DAL",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000
    }
    res = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"})
    load_id = res.json()["id"]
    
    # 2. Shipper Sends Tender
    expires = (datetime.datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    tender_payload = {
        "carrier_id": carrier_company_id,
        "amount": 2500.0,
        "expires_at": expires
    }
    res = client.post(f"/api/v1/loads/{load_id}/tenders", json=tender_payload, headers={"Authorization": f"Bearer {shipper_token}"})
    assert res.status_code == 200
    tender_id = res.json()["id"]
    assert res.json()["status"] == "PENDING"
    
    # Verify load status is TENDER_SENT
    my_loads = client.get("/api/v1/loads/me", headers={"Authorization": f"Bearer {shipper_token}"})
    assert my_loads.json()[0]["status"] == "TENDER_SENT"
    
    # 3. Carrier Rejects Tender
    res = client.post(f"/api/v1/tenders/{tender_id}/reject", headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "REJECTED"
    
    # Verify load status reverts
    my_loads = client.get("/api/v1/loads/me", headers={"Authorization": f"Bearer {shipper_token}"})
    assert my_loads.json()[0]["status"] == "OPEN_FOR_BIDDING"
    
    # 4. Shipper Sends Another Tender
    res = client.post(f"/api/v1/loads/{load_id}/tenders", json=tender_payload, headers={"Authorization": f"Bearer {shipper_token}"})
    tender_id2 = res.json()["id"]
    
    # 5. Carrier Accepts Tender
    res = client.post(f"/api/v1/tenders/{tender_id2}/accept", headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "ACCEPTED"
    
    # Verify load status is Awarded (TENDER_ACCEPTED)
    my_loads = client.get("/api/v1/loads/me", headers={"Authorization": f"Bearer {shipper_token}"})
    assert my_loads.json()[0]["status"] == "TENDER_ACCEPTED"

def test_next_bidder():
    shipper_token = _get_token("st2@test.com", "SHIPPER", "S2")
    c1_token = _get_token("ct2@test.com", "CARRIER", "C2")
    c2_token = _get_token("ct3@test.com", "CARRIER", "C3")
    
    load_payload = {
        "origin_address": "CHI", "destination_address": "DAL",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000
    }
    res = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"})
    load_id = res.json()["id"]
    
    expires = (datetime.datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    # Bid 1: 1500
    res1 = client.post(f"/api/v1/loads/{load_id}/bids", json={"amount": 1500.0, "expires_at": expires}, headers={"Authorization": f"Bearer {c1_token}"})
    # Bid 2: 1200 (Lowest)
    res2 = client.post(f"/api/v1/loads/{load_id}/bids", json={"amount": 1200.0, "expires_at": expires}, headers={"Authorization": f"Bearer {c2_token}"})
    
    # Auto Tender Next Bidder
    res3 = client.post(f"/api/v1/loads/{load_id}/tenders/next", headers={"Authorization": f"Bearer {shipper_token}"})
    assert res3.status_code == 200
    assert res3.json()["amount"] == 1200.0 # It should select the lowest bid
    
    # Check that bid was accepted (because it became a tender)
    bid_check = client.get(f"/api/v1/bids/me", headers={"Authorization": f"Bearer {c2_token}"})
    assert bid_check.json()[0]["status"] == "ACCEPTED"
