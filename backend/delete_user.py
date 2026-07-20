import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.domain.identity.models import User, Company

def delete_user_by_email(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email '{email}' not found.")
            return

        company_id = user.company_id
        
        # Delete user
        db.delete(user)
        print(f"Deleted user '{email}'.")
        
        # Optionally, check if the company has other users. If not, delete it to keep DB clean for testing.
        if company_id:
            other_users = db.query(User).filter(User.company_id == company_id).count()
            if other_users == 0:
                company = db.query(Company).filter(Company.id == company_id).first()
                if company:
                    db.delete(company)
                    print(f"Deleted empty company '{company.name}'.")
                    
        db.commit()
        print("Done.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python delete_user.py <email>")
        sys.exit(1)
        
    delete_user_by_email(sys.argv[1])
