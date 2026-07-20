from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import datetime as dt
from app.domain.marketplace.bids.models import Bid, BidStatus
from app.domain.marketplace.bids.schemas import BidCreate, BidUpdate
from app.domain.marketplace.bids.repository import bid_repository
from app.domain.freight.loads.models import Load, LoadStatus
from app.domain.identity.models import Company, VerificationStatus
from app.domain.notifications.service import create_notification
from app.domain.notifications.models import NotificationType

def get_now_utc():
    # Use timezone-aware UTC now
    return dt.datetime.now(dt.timezone.utc)

def verify_company_status(db: Session, company_id: str):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company or company.status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Company must be verified to perform this action.")

def submit_bid(db: Session, load_id: str, carrier_id: str, bid_in: BidCreate):
    verify_company_status(db, carrier_id)
    
    carrier_company = db.query(Company).filter(Company.id == carrier_id).first()
    if carrier_company.type not in ["CARRIER", "OWNER_OPERATOR", "BROKER"]:
        raise HTTPException(status_code=403, detail="Only carriers, owner operators, and brokers can submit bids")
        
    # Check insurance expiry
    if getattr(carrier_company, 'insurance_expiry_date', None):
        if carrier_company.insurance_expiry_date < dt.date.today():
            raise HTTPException(status_code=403, detail="Cannot submit bid: Carrier insurance is expired.")
            
    # 1. Verify Load is open
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load.status != LoadStatus.OPEN_FOR_BIDDING:
        raise HTTPException(status_code=400, detail="Load is not open for bidding")
        
    # 2. Check if user already has an active bid
    existing_bid = bid_repository.get_active_bid(db=db, load_id=load_id, carrier_id=carrier_id)
    if existing_bid:
        raise HTTPException(status_code=400, detail="You already have an active bid on this load")

    # 3. Create Bid
    expires_at = bid_in.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=dt.timezone.utc)
        
    bid = Bid(
        load_id=load_id,
        carrier_id=carrier_id,
        amount=bid_in.amount,
        notes=bid_in.notes,
        available_pickup_date=bid_in.available_pickup_date,
        transit_time_estimate_hours=bid_in.transit_time_estimate_hours,
        expires_at=expires_at,
        status=BidStatus.PENDING
    )
    db.add(bid)
    
    # Notify Shipper
    create_notification(
        db, 
        load.shipper_id, 
        "New Bid Received", 
        f"A new bid of ${bid.amount} was received for Load {load.origin_address} to {load.destination_address}.", 
        NotificationType.INFO,
        "Load",
        load.id,
        f"/loads/{load.id}"
    )
    
    db.commit()
    db.refresh(bid)
    return bid

def check_expiry(db: Session, bid: Bid):
    if bid.status == BidStatus.PENDING:
        now = get_now_utc()
        bid_expiry = bid.expires_at
        if bid_expiry.tzinfo is None:
            bid_expiry = bid_expiry.replace(tzinfo=dt.timezone.utc)
            
        if bid_expiry < now:
            bid.status = BidStatus.EXPIRED
            db.commit()
            db.refresh(bid)
    return bid

def get_my_bids(db: Session, carrier_id: str):
    bids = bid_repository.get_my_bids(db=db, carrier_id=carrier_id)
    # Passive Expiry Check
    for b in bids:
        check_expiry(db, b)
    return bids

def edit_bid(db: Session, bid_id: str, carrier_id: str, bid_in: BidUpdate):
    bid = bid_repository.get_by_id_and_carrier(db=db, bid_id=bid_id, carrier_id=carrier_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    check_expiry(db, bid)
    
    if bid.status != BidStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending bids can be edited")
        
    update_data = bid_in.model_dump(exclude_unset=True)
    if "expires_at" in update_data and update_data["expires_at"].tzinfo is None:
        update_data["expires_at"] = update_data["expires_at"].replace(tzinfo=dt.timezone.utc)
        
    return bid_repository.update(db=db, db_obj=bid, obj_in=update_data)

def withdraw_bid(db: Session, bid_id: str, carrier_id: str):
    bid = bid_repository.get_by_id_and_carrier(db=db, bid_id=bid_id, carrier_id=carrier_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    check_expiry(db, bid)
    
    if bid.status != BidStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending bids can be withdrawn")
        
    bid.status = BidStatus.WITHDRAWN
    db.commit()
    db.refresh(bid)
    return bid

def get_bids_for_load(db: Session, load_id: str, shipper_id: str):
    # Verify load belongs to shipper
    load = db.query(Load).filter(Load.id == load_id, Load.shipper_id == shipper_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    bids = bid_repository.get_bids_for_load(db=db, load_id=load_id)
    
    for b in bids:
        check_expiry(db, b)
        
    return bids


