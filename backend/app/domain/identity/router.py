from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.domain.identity import schemas, service
from app.core.deps import get_current_active_user, RequireRole
from app.domain.identity.models import User

router = APIRouter()

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new company and its first admin user."""
    return service.register_new_company_and_user(db, user_in)

@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return a JWT."""
    return service.authenticate_user(db, user_in)

@router.post("/switch-context", response_model=schemas.ContextTokenResponse)
def switch_context(
    req: schemas.ContextSwitchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Switch context and receive a new JWT for the requested company."""
    return service.switch_context(db, current_user, req.company_id)

@router.post("/forgot-password")
def forgot_password(email: str):
    """Mock forgot password endpoint"""
    print(f"--- MOCK PASSWORD RESET EMAIL ---")
    print(f"To: {email}")
    print(f"Link: http://localhost:5173/reset-password?token=mock-token")
    print(f"---------------------------------")
    return {"message": "If the email exists, a password reset link has been sent."}

@router.post("/change-password")
def change_password(
    req: schemas.ChangePasswordRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Change user password, typically forced on first login."""
    return service.change_password(db, current_user, req.current_password, req.new_password)

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_me(
    user_in: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    return service.update_user(db, current_user.id, user_in)

