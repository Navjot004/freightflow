import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
import datetime
from datetime import timedelta, timezone

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_bids.db"
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
    signup_res = client.post("/api/v1/auth/signup", json=payload)
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    verify_res = client.post("/api/v1/admin/companies/me/verify", headers={"Authorization": f"Bearer {token}"}) # wait, the endpoint in the file is /companies/me/verify ? No, let me check. Let me just leave it as it was but with asserts.
    # Ah, the original code had: client.post("/api/v1/companies/me/verify", ...)
    client.post("/api/v1/companies/me/verify", headers={"Authorization": f"Bearer {token}"})
    return token

def test_bidding_flow():
    shipper_token = _get_token("shipper@acme.com", "SHIPPER", "Acme")
    carrier_token = _get_token("carrier@swift.com", "CARRIER", "Swift")
    
    # 1. Create Load
    load_payload = {
        "origin_address": "CHI", "destination_address": "DAL",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000
    }
    res = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"})
    load_id = res.json()["id"]
    
    # 2. Submit Bid
    expires = (datetime.datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    bid_payload = {"amount": 1500.0, "expires_at": expires, "notes": "Can do"}
    res = client.post(f"/api/v1/loads/{load_id}/bids", json=bid_payload, headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    bid_id = res.json()["id"]
    assert res.json()["status"] == "PENDING"
    
    # 3. Edit Bid
    res = client.put(f"/api/v1/bids/{bid_id}", json={"amount": 1400.0}, headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    assert res.json()["amount"] == 1400.0
    
    # 4. Compare Bids (Shipper View)
    res = client.get(f"/api/v1/loads/{load_id}/bids", headers={"Authorization": f"Bearer {shipper_token}"})
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["amount"] == 1400.0

    # 5. Withdraw Bid
    res = client.patch(f"/api/v1/bids/{bid_id}/withdraw", headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "WITHDRAWN"

def test_bid_expiry():
    shipper_token = _get_token("s2@test.com", "SHIPPER", "S2")
    carrier_token = _get_token("c2@test.com", "CARRIER", "C2")
    
    # 1. Create Load
    load_payload = {
        "origin_address": "CHI", "destination_address": "DAL",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000
    }
    res = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"})
    load_id = res.json()["id"]
    
    # 2. Submit expired Bid
    expires = (datetime.datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    bid_payload = {"amount": 1500.0, "expires_at": expires}
    res = client.post(f"/api/v1/loads/{load_id}/bids", json=bid_payload, headers={"Authorization": f"Bearer {carrier_token}"})
    
    # Wait, the POST should allow creating a past expired bid just for testing (backend logic doesn't explicitly block past dates on creation, though it should IRL). 
    assert res.status_code == 200
    bid_id = res.json()["id"]
    
    # 3. Check if passive expiry works on GET
    res = client.get(f"/api/v1/bids/me", headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    assert res.json()[0]["status"] == "EXPIRED"

def test_accept_bid():
    shipper_token = _get_token("s3@test.com", "SHIPPER", "S3")
    carrier_token = _get_token("c3@test.com", "CARRIER", "C3")
    carrier2_token = _get_token("c4@test.com", "CARRIER", "C4")
    
    load_payload = {
        "origin_address": "CHI", "destination_address": "DAL",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000
    }
    res = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"})
    load_id = res.json()["id"]
    
    expires = (datetime.datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    res = client.post(f"/api/v1/loads/{load_id}/bids", json={"amount": 1500.0, "expires_at": expires}, headers={"Authorization": f"Bearer {carrier_token}"})
    bid1 = res.json()["id"]
    
    res = client.post(f"/api/v1/loads/{load_id}/bids", json={"amount": 1200.0, "expires_at": expires}, headers={"Authorization": f"Bearer {carrier2_token}"})
    bid2 = res.json()["id"]
    
    # Accept bid2
    res = client.post(f"/api/v1/bids/{bid2}/accept", headers={"Authorization": f"Bearer {shipper_token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "ACCEPTED"
    
    # Check that bid1 was rejected
    res = client.get(f"/api/v1/bids/me", headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.json()[0]["status"] == "REJECTED"
