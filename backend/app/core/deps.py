from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import get_db
from app.domain.identity.models import User, Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    # Phase 2: Context Extraction
    user.active_company_id = payload.get("context_company_id", user.company_id)
    user.active_role_id = payload.get("context_role_id", user.role_id)
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RequireRole:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
        # Phase 2: Read from active context rather than hardcoded DB role
        role_id_to_check = getattr(current_user, "active_role_id", current_user.role_id)
        role = db.query(Role).filter(Role.id == role_id_to_check).first()
        if not role:
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
        # SUPER_ADMIN bypasses all role checks
        if role.name == "SUPER_ADMIN":
            return current_user
            
        if role.name not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
        return current_user
