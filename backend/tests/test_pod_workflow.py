import pytest
import os
import io
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
import datetime
from datetime import timedelta, timezone

from sqlalchemy.pool import StaticPool

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
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
    if os.path.exists("test_pod.db"):
        try:
            os.remove("test_pod.db")
        except Exception:
            pass
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    yield
    engine.dispose()
    if os.path.exists("test_pod.db"):
        try:
            os.remove("test_pod.db")
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

def test_full_pod_upload_format_and_approval_flow():
    # 1. Setup Shipper & Carrier
    shipper_token = _get_token("shipper_pod@acme.com", "SHIPPER", "Acme Shipper POD")
    carrier_token = _get_token("carrier_pod@swift.com", "CARRIER", "Swift Carrier POD")
    carrier_company_id = client.get("/api/v1/companies/me", headers={"Authorization": f"Bearer {carrier_token}"}).json()["id"]

    # 2. Create Load & Tender -> Accept (creates Shipment)
    load_payload = {
        "origin_address": "Chicago, IL", "destination_address": "Dallas, TX",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000
    }
    load_id = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"}).json()["id"]
    
    expires = (datetime.datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    tender_id = client.post(f"/api/v1/loads/{load_id}/tenders", json={"carrier_id": carrier_company_id, "amount": 2500.0, "expires_at": expires}, headers={"Authorization": f"Bearer {shipper_token}"}).json()["id"]
    client.post(f"/api/v1/tenders/{tender_id}/accept", headers={"Authorization": f"Bearer {carrier_token}"})
    
    shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {carrier_token}"}).json()
    assert len(shipments) == 1
    shipment_id = shipments[0]["id"]
    
    # 3. Complete POD upload by Driver/Carrier with Signature & Delivery details
    fake_signature = io.BytesIO(b"fake png image signature data")
    fake_photo = io.BytesIO(b"fake photo data")
    
    res = client.post(
        f"/api/v1/shipments/{shipment_id}/pod-complete",
        data={
            "receiver_name": "John Receiver",
            "delivery_notes": "Delivered in perfect condition at Dock 4",
            "osd_reported": "false"
        },
        files={
            "signature_file": ("signature.png", fake_signature, "image/png"),
            "photo_files": ("delivery_photo.jpg", fake_photo, "image/jpeg")
        },
        headers={"Authorization": f"Bearer {carrier_token}"}
    )
    assert res.status_code == 200, res.text
    updated_shipment = res.json()
    assert updated_shipment["status"] == "POD_UPLOADED"
    assert updated_shipment["pod_url"] is not None
    assert updated_shipment["receiver_name"] == "John Receiver"

    # Verify formatted POD URL format
    pod_url = updated_shipment["pod_url"]
    assert pod_url.startswith("/api/v1/uploads/")

    # 4. Shipper views Shipment and POD
    shipper_shipment = client.get(f"/api/v1/shipments/me", headers={"Authorization": f"Bearer {shipper_token}"}).json()[0]
    assert shipper_shipment["status"] == "POD_UPLOADED"
    assert shipper_shipment["pod_url"] == pod_url

    # 5. Shipper approves POD
    approve_res = client.post(
        f"/api/v1/shipments/{shipment_id}/documents/pod/approve",
        headers={"Authorization": f"Bearer {shipper_token}"}
    )
    assert approve_res.status_code == 200, approve_res.text
    completed_shipment = approve_res.json()
    assert completed_shipment["status"] == "COMPLETED"
