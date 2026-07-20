import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_notifications.db"
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
    client.post("/api/v1/companies/me/verify", headers={"Authorization": f"Bearer {token}"})
    return token

def test_notification_flow():
    shipper_token = _get_token("shipper_n1@acme.com", "SHIPPER", "Acme Notifications")
    carrier_token = _get_token("carrier_n1@swift.com", "CARRIER", "Swift Notifications")
    
    # Check notifications is empty for Shipper
    res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {shipper_token}"})
    assert len(res.json()) == 0
    
    # 1. Create Load
    load_payload = {
        "origin_address": "CHI", "destination_address": "DAL",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000
    }
    load_id = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"}).json()["id"]
    
    # 2. Carrier submits bid -> should generate notification for shipper
    client.post(f"/api/v1/loads/{load_id}/bids", json={"amount": 1000, "expires_at": "2026-09-01T00:00:00Z"}, headers={"Authorization": f"Bearer {carrier_token}"})
    
    # Check Shipper Notifications
    res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {shipper_token}"})
    notifs = res.json()
    assert len(notifs) == 1
    assert notifs[0]["title"] == "New Bid Received"
    assert notifs[0]["is_read"] == False
    
    notif_id = notifs[0]["id"]
    
    # 3. Mark as read
    res = client.patch(f"/api/v1/notifications/{notif_id}/read", headers={"Authorization": f"Bearer {shipper_token}"})
    assert res.json()["is_read"] == True
    
    # 4. Mark all as read
    client.post("/api/v1/notifications/read-all", headers={"Authorization": f"Bearer {shipper_token}"})
    res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {shipper_token}"})
    assert res.json()[0]["is_read"] == True
