import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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

def _get_admin_token():
    payload = {
        "email": "admin@company.com",
        "password": "strongpassword123",
        "first_name": "Admin",
        "last_name": "User",
        "company": {
            "name": "Admin Company",
            "type": "SHIPPER"
        }
    }
    client.post("/api/v1/auth/signup", json=payload)
    res = client.post("/api/v1/auth/login", json={"email": "admin@company.com", "password": "strongpassword123"})
    return res.json()["access_token"]

def test_company_stats():
    token = _get_admin_token()
    res = client.get("/api/v1/companies/me/stats", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["total_employees"] == 1
    assert res.json()["status"] == "PENDING"

def test_verify_company():
    token = _get_admin_token()
    res = client.post("/api/v1/companies/me/verify", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "VERIFIED"

def test_invite_and_accept():
    token = _get_admin_token()
    
    # 1. Invite
    invite_res = client.post(
        "/api/v1/companies/invites",
        json={"email": "newuser@company.com", "role_name": "DISPATCHER"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert invite_res.status_code == 200
    link = invite_res.json()["invite_link"]
    invite_token = link.split("token=")[1]
    
    # 2. Get invite info
    info_res = client.get(f"/api/v1/companies/invites/{invite_token}")
    assert info_res.status_code == 200
    assert info_res.json()["email"] == "newuser@company.com"
    
    # 3. Accept invite
    accept_res = client.post(
        "/api/v1/companies/invites/accept",
        json={
            "token": invite_token,
            "first_name": "New",
            "last_name": "Dispatcher",
            "password": "securepassword123"
        }
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["email"] == "newuser@company.com"
    
    # 4. Verify login works
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@company.com", "password": "securepassword123"}
    )
    assert login_res.status_code == 200
