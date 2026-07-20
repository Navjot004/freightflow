import os
import sys

# Add the current directory to sys.path so 'app' can be resolved
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.domain.identity.models import User, Role, Company, CompanyType, VerificationStatus
from app.core.security import get_password_hash

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def create_super_admin():
    db = SessionLocal()
    try:
        # 1. Create or get SUPER_ADMIN role
        role = db.query(Role).filter(Role.name == "SUPER_ADMIN").first()
        if not role:
            role = Role(name="SUPER_ADMIN", permissions=["ALL"])
            db.add(role)
            db.commit()
            db.refresh(role)
        
        # 2. Create or get System company
        company = db.query(Company).filter(Company.name == "System Admin").first()
        if not company:
            company = Company(
                name="System Admin",
                type=CompanyType.BROKER, # or whatever type is acceptable
                status=VerificationStatus.VERIFIED
            )
            db.add(company)
            db.commit()
            db.refresh(company)
            
        # 3. Create Super Admin User
        email = "admin@freightflow.com"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash=get_password_hash("Admin@123!"),
                first_name="Super",
                last_name="Admin",
                company_id=company.id,
                role_id=role.id
            )
            db.add(user)
            db.commit()
            print(f"Super admin created: {email} / Admin@123!")
        else:
            print(f"Super admin already exists: {email} / Admin@123!")
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()
