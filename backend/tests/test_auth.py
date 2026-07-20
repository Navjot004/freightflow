import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.core.security import verify_password
import uuid

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

def test_signup_success():
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "test@shipper.com",
            "password": "strongpassword123",
            "first_name": "John",
            "last_name": "Doe",
            "company": {
                "name": "Acme Shippers",
                "type": "SHIPPER"
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@shipper.com"
    assert "id" in data
    assert data["company_id"] is not None

def test_signup_duplicate_email():
    payload = {
        "email": "test@shipper.com",
        "password": "strongpassword123",
        "first_name": "John",
        "last_name": "Doe",
        "company": {
            "name": "Acme Shippers",
            "type": "SHIPPER"
        }
    }
    client.post("/api/v1/auth/signup", json=payload)
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_success():
    payload = {
        "email": "login@shipper.com",
        "password": "strongpassword123",
        "first_name": "John",
        "last_name": "Doe",
        "company": {
            "name": "Login Shippers",
            "type": "SHIPPER"
        }
    }
    client.post("/api/v1/auth/signup", json=payload)
    
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@shipper.com",
            "password": "strongpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login@shipper.com"

def test_login_invalid_password():
    payload = {
        "email": "login2@shipper.com",
        "password": "strongpassword123",
        "first_name": "John",
        "last_name": "Doe",
        "company": {
            "name": "Login2 Shippers",
            "type": "SHIPPER"
        }
    }
    client.post("/api/v1/auth/signup", json=payload)
    
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login2@shipper.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_get_me_with_token():
    payload = {
        "email": "me@shipper.com",
        "password": "strongpassword123",
        "first_name": "John",
        "last_name": "Doe",
        "company": {
            "name": "Me Shippers",
            "type": "SHIPPER"
        }
    }
    client.post("/api/v1/auth/signup", json=payload)
    
    login_res = client.post("/api/v1/auth/login", json={"email": "me@shipper.com", "password": "strongpassword123"})
    token = login_res.json()["access_token"]
    
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "me@shipper.com"


