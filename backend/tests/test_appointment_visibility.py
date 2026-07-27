import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db

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

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_appointments.db"):
        try:
            os.remove("test_appointments.db")
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

def test_appointment_role_based_visibility():
    shipper_token = _get_token("shipper_apt@acme.com", "SHIPPER", "Acme Shipper")
    carrier_token = _get_token("carrier_apt@swift.com", "CARRIER", "Swift Express")

    # 1. Shipper creates Load with confidential facility appointments and contacts
    load_payload = {
        "origin_address": "Chicago, IL",
        "destination_address": "Dallas, TX",
        "pickup_date": "2026-08-01T10:00:00Z",
        "delivery_date": "2026-08-03T18:00:00Z",
        "equipment_type": "DRY_VAN",
        "weight_lbs": 40000,
        "rate": 2500.0,
        "pickup_appointment_date": "2026-08-01T09:00:00Z",
        "pickup_appointment_time": "09:00 - 11:00 AM",
        "pickup_contact_person": "John Dock Manager",
        "pickup_contact_number": "555-0199",
        "pickup_dock_number": "Dock #14",
        "pickup_reference_number": "PU-998822",
        "delivery_appointment_date": "2026-08-03T14:00:00Z",
        "delivery_appointment_time": "02:00 PM Sharp",
        "delivery_contact_person": "Sarah Receiving Supervisor",
        "delivery_contact_number": "555-0288",
        "delivery_dock_number": "Dock #B",
        "delivery_reference_number": "PO-445566"
    }

    create_res = client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {shipper_token}"})
    assert create_res.status_code == 200, create_res.text
    load_id = create_res.json()["id"]

    # 2. Shipper retrieves load by ID -> full appointment & contact info visible
    load_res = client.get(f"/api/v1/loads/{load_id}", headers={"Authorization": f"Bearer {shipper_token}"})
    assert load_res.status_code == 200
    data = load_res.json()

    assert data["pickup_appointment_time"] == "09:00 - 11:00 AM"
    assert data["pickup_contact_person"] == "John Dock Manager"
    assert data["pickup_contact_number"] == "555-0199"
    assert data["pickup_dock_number"] == "Dock #14"
    assert data["delivery_contact_person"] == "Sarah Receiving Supervisor"
    assert data["delivery_dock_number"] == "Dock #B"

    # 3. Carrier retrieves load by ID -> full appointment details accessible
    carrier_load_res = client.get(f"/api/v1/loads/{load_id}", headers={"Authorization": f"Bearer {carrier_token}"})
    assert carrier_load_res.status_code == 200
    carrier_data = carrier_load_res.json()
    assert carrier_data["pickup_appointment_time"] == "09:00 - 11:00 AM"
    assert carrier_data["pickup_dock_number"] == "Dock #14"
    assert carrier_data["delivery_dock_number"] == "Dock #B"
