from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import secrets
from app.domain.identity.models import User, Company, Role, Invitation, VerificationStatus, CompanyType
from app.domain.organizations.companies.schemas import CompanyUpdate, InviteAccept
from app.domain.freight.loads.models import Load, LoadStatus
from app.core.security import get_password_hash
from app.domain.identity.service import ALLOWED_ROLES
from app.domain.identity.repository import company_repository, user_repository, role_repository, invitation_repository, company_vehicle_repository
from app.domain.organizations.partnerships.repository import carrier_profile_repository

from sqlalchemy import func
import string
import random

def generate_temp_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

from app.domain.marketplace.bids.models import Bid, BidStatus
from app.domain.marketplace.tenders.models import Tender, TenderStatus

def get_company_stats(db: Session, company_id: str):
    company = company_repository.get(db=db, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    total_users = user_repository.count_by_company(db=db, company_id=company_id)
    
    total_revenue = 0.0
    pending_revenue = 0.0
    status_counts = {}
    weekly_loads = []
    active_drivers = 0
    available_drivers = 0
    
    today = datetime.now(timezone.utc).date()
    
    if company.type == CompanyType.SHIPPER:
        loads_q = db.query(Load).filter(Load.shipper_id == company_id)
        
        active_loads = loads_q.filter(Load.status.notin_([LoadStatus.COMPLETED, LoadStatus.CANCELLED, LoadStatus.DRAFT])).count()
        completed_loads = loads_q.filter(Load.status == LoadStatus.COMPLETED).count()
        
        # Load Status Distribution
        distribution = db.query(Load.status, func.count(Load.id)).filter(Load.shipper_id == company_id).group_by(Load.status).all()
        for status, count in distribution:
            status_counts[status.value] = count
            
        # Revenue / Spend (Real calculation from accepted Bids/Tenders)
        active_loads_list = loads_q.filter(Load.status.notin_([LoadStatus.COMPLETED, LoadStatus.CANCELLED, LoadStatus.DRAFT])).all()
        for l in active_loads_list:
            bid = db.query(Bid).filter(Bid.load_id == l.id, Bid.status == BidStatus.ACCEPTED).first()
            if bid:
                pending_revenue += bid.amount
            else:
                tender = db.query(Tender).filter(Tender.load_id == l.id, Tender.status == TenderStatus.ACCEPTED).first()
                if tender:
                    pending_revenue += tender.amount

        completed_loads_list = loads_q.filter(Load.status == LoadStatus.COMPLETED).all()
        for l in completed_loads_list:
            bid = db.query(Bid).filter(Bid.load_id == l.id, Bid.status == BidStatus.ACCEPTED).first()
            if bid:
                total_revenue += bid.amount
            else:
                tender = db.query(Tender).filter(Tender.load_id == l.id, Tender.status == TenderStatus.ACCEPTED).first()
                if tender:
                    total_revenue += tender.amount
        
        # Real weekly trends for Shipper
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            start_dt = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
            end_dt = start_dt + timedelta(days=1)
            count = loads_q.filter(Load.created_at >= start_dt, Load.created_at < end_dt).count()
            weekly_loads.append({"date": d.strftime("%a"), "loads": count})
        
    else:
        from app.domain.freight.shipments.models import Shipment
        active_loads = db.query(Shipment).join(Load).filter(
            Shipment.carrier_id == company_id,
            Load.status.notin_([LoadStatus.COMPLETED, LoadStatus.CANCELLED])
        ).count()
        completed_loads = db.query(Shipment).join(Load).filter(
            Shipment.carrier_id == company_id,
            Load.status == LoadStatus.COMPLETED
        ).count()
        
        # Load Status Distribution
        distribution = db.query(Load.status, func.count(Shipment.id)).join(Load).filter(Shipment.carrier_id == company_id).group_by(Load.status).all()
        for status, count in distribution:
            status_counts[status.value] = count
            
        # Revenue / Spend (Real calculation from accepted Bids/Tenders)
        active_shipments_list = db.query(Shipment).join(Load).filter(
            Shipment.carrier_id == company_id,
            Load.status.notin_([LoadStatus.COMPLETED, LoadStatus.CANCELLED])
        ).all()
        for s in active_shipments_list:
            bid = db.query(Bid).filter(Bid.load_id == s.load_id, Bid.carrier_id == company_id, Bid.status == BidStatus.ACCEPTED).first()
            if bid:
                pending_revenue += bid.amount
            else:
                tender = db.query(Tender).filter(Tender.load_id == s.load_id, Tender.carrier_id == company_id, Tender.status == TenderStatus.ACCEPTED).first()
                if tender:
                    pending_revenue += tender.amount

        completed_shipments_list = db.query(Shipment).join(Load).filter(
            Shipment.carrier_id == company_id,
            Load.status == LoadStatus.COMPLETED
        ).all()
        for s in completed_shipments_list:
            bid = db.query(Bid).filter(Bid.load_id == s.load_id, Bid.carrier_id == company_id, Bid.status == BidStatus.ACCEPTED).first()
            if bid:
                total_revenue += bid.amount
            else:
                tender = db.query(Tender).filter(Tender.load_id == s.load_id, Tender.carrier_id == company_id, Tender.status == TenderStatus.ACCEPTED).first()
                if tender:
                    total_revenue += tender.amount
        
        # Real weekly trends for Carrier/Broker
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            start_dt = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
            end_dt = start_dt + timedelta(days=1)
            count = db.query(Shipment).filter(Shipment.carrier_id == company_id, Shipment.created_at >= start_dt, Shipment.created_at < end_dt).count()
            weekly_loads.append({"date": d.strftime("%a"), "loads": count})
        
        # Active vs Available drivers
        driver_role = db.query(Role).filter(Role.name == "DRIVER").first()
        if driver_role:
            from app.domain.fleet.drivers.models import DriverAssignment, DriverAssignmentStatus
            total_drivers = db.query(User).filter(User.company_id == company_id, User.role_id == driver_role.id).count()
            active_drivers = db.query(User).join(
                DriverAssignment, DriverAssignment.driver_id == User.id
            ).join(
                Shipment, Shipment.id == DriverAssignment.shipment_id
            ).join(
                Load, Load.id == Shipment.load_id
            ).filter(
                User.company_id == company_id,
                User.role_id == driver_role.id,
                DriverAssignment.status == DriverAssignmentStatus.ACCEPTED,
                Load.status.notin_([LoadStatus.COMPLETED, LoadStatus.CANCELLED])
            ).distinct().count()
            available_drivers = max(0, total_drivers - active_drivers)
            
    load_status_distribution = [{"name": k.replace('_', ' ').title(), "value": v} for k, v in status_counts.items()]
    if not load_status_distribution:
        load_status_distribution = [{"name": "No Loads", "value": 1}]
    
    return {
        "total_employees": total_users,
        "active_loads": active_loads,
        "completed_loads": completed_loads,
        "status": company.status.value,
        "revenue_stats": {
            "total_revenue": total_revenue,
            "pending_revenue": pending_revenue
        },
        "load_status_distribution": load_status_distribution,
        "weekly_trends": weekly_loads,
        "active_drivers": active_drivers,
        "available_drivers": available_drivers
    }        

def update_company(db: Session, company_id: str, company_in: CompanyUpdate):
    company = company_repository.get(db=db, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    update_data = company_in.model_dump(exclude_unset=True)
    return company_repository.update(db=db, db_obj=company, obj_in=update_data)

def verify_company(db: Session, company_id: str):
    company = company_repository.get(db=db, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    company.status = VerificationStatus.VERIFIED
    db.commit()
    db.refresh(company)
    return company

def create_invite(db: Session, email: str, role_name: str, company_id: str) -> str:
    if role_name not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {', '.join(sorted(ALLOWED_ROLES))}")
    
    if user_repository.get_by_email(db=db, email=email):
        raise HTTPException(status_code=400, detail="User already registered")
        
    token = secrets.token_urlsafe(32)
    
    invite = invitation_repository.create(db=db, obj_in=type("MockSchema", (), {
        "model_dump": lambda: {
            "email": email,
            "company_id": company_id,
            "role_name": role_name,
            "token": token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7)
        }
    })())
    
    return f"http://localhost:5173/invite/accept?token={token}"

def get_invite_details(db: Session, token: str):
    invite = invitation_repository.get_valid_invite(db=db, token=token)
    
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite")
        
    return {"email": invite.email, "role_name": invite.role_name, "company_id": invite.company_id}

def accept_invite(db: Session, accept_in: InviteAccept):
    invite = invitation_repository.get_valid_invite(db=db, token=accept_in.token)
    
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite")
        
    if user_repository.get_by_email(db=db, email=invite.email):
        raise HTTPException(status_code=400, detail="User already registered")

    if invite.role_name not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role on invite: {invite.role_name}")
    role = role_repository.get_by_name(db=db, name=invite.role_name)
    if not role:
        role = Role(name=invite.role_name, permissions=[])
        db.add(role)
        db.commit()
        db.refresh(role)

    user = user_repository.model(
        email=invite.email,
        password_hash=get_password_hash(accept_in.password),
        first_name=accept_in.first_name,
        last_name=accept_in.last_name,
        company_id=invite.company_id,
        role_id=role.id
    )
    db.add(user)
    
    invite.is_accepted = True
    
    db.commit()
    db.refresh(user)

    if invite.role_name == "DRIVER":
        from app.domain.fleet.drivers.models import DriverProfile, DriverStatus
        driver_profile = DriverProfile(
            user_id=user.id,
            status=DriverStatus.AVAILABLE
        )
        db.add(driver_profile)
        db.commit()

    return user

def get_company_employees(db: Session, company_id: str):
    return user_repository.get_by_company(db=db, company_id=company_id)

def create_employee(db: Session, company_id: str, employee_in):
    if employee_in.role_name not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {', '.join(sorted(ALLOWED_ROLES))}")
    
    if user_repository.get_by_email(db=db, email=employee_in.email):
        raise HTTPException(status_code=400, detail="User already registered")

    role = role_repository.get_by_name(db=db, name=employee_in.role_name)
    if not role:
        role = Role(name=employee_in.role_name, permissions=[])
        db.add(role)
        db.commit()
        db.refresh(role)

    raw_password = employee_in.password or generate_temp_password()
    
    user = user_repository.model(
        email=employee_in.email,
        password_hash=get_password_hash(raw_password),
        first_name=employee_in.first_name,
        last_name=employee_in.last_name,
        company_id=company_id,
        role_id=role.id,
        is_active=True,
        requires_password_change=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if employee_in.role_name == "DRIVER":
        from app.domain.fleet.drivers.models import DriverProfile, DriverStatus
        driver_profile = DriverProfile(
            user_id=user.id,
            status=DriverStatus.AVAILABLE
        )
        db.add(driver_profile)
        db.commit()

    
    return {
        "message": "Employee created successfully",
        "email": user.email,
        "password": raw_password,
        "user_id": user.id
    }

def reset_employee_password(db: Session, employee_id: str, company_id: str):
    user = user_repository.get(db=db, id=employee_id)
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this employee")
    
    new_password = generate_temp_password()
    user.password_hash = get_password_hash(new_password)
    user.requires_password_change = True
    
    db.commit()
    return {"message": "Password reset successfully", "new_password": new_password}

def get_company_vehicle(db: Session, company_id: str):
    vehicle = company_vehicle_repository.get_by_company(db=db, company_id=company_id)
    if not vehicle:
        vehicle = company_vehicle_repository.model(company_id=company_id)
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
    return vehicle

def update_company_vehicle(db: Session, company_id: str, vehicle_in):
    vehicle = company_vehicle_repository.get_by_company(db=db, company_id=company_id)
    if not vehicle:
        vehicle = company_vehicle_repository.model(company_id=company_id)
        db.add(vehicle)
    
    update_data = vehicle_in.dict(exclude_unset=True)
    return company_vehicle_repository.update(db=db, db_obj=vehicle, obj_in=update_data)

def get_company_profile(db: Session, company_id: str):
    profile = carrier_profile_repository.get_by_company(db=db, company_id=company_id)
    if not profile:
        profile = carrier_profile_repository.model(company_id=company_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def update_company_profile(db: Session, company_id: str, profile_in):
    profile = carrier_profile_repository.get_by_company(db=db, company_id=company_id)
    if not profile:
        profile = carrier_profile_repository.model(company_id=company_id)
        db.add(profile)
    
    update_data = profile_in.model_dump(exclude_unset=True)
    return carrier_profile_repository.update(db=db, db_obj=profile, obj_in=update_data)

