from fastapi import HTTPException
from sqlalchemy.orm import Session
import datetime as dt
from app.domain.organizations.partnerships.models import Partnership, PartnershipStatus, CarrierProfile
from app.domain.organizations.partnerships.schemas import PartnershipRequestCreate, PartnerDirectoryItem, CarrierProfileResponse
from app.domain.identity.models import Company, VerificationStatus, CompanyType, CompanyVehicle
from app.domain.notifications.service import create_notification
from app.domain.notifications.models import NotificationType

from app.domain.identity.repository import company_repository, company_vehicle_repository
from app.domain.organizations.partnerships.repository import partnership_repository, carrier_profile_repository

def get_now_utc():
    return dt.datetime.now(dt.timezone.utc)

def ensure_carrier_profile(db: Session, company_id: str):
    profile = carrier_profile_repository.get_by_company(db=db, company_id=company_id)
    if not profile:
        profile = carrier_profile_repository.model(company_id=company_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def get_carrier_directory(db: Session, broker_id: str = None):
    # Only return verified partners (Carrier or Owner Operator)
    from sqlalchemy import or_
    partners = db.query(Company).filter(
        or_(Company.type == CompanyType.CARRIER, Company.type == CompanyType.OWNER_OPERATOR, Company.type == CompanyType.BROKER),
        Company.status == VerificationStatus.VERIFIED
    ).all()
    
    # Filter out the current user's company
    if broker_id:
        partners = [p for p in partners if p.id != broker_id]
    
    directory = []
    for partner in partners:
        profile = None
        vehicle_dict = None
        if partner.type == CompanyType.CARRIER:
            profile = ensure_carrier_profile(db, partner.id)
        elif partner.type == CompanyType.OWNER_OPERATOR:
            vehicle = company_vehicle_repository.get_by_company(db=db, company_id=partner.id)
            if vehicle:
                vehicle_dict = {
                    "truck_number": vehicle.truck_number,
                    "equipment_type": vehicle.equipment_type,
                    "capacity_lbs": vehicle.capacity_lbs
                }
        
        status = None
        partnership_id = None
        if broker_id:
            pship = partnership_repository.get_any_direction(db=db, company_a=broker_id, company_b=partner.id)
            if pship:
                status = pship.status
                partnership_id = pship.id
                
        directory.append(PartnerDirectoryItem(
            company=partner,
            profile=profile,
            vehicle=vehicle_dict,
            partnership_status=status,
            partnership_id=partnership_id
        ))
    return directory

def request_partnership(db: Session, broker_id: str, request_in: PartnershipRequestCreate):
    sender = company_repository.get(db=db, id=broker_id)
    if sender.type not in [CompanyType.BROKER, CompanyType.CARRIER, CompanyType.OWNER_OPERATOR]:
        raise HTTPException(status_code=403, detail="Only Brokers, Carriers, and Owner Operators can send partnership requests")
        
    partner = company_repository.get(db=db, id=request_in.partner_company_id)
    if not partner or (partner.type not in [CompanyType.BROKER, CompanyType.CARRIER, CompanyType.OWNER_OPERATOR]) or partner.status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="Invalid Partner")
        
    existing = partnership_repository.get_any_direction(db=db, company_a=broker_id, company_b=partner.id)
    
    if existing:
        if existing.status == PartnershipStatus.PENDING:
            raise HTTPException(status_code=400, detail="Partnership request already pending")
        elif existing.status == PartnershipStatus.CONNECTED:
            raise HTTPException(status_code=400, detail="Already connected")
        elif existing.status == PartnershipStatus.BLOCKED:
            raise HTTPException(status_code=403, detail="Partnership blocked")
        else:
            # Resend request if rejected or removed or cancelled
            existing.status = PartnershipStatus.PENDING
            existing.request_message = request_in.request_message
            existing.updated_at = get_now_utc()
            db.commit()
            db.refresh(existing)
            pship = existing
    else:
        pship = partnership_repository.model(
            broker_company_id=broker_id,
            partner_company_id=partner.id,
            partner_type=partner.type,
            status=PartnershipStatus.PENDING,
            request_message=request_in.request_message
        )
        db.add(pship)
        db.commit()
        db.refresh(pship)
        
    create_notification(
        db, partner.id, "New Partnership Request", 
        f"Broker {broker.name} has sent you a partnership request.", 
        NotificationType.INFO,
        "Partnership",
        pship.id,
        "/partnerships"
    )
    
    return pship

