from app.db.database import SessionLocal
from app.domain.identity.admin.service import toggle_user_status

def test_toggle():
    db = SessionLocal()
    try:
        res = toggle_user_status(db, "7f9103ee-724b-4448-989c-2a9964ec981e", "d6f12aca-1110-4705-a200-42204d366e4c")
        print(f"Success toggling user {res.id}: is_active={res.is_active}")
        # Toggle back to restore initial state
        res2 = toggle_user_status(db, "7f9103ee-724b-4448-989c-2a9964ec981e", "d6f12aca-1110-4705-a200-42204d366e4c")
        print(f"Restored user {res2.id}: is_active={res2.is_active}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_toggle()
