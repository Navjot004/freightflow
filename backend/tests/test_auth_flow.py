import pytest
import string
import random
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
    Base.metadata.create_all(bind=engine)
    yield

def test_auth_flow():
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    email = f"test_{suffix}@example.com"
    company_name = f"Company_{suffix}"
    
    signup_data = {
        "email": email,
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "User",
        "company": {
            "name": company_name,
            "type": "BROKER"
        }
    }
    
    res = client.post("/api/v1/auth/signup", json=signup_data)
    assert res.status_code == 200, f"Signup failed: {res.text}"
    user_data = res.json()
    company_id = user_data["company_id"]
    
    login_data = {"email": email, "password": "Password123!"}
    res = client.post("/api/v1/auth/login", json=login_data)
    assert res.status_code == 200, f"Login failed: {res.text}"
    base_token = res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {base_token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200, f"/me failed: {res.text}"
    
    switch_data = {"company_id": company_id}
    res = client.post("/api/v1/auth/switch-context", json=switch_data, headers=headers)
    assert res.status_code == 200, f"Switch Context failed: {res.text}"
    context_token = res.json()["access_token"]
    
    context_headers = {"Authorization": f"Bearer {context_token}"}
    res = client.get("/api/v1/auth/me", headers=context_headers)
    assert res.status_code == 200, f"/me with context token failed: {res.text}"
