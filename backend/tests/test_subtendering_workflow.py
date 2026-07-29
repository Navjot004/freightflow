"""
Integration tests for Multi-Tier Sub-Tendering Workflow.

Tests:
1. Full multi-hop path: Shipper → Broker → Carrier → Owner-Operator
2. Negative margin prevention (HTTP 400)
3. Circular sub-tendering prevention
4. 1-hop partner privacy & rate masking
5. Sub-tender endpoint alias (/sub-tender)
"""
import pytest
import os
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
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

def _signup_and_get_token(email, company_type, company_name):
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

def _get_company_id(token):
    return client.get("/api/v1/companies/me", headers={"Authorization": f"Bearer {token}"}).json()["id"]

def _create_load(token, rate=3000.0):
    load_payload = {
        "origin_address": "Los Angeles, CA",
        "destination_address": "New York, NY",
        "pickup_date": "2026-08-01T10:00:00Z",
        "delivery_date": "2026-08-05T18:00:00Z",
        "equipment_type": "DRY_VAN",
        "weight_lbs": 42000,
        "rate": rate
    }
    return client.post("/api/v1/loads", json=load_payload, headers={"Authorization": f"Bearer {token}"}).json()["id"]

def _tender_and_accept(shipper_token, carrier_token, load_id, carrier_company_id, amount):
    expires = (datetime.datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    tender_res = client.post(
        f"/api/v1/loads/{load_id}/tenders",
        json={"carrier_id": carrier_company_id, "amount": amount, "expires_at": expires},
        headers={"Authorization": f"Bearer {shipper_token}"}
    )
    tender_id = tender_res.json()["id"]
    client.post(f"/api/v1/tenders/{tender_id}/accept", headers={"Authorization": f"Bearer {carrier_token}"})
    return tender_id


# ===== TEST 1: Full Multi-Hop Sub-Tendering Path =====
class TestMultiHopSubTendering:
    """Shipper($3000) → Broker($3000) → Carrier($2400) → Owner-Operator($2000)"""

    def test_full_multi_hop_path(self):
        # Setup actors
        shipper_token = _signup_and_get_token("shipper_st@acme.com", "SHIPPER", "Acme Shipping")
        broker_token = _signup_and_get_token("broker_st@logistics.com", "BROKER", "National Logistics")
        carrier_token = _signup_and_get_token("carrier_st@swift.com", "CARRIER", "Swift Transport")
        oo_token = _signup_and_get_token("oo_st@independent.com", "OWNER_OPERATOR", "Joe's Trucking")

        broker_id = _get_company_id(broker_token)
        carrier_id = _get_company_id(carrier_token)
        oo_id = _get_company_id(oo_token)

        # Step 1: Shipper creates Load at $3,000 and Tenders to Broker
        load_id = _create_load(shipper_token, rate=3000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 3000.0)

        # Step 2: Broker gets shipment
        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        assert len(broker_shipments) >= 1
        shipment_id = broker_shipments[0]["id"]
        assert broker_shipments[0]["shipper_rate"] == 3000.0

        # Step 3: Broker assigns Carrier at $2,400 (keeps $600 margin)
        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": carrier_id, "agreed_rate": 2400.0, "notes": "Execute at $2,400"},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        assert assign_res.status_code == 200, assign_res.text
        assignment1_id = assign_res.json()["id"]
        assert assign_res.json()["agreed_rate"] == 2400.0

        # Step 4: Carrier accepts assignment
        accept_res = client.post(f"/api/v1/partner-assignments/{assignment1_id}/accept", headers={"Authorization": f"Bearer {carrier_token}"})
        assert accept_res.status_code == 200, accept_res.text

        # Step 5: Carrier sub-tenders to Owner-Operator at $2,000 (keeps $400 margin)
        assign2_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": oo_id, "agreed_rate": 2000.0, "notes": "Final mile"},
            headers={"Authorization": f"Bearer {carrier_token}"}
        )
        assert assign2_res.status_code == 200, assign2_res.text
        assignment2_id = assign2_res.json()["id"]

        # Step 6: Owner-Operator accepts
        accept2_res = client.post(f"/api/v1/partner-assignments/{assignment2_id}/accept", headers={"Authorization": f"Bearer {oo_token}"})
        assert accept2_res.status_code == 200, accept2_res.text

    def test_sub_tender_endpoint_alias(self):
        """Test that /sub-tender endpoint works as alias for /assign-partner"""
        shipper_token = _signup_and_get_token("shipper_alias@acme.com", "SHIPPER", "Acme Shipping 2")
        broker_token = _signup_and_get_token("broker_alias@logistics.com", "BROKER", "National Logistics 2")
        carrier_token = _signup_and_get_token("carrier_alias@swift.com", "CARRIER", "Swift Transport 2")

        broker_id = _get_company_id(broker_token)
        carrier_id = _get_company_id(carrier_token)

        load_id = _create_load(shipper_token, rate=2500.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 2500.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        # Use /sub-tender endpoint
        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/sub-tender",
            json={"partner_id": carrier_id, "agreed_rate": 2000.0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        assert assign_res.status_code == 200, assign_res.text
        assert assign_res.json()["agreed_rate"] == 2000.0


# ===== TEST 2: Negative Margin Prevention =====
class TestNegativeMarginPrevention:

    def test_broker_negative_margin_blocked(self):
        """Broker tries to assign at rate higher than shipper rate — should fail"""
        shipper_token = _signup_and_get_token("shipper_nm@acme.com", "SHIPPER", "Acme NM")
        broker_token = _signup_and_get_token("broker_nm@logistics.com", "BROKER", "Broker NM")
        carrier_token = _signup_and_get_token("carrier_nm@swift.com", "CARRIER", "Swift NM")

        broker_id = _get_company_id(broker_token)
        carrier_id = _get_company_id(carrier_token)

        load_id = _create_load(shipper_token, rate=2000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 2000.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        # Try to assign at $2,500 (exceeds $2,000 shipper rate) → negative margin
        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": carrier_id, "agreed_rate": 2500.0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        assert assign_res.status_code == 400
        assert "negative margin" in assign_res.json()["detail"].lower()

    def test_zero_rate_blocked(self):
        """Zero or negative offered rate should fail"""
        shipper_token = _signup_and_get_token("shipper_zr@acme.com", "SHIPPER", "Acme ZR")
        broker_token = _signup_and_get_token("broker_zr@logistics.com", "BROKER", "Broker ZR")
        carrier_token = _signup_and_get_token("carrier_zr@swift.com", "CARRIER", "Swift ZR")

        broker_id = _get_company_id(broker_token)
        carrier_id = _get_company_id(carrier_token)

        load_id = _create_load(shipper_token, rate=2000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 2000.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": carrier_id, "agreed_rate": 0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        assert assign_res.status_code == 400
        assert "greater than zero" in assign_res.json()["detail"].lower()

    def test_positive_margin_allowed(self):
        """Assign at a rate lower than incoming rate → positive margin → allowed"""
        shipper_token = _signup_and_get_token("shipper_pm@acme.com", "SHIPPER", "Acme PM")
        broker_token = _signup_and_get_token("broker_pm@logistics.com", "BROKER", "Broker PM")
        carrier_token = _signup_and_get_token("carrier_pm@swift.com", "CARRIER", "Swift PM")

        broker_id = _get_company_id(broker_token)
        carrier_id = _get_company_id(carrier_token)

        load_id = _create_load(shipper_token, rate=3000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 3000.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": carrier_id, "agreed_rate": 2500.0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        assert assign_res.status_code == 200


# ===== TEST 3: Circular Sub-Tendering Prevention =====
class TestCircularSubTendering:

    def test_cannot_subtender_to_self(self):
        """Broker tries to assign to itself — should fail"""
        shipper_token = _signup_and_get_token("shipper_cs@acme.com", "SHIPPER", "Acme CS")
        broker_token = _signup_and_get_token("broker_cs@logistics.com", "BROKER", "Broker CS")

        broker_id = _get_company_id(broker_token)

        load_id = _create_load(shipper_token, rate=2000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 2000.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": broker_id, "agreed_rate": 1500.0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        assert assign_res.status_code == 400
        assert "yourself" in assign_res.json()["detail"].lower()

    def test_cannot_subtender_back_to_shipper(self):
        """Broker tries to sub-tender back to the original Shipper — should fail"""
        shipper_token = _signup_and_get_token("shipper_bs@acme.com", "SHIPPER", "Acme BS")
        broker_token = _signup_and_get_token("broker_bs@logistics.com", "BROKER", "Broker BS")

        broker_id = _get_company_id(broker_token)
        shipper_id = _get_company_id(shipper_token)

        load_id = _create_load(shipper_token, rate=2000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 2000.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": shipper_id, "agreed_rate": 1500.0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        # Shipper won't be VERIFIED as a partner (invalid partner type), so 400
        assert assign_res.status_code == 400


# ===== TEST 4: 1-Hop Partner Privacy & Rate Masking =====
class TestPartnerPrivacyMasking:

    def test_carrier_cannot_see_shipper_rate(self):
        """After broker assigns carrier, carrier should NOT see shipper_rate"""
        shipper_token = _signup_and_get_token("shipper_pp@acme.com", "SHIPPER", "Acme PP")
        broker_token = _signup_and_get_token("broker_pp@logistics.com", "BROKER", "Broker PP")
        carrier_token = _signup_and_get_token("carrier_pp@swift.com", "CARRIER", "Swift PP")

        broker_id = _get_company_id(broker_token)
        carrier_id = _get_company_id(carrier_token)

        load_id = _create_load(shipper_token, rate=3000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 3000.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": carrier_id, "agreed_rate": 2400.0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        assignment_id = assign_res.json()["id"]
        client.post(f"/api/v1/partner-assignments/{assignment_id}/accept", headers={"Authorization": f"Bearer {carrier_token}"})

        # Carrier's view
        carrier_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {carrier_token}"}).json()
        assert len(carrier_shipments) >= 1
        carrier_view = carrier_shipments[0]

        # shipper_rate must be masked
        assert carrier_view["shipper_rate"] is None
        # carrier_rate should be visible (their pay rate)
        assert carrier_view["carrier_rate"] == 2400.0
        # Shipper name masked
        assert "Client (via Broker PP)" in carrier_view["load"]["shipper"]["name"]

    def test_shipper_cannot_see_carrier_rate(self):
        """Shipper should NOT see carrier buy rate or partner rates"""
        shipper_token = _signup_and_get_token("shipper_sc@acme.com", "SHIPPER", "Acme SC")
        broker_token = _signup_and_get_token("broker_sc@logistics.com", "BROKER", "Broker SC")
        carrier_token = _signup_and_get_token("carrier_sc@swift.com", "CARRIER", "Swift SC")

        broker_id = _get_company_id(broker_token)
        carrier_id = _get_company_id(carrier_token)

        load_id = _create_load(shipper_token, rate=3000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 3000.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        assign_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": carrier_id, "agreed_rate": 2400.0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        assignment_id = assign_res.json()["id"]
        client.post(f"/api/v1/partner-assignments/{assignment_id}/accept", headers={"Authorization": f"Bearer {carrier_token}"})

        # Shipper's view
        shipper_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {shipper_token}"}).json()
        shipper_view = shipper_shipments[0]

        assert shipper_view["shipper_rate"] == 3000.0
        assert shipper_view["carrier_rate"] is None
        assert shipper_view["partner_rate"] is None

    def test_broker_cannot_see_partner_rate(self):
        """Broker should NOT see downstream sub-contractor's rate"""
        shipper_token = _signup_and_get_token("shipper_bp@acme.com", "SHIPPER", "Acme BP")
        broker_token = _signup_and_get_token("broker_bp@logistics.com", "BROKER", "Broker BP")
        carrier_token = _signup_and_get_token("carrier_bp@swift.com", "CARRIER", "Swift BP")
        oo_token = _signup_and_get_token("oo_bp@independent.com", "OWNER_OPERATOR", "Joe BP Trucking")

        broker_id = _get_company_id(broker_token)
        carrier_id = _get_company_id(carrier_token)
        oo_id = _get_company_id(oo_token)

        load_id = _create_load(shipper_token, rate=3000.0)
        _tender_and_accept(shipper_token, broker_token, load_id, broker_id, 3000.0)

        broker_shipments = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        shipment_id = broker_shipments[0]["id"]

        # Broker → Carrier
        assign1_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": carrier_id, "agreed_rate": 2400.0},
            headers={"Authorization": f"Bearer {broker_token}"}
        )
        a1_id = assign1_res.json()["id"]
        client.post(f"/api/v1/partner-assignments/{a1_id}/accept", headers={"Authorization": f"Bearer {carrier_token}"})

        # Carrier → Owner-Operator
        assign2_res = client.post(
            f"/api/v1/shipments/{shipment_id}/assign-partner",
            json={"partner_id": oo_id, "agreed_rate": 2000.0},
            headers={"Authorization": f"Bearer {carrier_token}"}
        )
        a2_id = assign2_res.json()["id"]
        client.post(f"/api/v1/partner-assignments/{a2_id}/accept", headers={"Authorization": f"Bearer {oo_token}"})

        # Broker's view — should NOT see partner_rate
        broker_view = client.get("/api/v1/shipments/me", headers={"Authorization": f"Bearer {broker_token}"}).json()
        assert broker_view[0]["partner_rate"] is None
        assert broker_view[0]["shipper_rate"] == 3000.0
