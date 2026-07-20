import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_admin.db"
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

def test_admin_flow():
    # 1. Register a user and make them SUPER_ADMIN
    payload = {
        "email": "admin@freight.com", "password": "password123",
        "first_name": "Super", "last_name": "Admin",
        "company": {"name": "Admin Co", "type": "BROKER"}
    }
    client.post("/api/v1/auth/signup", json=payload)
    token = client.post("/api/v1/auth/login", json={"email": "admin@freight.com", "password": "password123"}).json()["access_token"]
    
    # Trigger setup
    client.post("/api/v1/admin/setup", headers={"Authorization": f"Bearer {token}"})
    
    # 2. Register another company (Shipper)
    client.post("/api/v1/auth/signup", json={
        "email": "shipper@test.com", "password": "password123",
        "first_name": "John", "last_name": "Doe",
        "company": {"name": "Test Shipper", "type": "SHIPPER"}
    })
    
    # 3. View pending companies as Admin
    pending = client.get("/api/v1/admin/companies/pending", headers={"Authorization": f"Bearer {token}"}).json()
    assert len(pending) > 0 # At least the shipper is pending (admin co might be too)
    
    target_company_id = [c["id"] for c in pending if c["name"] == "Test Shipper"][0]
    
    # 4. Verify company
    client.post(f"/api/v1/admin/companies/{target_company_id}/verify", headers={"Authorization": f"Bearer {token}"})
    
    # 5. Check audit logs
    logs = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {token}"}).json()
    assert len(logs) > 0
    assert any(log["action"] == "VERIFY_COMPANY" for log in logs)
    
    # 6. Analytics
    analytics = client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {token}"}).json()
    assert analytics["total_users"] == 2
    assert analytics["total_companies"] == 2
    
    # 7. Users management
    users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"}).json()
    target_user_id = [u["id"] for u in users if u["email"] == "shipper@test.com"][0]
    
    # Suspend user
    res = client.post(f"/api/v1/admin/users/{target_user_id}/toggle-status", headers={"Authorization": f"Bearer {token}"})
    assert res.json()["is_active"] == False
