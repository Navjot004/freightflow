from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import asc
import datetime as dt
from app.domain.marketplace.tenders.models import TenderStatus
from app.domain.marketplace.tenders.schemas import TenderCreate
from app.domain.marketplace.tenders.repository import tender_repository
from app.domain.freight.loads.models import Load, LoadStatus
from app.domain.marketplace.bids.models import Bid, BidStatus
from app.domain.identity.models import Company, VerificationStatus
from app.domain.freight.shipments.models import Shipment, ShipmentStatus
from app.domain.notifications.service import create_notification
from app.domain.notifications.models import NotificationType

def get_now_utc():
    return dt.datetime.now(dt.timezone.utc)

def verify_company_status(db: Session, company_id: str):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company or company.status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Company must be verified to perform this action.")

def check_expiry(db: Session, tender):
    if tender.status == TenderStatus.PENDING:
        now = get_now_utc()
        expires_at = tender.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=dt.timezone.utc)
            
        if expires_at < now:
            tender.status = TenderStatus.EXPIRED
            db.commit()
            db.refresh(tender)
    return tender

def send_tender(db: Session, load_id: str, shipper_id: str, tender_in: TenderCreate):
    verify_company_status(db, shipper_id)
    
    # 1. Verify Load
    load = db.query(Load).filter(Load.id == load_id, Load.shipper_id == shipper_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    if load.status in [LoadStatus.TENDER_ACCEPTED, LoadStatus.DRIVER_ASSIGNED, LoadStatus.COMPLETED, LoadStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot send tender for this load in its current status")
        
    # 2. Check if there's already an active pending tender for this load
    existing_tender = tender_repository.get_active_tender(db=db, load_id=load_id)
    
    if existing_tender:
        check_expiry(db, existing_tender)
        if existing_tender.status == TenderStatus.PENDING:
            raise HTTPException(status_code=400, detail="There is already an active tender sent for this load")
            
    # 3. Handle bid acceptance logic
    if tender_in.bid_id:
        bid = db.query(Bid).filter(Bid.id == tender_in.bid_id).first()
        if not bid or bid.status not in [BidStatus.PENDING, BidStatus.ACTIVE]:
            raise HTTPException(status_code=400, detail="Associated bid is invalid or no longer pending")
        bid.status = BidStatus.TENDER_SENT
        
    # 4. Create Tender
    expires_at = tender_in.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=dt.timezone.utc)
        

    tender = tender_repository.model(
        load_id=load_id,
        shipper_id=shipper_id,
        carrier_id=tender_in.carrier_id,
        bid_id=tender_in.bid_id,
        amount=tender_in.amount,
        expires_at=expires_at,
        status=TenderStatus.PENDING
    )
    db.add(tender)
    
    load.status = LoadStatus.TENDER_SENT
    
    create_notification(
        db, 
        tender_in.carrier_id, 
        "New Tender Offer", 
        f"You received a tender offer of ${tender.amount} for Load {load.origin_address} to {load.destination_address}.", 
        NotificationType.INFO,
        "Tender",
        tender.id,
        "/tenders/my-tenders"
    )
    
    db.commit()
    db.refresh(tender)
    return tender

def accept_tender(db: Session, tender_id: str, carrier_id: str):
    tender = tender_repository.get_by_id_and_carrier(db=db, tender_id=tender_id, carrier_id=carrier_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    check_expiry(db, tender)
    if tender.status != TenderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Tender is no longer valid")
        
    tender.status = TenderStatus.ACCEPTED
    
    if tender.bid_id:
        winning_bid = db.query(Bid).filter(Bid.id == tender.bid_id).first()
        if winning_bid:
            winning_bid.status = BidStatus.ACCEPTED
            
    other_bids = db.query(Bid).filter(
        Bid.load_id == tender.load_id,
        Bid.id != tender.bid_id if tender.bid_id else True
    ).all()
    for ob in other_bids:
        if ob.status in [BidStatus.PENDING, BidStatus.ACTIVE]:
            ob.status = BidStatus.NOT_SELECTED
    
    load = db.query(Load).filter(Load.id == tender.load_id).first()
    load.status = LoadStatus.TENDER_ACCEPTED
    
    company = db.query(Company).filter(Company.id == carrier_id).first()
    is_broker = company and company.type == "BROKER"
    
    shipment = Shipment(
        load_id=tender.load_id,
        carrier_id=tender.carrier_id,
        broker_id=tender.carrier_id if is_broker else None,
        status=ShipmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT
    )
    db.add(shipment)
    
    create_notification(
        db, 
        tender.shipper_id, 
        "Tender Accepted", 
        f"Your tender for Load {load.origin_address} to {load.destination_address} was accepted.", 
        NotificationType.SUCCESS,
        "Tender",
        tender.id,
        "/tenders/my-tenders"
    )
    
    db.commit()
    db.refresh(tender)
    return tender

def reject_tender(db: Session, tender_id: str, carrier_id: str):
    tender = tender_repository.get_by_id_and_carrier(db=db, tender_id=tender_id, carrier_id=carrier_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    check_expiry(db, tender)
    if tender.status != TenderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Tender cannot be rejected in its current status")
        
    tender.status = TenderStatus.REJECTED
    
    if tender.bid_id:
        bid = db.query(Bid).filter(Bid.id == tender.bid_id).first()
        if bid:
            bid.status = BidStatus.REJECTED
            
    load = db.query(Load).filter(Load.id == tender.load_id).first()
    
    bids = db.query(Bid).filter(
        Bid.load_id == tender.load_id,
        Bid.status.in_([BidStatus.PENDING, BidStatus.ACTIVE])
    ).all()
    
    valid_bids_exist = False
    now = get_now_utc()
    for b in bids:
        if tender.bid_id and b.id == tender.bid_id:
            continue
            
        expires_at = b.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=dt.timezone.utc)
        if expires_at < now:
            b.status = BidStatus.EXPIRED
        else:
            valid_bids_exist = True
            
    if not valid_bids_exist:
        if load.status == LoadStatus.TENDER_SENT:
            load.status = LoadStatus.OPEN_FOR_BIDDING
            create_notification(
                db, 
                tender.shipper_id, 
                "Marketplace Reopened", 
                f"All bids for Load {load.origin_address} to {load.destination_address} were exhausted. The load is now open for bidding again.", 
                NotificationType.INFO,
                "Load",
                load.id,
                f"/loads/{load.id}"
            )
        
    create_notification(
        db, 
        tender.shipper_id, 
        "Tender Rejected", 
        f"Your tender for Load {load.origin_address} to {load.destination_address} was rejected by the carrier.", 
        NotificationType.WARNING,
        "Tender",
        tender.id,
        "/tenders/my-tenders"
    )
        
    db.commit()
    db.refresh(tender)
    return tender

def auto_tender_next_bidder(db: Session, load_id: str, shipper_id: str):
    verify_company_status(db, shipper_id)
    
    load = db.query(Load).filter(Load.id == load_id, Load.shipper_id == shipper_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    active_tender = tender_repository.get_active_tender(db=db, load_id=load_id)
    
    if active_tender:
        check_expiry(db, active_tender)
        if active_tender.status == TenderStatus.PENDING:
            raise HTTPException(status_code=400, detail="There is already an active tender sent for this load")
            
    bids = db.query(Bid).filter(
        Bid.load_id == load_id,
        Bid.status.in_([BidStatus.PENDING, BidStatus.ACTIVE])
    ).order_by(asc(Bid.amount)).all()
    
    valid_bid = None
    for b in bids:
        now = get_now_utc()
        expires_at = b.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=dt.timezone.utc)
            
        if expires_at < now:
            b.status = BidStatus.EXPIRED
        else:
            valid_bid = b
            break
            
    if not valid_bid:
        if load.status == LoadStatus.TENDER_SENT:
            load.status = LoadStatus.OPEN_FOR_BIDDING
            create_notification(
                db, 
                shipper_id, 
                "Marketplace Reopened", 
                f"All bids for Load {load.origin_address} to {load.destination_address} were exhausted. The load is now open for bidding again.", 
                NotificationType.INFO,
                "Load",
                load.id,
                f"/loads/{load.id}"
            )
        db.commit() 
        raise HTTPException(status_code=404, detail="No valid pending bids left to auto-tender")
        
    tender_expires = get_now_utc() + dt.timedelta(hours=24) 
    
    valid_bid.status = BidStatus.TENDER_SENT 
    
    tender = tender_repository.model(
        load_id=load_id,
        shipper_id=shipper_id,
        carrier_id=valid_bid.carrier_id,
        bid_id=valid_bid.id,
        amount=valid_bid.amount,
        expires_at=tender_expires,
        status=TenderStatus.PENDING
    )
    db.add(tender)
    load.status = LoadStatus.TENDER_SENT
    
    db.commit()
    db.refresh(tender)
    return tender

def get_my_tenders(db: Session, company_id: str, company_type: str):
    tenders = tender_repository.get_my_tenders(db=db, company_id=company_id, company_type=company_type)
    for t in tenders:
        check_expiry(db, t)
    return tenders

def get_load_tenders(db: Session, load_id: str, shipper_id: str):
    tenders = tender_repository.get_load_tenders(db=db, load_id=load_id, shipper_id=shipper_id)
    for t in tenders:
        check_expiry(db, t)
    return tenders
