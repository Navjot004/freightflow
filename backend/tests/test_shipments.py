import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
import datetime
from datetime import timedelta, timezone

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_shipments.db"
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
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
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

def test_shipment_flow():
    shipper_token = _get_token("shipper_s1@acme.com", "SHIPPER", "Acme Shippers")
    
    # Get carrier details
    client.post("/api/v1/auth/signup", json={
        "email": "carrier_s1@swift.com", "password": "password123",
        "first_name": "Test", "last_name": "User",
        "company": {"name": "Swift Carriers", "type": "CARRIER"}
    })
    carrier_token = client.post("/api/v1/auth/login", json={"email": "carrier_s1@swift.com", "password": "password123"}).json()["access_token"]
    client.post("/api/v1/companies/me/verify", headers={"Authorization": f"Bearer {carrier_token}"})
    carrier_company_id = client.get("/api/v1/companies/me", headers={"Authorization": f"Bearer {carrier_token}"}).json()["id"]

    # 1. Create Load & Tender -> Accept (which generates shipment)
    load_payload = {
        "origin_address": "CHI", "destination_address": "DAL",
        "pickup_date": "2026-08-01T10:00:00Z", "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN", "weight_lbs": 40000
    }
    load_id = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"}).json()["id"]
    
    expires = (datetime.datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    tender_id = client.post(f"/api/v1/loads/{load_id}/tenders", json={"carrier_id": carrier_company_id, "amount": 2500.0, "expires_at": expires}, headers={"Authorization": f"Bearer {shipper_token}"}).json()["id"]
    client.post(f"/api/v1/tenders/{tender_id}/accept", headers={"Authorization": f"Bearer {carrier_token}"})
    
    # 2. Get Shipment
    shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {carrier_token}"}).json()
    assert len(shipments) == 1
    shipment_id = shipments[0]["id"]
    
    # 3. Assign Driver
    assign_payload = {"driver_name": "John Doe", "driver_phone": "555-1234", "truck_number": "TX-991"}
    res = client.post(f"/api/v1/shipments/{shipment_id}/assign-driver", json=assign_payload, headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    assert res.json()["driver_name"] == "John Doe"
    
    # 4. Update Status
    res = client.post(f"/api/v1/shipments/{shipment_id}/status", data={"status": "IN_TRANSIT"}, headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    
    # Check Load Status
    load_check = client.get("/api/v1/loads/me", headers={"Authorization": f"Bearer {shipper_token}"}).json()[0]
    assert load_check["status"] == "IN_TRANSIT"
    
    # 5. Update Location
    res = client.post(f"/api/v1/shipments/{shipment_id}/location", json={"current_location": "St. Louis, MO"}, headers={"Authorization": f"Bearer {carrier_token}"})
    assert res.status_code == 200
    assert res.json()["current_location"] == "St. Louis, MO"
    
    # 6. Upload Document
    test_file_path = "test_doc.txt"
    with open(test_file_path, "w") as f:
        f.write("Sample BOL")
        
    with open(test_file_path, "rb") as f:
        res = client.post(
            f"/api/v1/shipments/{shipment_id}/documents",
            data={"doc_type": "bol"},
            files={"file": ("test_doc.txt", f, "text/plain")},
            headers={"Authorization": f"Bearer {carrier_token}"}
        )
    assert res.status_code == 200
    assert res.json()["bol_url"] is not None
    
    os.remove(test_file_path)
