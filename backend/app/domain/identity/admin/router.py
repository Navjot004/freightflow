from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.domain.identity.admin import schemas, service
from app.core.deps import RequireRole, get_current_active_user
from app.domain.identity.schemas import CompanyResponse, UserResponse
from app.domain.identity.models import Company, VerificationStatus, User

router = APIRouter()

# Super Admin only routes
@router.get("/analytics", response_model=schemas.AnalyticsResponse)
def get_analytics(
    current_user: User = Depends(RequireRole(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.get_analytics(db)

@router.get("/companies/pending", response_model=List[CompanyResponse])
def get_pending_companies(
    current_user: User = Depends(RequireRole(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return db.query(Company).filter(Company.status == VerificationStatus.PENDING).all()

@router.post("/companies/{company_id}/verify", response_model=CompanyResponse)
def verify_company(
    company_id: str,
    current_user: User = Depends(RequireRole(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.verify_company(db, company_id, current_user.id)

@router.post("/companies/{company_id}/reject", response_model=CompanyResponse)
def reject_company(
    company_id: str,
    current_user: User = Depends(RequireRole(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.reject_company(db, company_id, current_user.id)

@router.get("/users", response_model=List[UserResponse])
def get_users(
    current_user: User = Depends(RequireRole(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return db.query(User).all()

@router.post("/users/{user_id}/toggle-status", response_model=UserResponse)
def toggle_user_status(
    user_id: str,
    current_user: User = Depends(RequireRole(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.toggle_user_status(db, user_id, current_user.id)

@router.get("/audit-logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(RequireRole(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    from app.domain.identity.admin.models import AuditLog
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()

@router.post("/setup")
def setup_super_admin(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Bootstrap endpoint: only works if no SUPER_ADMIN exists yet."""
    from app.domain.identity.models import Role
    existing_super = db.query(User).join(Role).filter(Role.name == "SUPER_ADMIN").first()
    if existing_super:
        raise HTTPException(status_code=403, detail="SUPER_ADMIN already exists. This endpoint is disabled.")
    return service.setup_super_admin(db, current_user.id)
