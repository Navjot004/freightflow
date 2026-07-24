from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.domain.freight.disputes import schemas, service
from app.core.deps import RequireRole, get_current_active_user
from app.domain.identity.models import User
from app.domain.freight.disputes.models import Dispute

router = APIRouter()

@router.post("", response_model=schemas.DisputeResponse)
def create_dispute(
    dispute_in: schemas.DisputeCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER", "DRIVER", "OWNER_OPERATOR"])),
    db: Session = Depends(get_db)
):
    return service.create_dispute(db, dispute_in, current_user.company_id)

@router.get("", response_model=List[schemas.DisputeResponse])
def get_disputes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role.name == "SUPER_ADMIN":
        return db.query(Dispute).order_by(Dispute.created_at.desc()).all()
    else:
        return db.query(Dispute).filter(
            (Dispute.raised_by_company_id == current_user.company_id) | 
            (Dispute.against_company_id == current_user.company_id)
        ).order_by(Dispute.created_at.desc()).all()

@router.post("/{dispute_id}/resolve", response_model=schemas.DisputeResponse)
def resolve_dispute(
    dispute_id: str,
    resolve_in: schemas.DisputeResolve,
    current_user: User = Depends(RequireRole(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.resolve_dispute(db, dispute_id, resolve_in, current_user.id)
