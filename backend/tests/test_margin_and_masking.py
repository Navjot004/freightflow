import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
import datetime
from datetime import timedelta, timezone

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_margin.db"
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
    engine.dispose()
    if os.path.exists("test_margin.db"):
        try:
            os.remove("test_margin.db")
        except Exception:
            pass
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    yield
    engine.dispose()
    if os.path.exists("test_margin.db"):
        try:
            os.remove("test_margin.db")
        except Exception:
            pass

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

def test_broker_margin_and_partner_masking():
    # 1. Setup Shipper, Broker, Carrier
    shipper_token = _get_token("shipper_m@acme.com", "SHIPPER", "Acme Shipper Co")
    broker_token = _get_token("broker_m@logistics.com", "BROKER", "Apex Brokerage")
    carrier_token = _get_token("carrier_m@swift.com", "CARRIER", "Swift Express")
    
    broker_company_id = client.get("/api/v1/companies/me", headers={"Authorization": f"Bearer {broker_token}"}).json()["id"]
    carrier_company_id = client.get("/api/v1/companies/me", headers={"Authorization": f"Bearer {carrier_token}"}).json()["id"]

    # 2. Shipper creates Load for $2,500 and Tenders to Broker
    load_payload = {
        "origin_address": "Chicago, IL", "destination_address": "Dallas, TX",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000, "rate": 2500.0
    }
    load_id = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"}).json()["id"]
    
    expires = (datetime.datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    tender1_id = client.post(f"/api/v1/loads/{load_id}/tenders", json={"carrier_id": broker_company_id, "amount": 2500.0, "expires_at": expires}, headers={"Authorization": f"Bearer {shipper_token}"}).json()["id"]
    client.post(f"/api/v1/tenders/{tender1_id}/accept", headers={"Authorization": f"Bearer {broker_token}"})

    # Broker gets shipment created
    broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
    assert len(broker_shipments) == 1
    shipment_id = broker_shipments[0]["id"]
    assert broker_shipments[0]["shipper_rate"] == 2500.0

    # 3. Broker assigns Partner Carrier at $2,000 Pay Rate (Broker keeps $500 Margin)
    assign_res = client.post(
        f"/api/v1/shipments/{shipment_id}/assign-partner",
        json={"partner_id": carrier_company_id, "agreed_rate": 2000.0, "notes": "Execute at $2,000"},
        headers={"Authorization": f"Bearer {broker_token}"}
    )
    assert assign_res.status_code == 200, assign_res.text
    assignment_id = assign_res.json()["id"]
    assert assign_res.json()["agreed_rate"] == 2000.0

    # 4. Carrier accepts Partner Assignment
    accept_res = client.post(f"/api/v1/partner-assignments/{assignment_id}/accept", headers={"Authorization": f"Bearer {carrier_token}"})
    assert accept_res.status_code == 200, accept_res.text

    # 5. Verify Carrier view of Shipment:
    # - Shipper contract rate ($2,500) is MASKED (None)
    # - Carrier pay rate ($2,000) is visible
    # - Shipper name is MASKED as "Client (via Apex Brokerage)"
    carrier_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {carrier_token}"}).json()
    assert len(carrier_shipments) == 1
    carrier_view = carrier_shipments[0]
    
    assert carrier_view["shipper_rate"] is None
    assert carrier_view["carrier_rate"] == 2000.0
    assert "Client (via Apex Brokerage)" in carrier_view["load"]["shipper"]["name"]

    # 6. Verify Shipper view of Shipment:
    # - Shipper rate ($2,500) is visible
    # - Carrier buy rate ($2,000) is MASKED (None)
    shipper_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {shipper_token}"}).json()
    shipper_view = shipper_shipments[0]
    assert shipper_view["shipper_rate"] == 2500.0
    assert shipper_view["carrier_rate"] is None
