from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.domain.marketplace.bids import schemas, service
from app.core.deps import get_current_active_user, RequireRole
from app.domain.identity.models import User

router = APIRouter()

@router.post("/loads/{load_id}/bids", response_model=schemas.BidResponse)
def submit_bid(
    load_id: str,
    bid_in: schemas.BidCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Submit a bid for a load (Carriers/Owner Operators only)."""
    return service.submit_bid(db, load_id, current_user.company_id, bid_in)

@router.get("/bids/me", response_model=List[schemas.BidResponse])
def get_my_bids(
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Get all bids placed by the carrier's company."""
    return service.get_my_bids(db, current_user.company_id)

@router.put("/bids/{bid_id}", response_model=schemas.BidResponse)
def edit_bid(
    bid_id: str,
    bid_in: schemas.BidUpdate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Edit an active pending bid."""
    return service.edit_bid(db, bid_id, current_user.company_id, bid_in)

@router.patch("/bids/{bid_id}/withdraw", response_model=schemas.BidResponse)
def withdraw_bid(
    bid_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Withdraw an active pending bid."""
    return service.withdraw_bid(db, bid_id, current_user.company_id)

@router.get("/loads/{load_id}/bids", response_model=List[schemas.BidResponse])
def get_load_bids(
    load_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SHIPPER_OPS", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Get all bids for a specific load (Shipper only)."""
    return service.get_bids_for_load(db, load_id, current_user.company_id)

