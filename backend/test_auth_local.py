import string
import random
from app.db.database import SessionLocal
from app.domain.identity import schemas, service
from app.core.deps import get_current_user
from app.core.security import create_access_token

def test_auth():
    db = SessionLocal()
    try:
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        email = f"test_{suffix}@example.com"
        company_name = f"Company_{suffix}"
        
        user_in = schemas.UserCreate(
            email=email,
            password="Password123!",
            first_name="Test",
            last_name="User",
            company=schemas.CompanyCreate(name=company_name, type="BROKER")
        )
        
        print("1. Testing Registration...")
        user = service.register_new_company_and_user(db, user_in)
        company_id = user.company_id
        print("Registration successful.")
        
        print("2. Testing Login...")
        login_in = schemas.UserLogin(email=email, password="Password123!")
        token_res = service.authenticate_user(db, login_in)
        base_token = token_res["access_token"]
        print("Login successful, Base Token generated.")
        
        print("3. Testing Context Decoding...")
        decoded_user = get_current_user(db=db, token=base_token)
        print(f"Decoded User Active Company: {decoded_user.active_company_id}")
        assert decoded_user.active_company_id == company_id, "Base token should default to primary company"
        
        print("4. Testing Switch Context...")
        switch_res = service.switch_context(db, decoded_user, company_id)
        context_token = switch_res["access_token"]
        print("Switch Context successful, Context Token generated.")
        
        print("5. Testing Context Token Decoding...")
        decoded_context_user = get_current_user(db=db, token=context_token)
        print(f"Decoded Context User Active Company: {decoded_context_user.active_company_id}")
        assert decoded_context_user.active_company_id == company_id, "Context token should decode active company correctly"
        
        print("6. Verifying Outbox Events...")
        from app.core.models import DomainEventRecord, OutboxEvent
        events = db.query(DomainEventRecord).all()
        outbox = db.query(OutboxEvent).all()
        assert len(events) >= 1, "Should have created a DomainEventRecord"
        assert len(outbox) >= 1, "Should have created an OutboxEvent"
        print(f"Found {len(events)} DomainEventRecord(s) and {len(outbox)} OutboxEvent(s).")
        
        print("ALL INTERNAL TESTS PASSED SUCCESSFULLY!")
    finally:
        db.close()

if __name__ == "__main__":
    test_auth()
