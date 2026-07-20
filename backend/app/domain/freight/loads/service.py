from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.domain.freight.loads.models import LoadStatus
from app.domain.freight.loads.schemas import LoadCreate, LoadUpdate
from app.domain.freight.loads.repository import load_repository
from app.domain.identity.models import Company, VerificationStatus
from app.domain.marketplace.bids.models import Bid, BidStatus
from app.domain.marketplace.tenders.models import Tender, TenderStatus
from app.domain.notifications.service import create_notification
from app.domain.notifications.models import NotificationType

from app.core.workflow import WorkflowStateEngine

def verify_company_status(db: Session, company_id: str):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company or company.status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Company must be verified to perform this action.")

def create_load(db: Session, shipper_id: str, load_in: LoadCreate):
    verify_company_status(db, shipper_id)
    return load_repository.create_with_shipper(db=db, obj_in=load_in, shipper_id=shipper_id)

def get_my_loads(db: Session, shipper_id: str, skip: int = 0, limit: int = 100):
    return load_repository.get_my_loads(db=db, shipper_id=shipper_id, skip=skip, limit=limit)

def update_load(db: Session, load_id: str, shipper_id: str, load_in: LoadUpdate):
    load = load_repository.get_by_id_and_shipper(db=db, load_id=load_id, shipper_id=shipper_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    if load_in.status and load_in.status != load.status:
        WorkflowStateEngine.enforce_load_transition(load.status, load_in.status)
    elif not load_in.status and load.status not in [LoadStatus.DRAFT, LoadStatus.OPEN_FOR_BIDDING]:
        # Edits to load details are only allowed in early phases
        raise HTTPException(status_code=400, detail="Load details cannot be edited in its current status")
    
    return load_repository.update(db=db, db_obj=load, obj_in=load_in)

def cancel_load(db: Session, load_id: str, shipper_id: str):
    load = load_repository.get_by_id_and_shipper(db=db, load_id=load_id, shipper_id=shipper_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    WorkflowStateEngine.enforce_load_transition(load.status, LoadStatus.CANCELLED)
    
    load.status = LoadStatus.CANCELLED
    
    # Cascade to pending bids
    pending_bids = db.query(Bid).filter(Bid.load_id == load_id, Bid.status == BidStatus.PENDING).all()
    for bid in pending_bids:
        bid.status = BidStatus.WITHDRAWN
        create_notification(
            db, 
            bid.carrier_id, 
            "Load Cancelled", 
            f"The load from {load.origin_address} to {load.destination_address} was cancelled. Your bid is withdrawn.", 
            NotificationType.WARNING,
            "Load",
            load.id,
            f"/loads/{load.id}"
        )
        
    # Cascade to pending tenders
    pending_tenders = db.query(Tender).filter(Tender.load_id == load_id, Tender.status == TenderStatus.PENDING).all()
    for tender in pending_tenders:
        tender.status = TenderStatus.REJECTED
        create_notification(
            db, 
            tender.carrier_id, 
            "Load Cancelled", 
            f"The load from {load.origin_address} to {load.destination_address} was cancelled. The tender offer is withdrawn.", 
            NotificationType.WARNING,
            "Load",
            load.id,
            f"/loads/{load.id}"
        )

    db.commit()
    db.refresh(load)
    return load

def search_marketplace(
    db: Session, 
    skip: int = 0, 
    limit: int = 20, 
    search: str = None, 
    equipment_type: str = None,
    sort_by: str = "created_at",
    sort_desc: bool = True,
    current_user_company_id: str = None
):
    from app.domain.marketplace.bids.models import Bid

    total, items = load_repository.get_marketplace_loads(
        db=db, skip=skip, limit=limit, search=search, 
        equipment_type=equipment_type, sort_by=sort_by, sort_desc=sort_desc
    )

    load_ids = [item.id for item in items]
    bidded_load_ids = set()
    if current_user_company_id and load_ids:
        bids = db.query(Bid.load_id).filter(
            Bid.carrier_id == current_user_company_id,
            Bid.load_id.in_(load_ids)
        ).all()
        bidded_load_ids = {b[0] for b in bids}

    for item in items:
        item.current_user_has_bidded = item.id in bidded_load_ids
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }

