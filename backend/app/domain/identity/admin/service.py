from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.domain.identity.admin.models import AuditLog
from app.domain.identity.models import Company, User, VerificationStatus, Role
from app.domain.freight.loads.models import Load
from app.domain.freight.disputes.models import Dispute, DisputeStatus
from app.domain.identity.admin.repository import audit_log_repository
from app.domain.identity.repository import company_repository, user_repository, role_repository

def log_action(db: Session, admin_id: str, action: str, target_id: str = None, details: dict = None):
    audit_log = audit_log_repository.model(admin_user_id=admin_id, action=action, target_entity_id=target_id, details=details or {})
    db.add(audit_log)
    db.commit()

def get_analytics(db: Session):
    return {
        "total_users": db.query(User).count(),
        "total_companies": db.query(Company).count(),
        "pending_companies": db.query(Company).filter(Company.status == VerificationStatus.PENDING).count(),
        "total_loads": db.query(Load).count(),
        "active_disputes": db.query(Dispute).filter(Dispute.status.in_([DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW])).count()
    }

def verify_company(db: Session, company_id: str, admin_id: str):
    comp = company_repository.get(db=db, id=company_id)
    if not comp: raise HTTPException(404, "Company not found")
    comp.status = VerificationStatus.VERIFIED
    log_action(db, admin_id, "VERIFY_COMPANY", company_id, {"previous": "PENDING", "new": "VERIFIED"})
    db.commit()
    return comp

def reject_company(db: Session, company_id: str, admin_id: str):
    comp = company_repository.get(db=db, id=company_id)
    if not comp: raise HTTPException(404, "Company not found")
    comp.status = VerificationStatus.REJECTED
    log_action(db, admin_id, "REJECT_COMPANY", company_id, {"previous": "PENDING", "new": "REJECTED"})
    db.commit()
    return comp

def toggle_user_status(db: Session, user_id: str, admin_id: str):
    user = user_repository.get(db=db, id=user_id)
    if not user: raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    log_action(db, admin_id, "TOGGLE_USER", user_id, {"new_status": user.is_active})
    db.commit()
    return user

def setup_super_admin(db: Session, user_id: str):
    """Temporary endpoint for POC to create super admin."""
    role = role_repository.get_by_name(db=db, name="SUPER_ADMIN")
    if not role:
        role = Role(name="SUPER_ADMIN", permissions=["*"])
        db.add(role)
        db.commit()
        db.refresh(role)
        
    user = user_repository.get(db=db, id=user_id)
    if not user: raise HTTPException(404, "User not found")
    user.role_id = role.id
    db.commit()
    return {"message": "You are now SUPER_ADMIN"}

