from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.domain.marketplace.tenders import schemas, service
from app.core.deps import get_current_active_user, RequireRole
from app.domain.identity.models import User

router = APIRouter()

@router.post("/loads/{load_id}/tenders", response_model=schemas.TenderResponse)
def send_tender(
    load_id: str,
    tender_in: schemas.TenderCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SHIPPER_OPS", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Send a tender to a carrier (Shippers/Brokers only)."""
    return service.send_tender(db, load_id, current_user.company_id, tender_in)

@router.post("/loads/{load_id}/tenders/next", response_model=schemas.TenderResponse)
def auto_tender_next_bidder(
    load_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SHIPPER_OPS", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Automatically find the lowest pending bid and send a tender."""
    return service.auto_tender_next_bidder(db, load_id, current_user.company_id)

@router.get("/loads/{load_id}/tenders", response_model=List[schemas.TenderResponse])
def get_load_tenders(
    load_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SHIPPER_OPS", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Get all tenders sent for a specific load."""
    return service.get_load_tenders(db, load_id, current_user.company_id)

@router.post("/tenders/{tender_id}/accept", response_model=schemas.TenderResponse)
def accept_tender(
    tender_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Carrier accepts a tender offer."""
    return service.accept_tender(db, tender_id, current_user.company_id)

@router.post("/tenders/{tender_id}/reject", response_model=schemas.TenderResponse)
def reject_tender(
    tender_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Carrier rejects a tender offer."""
    return service.reject_tender(db, tender_id, current_user.company_id)

@router.get("/tenders/me", response_model=List[schemas.TenderResponse])
def get_my_tenders(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get tenders sent to (or sent by) the user's company."""
    return service.get_my_tenders(db, current_user.company_id, current_user.company.type)