def accept_partnership(db: Session, partnership_id: str, partner_id: str):
    pship = partnership_repository.get(db=db, id=partnership_id)
    if not pship or pship.partner_company_id != partner_id:
        raise HTTPException(status_code=404, detail="Partnership request not found")
        
    if pship.status != PartnershipStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")
        
    pship.status = PartnershipStatus.CONNECTED
    pship.accepted_at = get_now_utc()
    pship.updated_at = get_now_utc()
    db.commit()
    db.refresh(pship)
    
    create_notification(
        db, pship.broker_company_id, "Partnership Accepted", 
        f"Partner {pship.partner.name} accepted your partnership request.", 
        NotificationType.SUCCESS,
        "Partnership",
        pship.id,
        "/partnerships"
    )
    return pship

def reject_partnership(db: Session, partnership_id: str, partner_id: str):
    pship = partnership_repository.get(db=db, id=partnership_id)
    if not pship or pship.partner_company_id != partner_id:
        raise HTTPException(status_code=404, detail="Partnership request not found")
        
    if pship.status != PartnershipStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")
        
    pship.status = PartnershipStatus.REJECTED
    pship.updated_at = get_now_utc()
    db.commit()
    db.refresh(pship)
    
    create_notification(
        db, pship.broker_company_id, "Partnership Rejected", 
        f"Partner {pship.partner.name} rejected your partnership request.", 
        NotificationType.WARNING,
        "Partnership",
        pship.id,
        "/partnerships"
    )
    return pship

def remove_partnership(db: Session, partnership_id: str, company_id: str):
    pship = partnership_repository.get(db=db, id=partnership_id)
    if not pship:
        raise HTTPException(status_code=404, detail="Partnership not found")
        
    if pship.broker_company_id != company_id and pship.partner_company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    pship.status = PartnershipStatus.REMOVED
    pship.removed_at = get_now_utc()
    pship.updated_at = get_now_utc()
    db.commit()
    db.refresh(pship)
    
    other_company = pship.partner_company_id if pship.broker_company_id == company_id else pship.broker_company_id
    create_notification(
        db, other_company, "Partnership Removed", 
        "A partnership connection has been removed.", 
        NotificationType.WARNING,
        "Partnership",
        pship.id,
        "/partnerships"
    )
    return pship

def get_partnership_requests(db: Session, company_id: str):
    return partnership_repository.get_pending_requests(db=db, company_id=company_id)

def get_carrier_network(db: Session, company_id: str):
    # Returns all CONNECTED partners for this company
    partnerships = partnership_repository.get_connected_partners(db=db, company_id=company_id)
    
    directory = []
    for pship in partnerships:
        # The other partner is the one that is NOT company_id
        is_initiator = pship.broker_company_id == company_id
        other_company = pship.partner if is_initiator else pship.broker
        
        profile = None
        vehicle_dict = None
        if other_company.type == CompanyType.CARRIER:
            profile = ensure_carrier_profile(db, other_company.id)
        elif other_company.type == CompanyType.OWNER_OPERATOR:
            vehicle = company_vehicle_repository.get_by_company(db=db, company_id=other_company.id)
            if vehicle:
                vehicle_dict = {
                    "truck_number": vehicle.truck_number,
                    "equipment_type": vehicle.equipment_type,
                    "capacity_lbs": vehicle.capacity_lbs
                }
        directory.append(PartnerDirectoryItem(
            company=other_company,
            profile=profile,
            vehicle=vehicle_dict,
            partnership_status=pship.status,
            partnership_id=pship.id
        ))
    return directory

def get_connected_brokers(db: Session, partner_id: str):
    return partnership_repository.get_connected_brokers(db=db, partner_id=partner_id)
