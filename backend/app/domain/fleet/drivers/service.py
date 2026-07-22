from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.domain.fleet.drivers.models import DriverProfile, DriverStatus, DriverHOSLog, HOSStatus
from app.domain.fleet.drivers.schemas import DriverCreate, DriverUpdate, HOSLogCreate, DriverHOSSummary
from app.core.security import get_password_hash
from app.domain.identity.repository import user_repository, role_repository
from app.domain.fleet.drivers.repository import driver_profile_repository
from datetime import datetime, timezone, timedelta
import string
import random

def generate_temp_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(chars) for _ in range(length))

def create_driver(db: Session, current_user, driver_in: DriverCreate):
    from app.domain.identity.models import Role
    existing_user = user_repository.get_by_email(db=db, email=driver_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    role = role_repository.get_by_name(db=db, name="DRIVER")
    if not role:
        role = Role(name="DRIVER", permissions=[])
        db.add(role)
        db.commit()
        db.refresh(role)
        
    temp_password = generate_temp_password()
    
    user = user_repository.model(
        email=driver_in.email,
        password_hash=get_password_hash(temp_password),
        first_name=driver_in.first_name,
        last_name=driver_in.last_name,
        company_id=current_user.company_id,
        role_id=role.id,
        requires_password_change=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    driver_profile = driver_profile_repository.model(
        user_id=user.id,
        phone=driver_in.phone,
        license_number=driver_in.license_number,
        license_expiry=driver_in.license_expiry,
        status=DriverStatus.AVAILABLE,
        manager_id=current_user.id if current_user.role.name == "DISPATCHER" else (driver_in.manager_id if driver_in.manager_id != "unassigned" else None)
    )
    db.add(driver_profile)
    db.commit()
    db.refresh(driver_profile)
    
    return {
        "driver": _enrich_driver(driver_profile, user),
        "temp_password": temp_password
    }

def _enrich_driver(driver_profile: DriverProfile, user):
    return {
        "id": driver_profile.id,
        "user_id": driver_profile.user_id,
        "phone": driver_profile.phone,
        "license_number": driver_profile.license_number,
        "license_expiry": driver_profile.license_expiry,
        "emergency_contact": driver_profile.emergency_contact,
        "profile_photo": driver_profile.profile_photo,
        "status": driver_profile.status,
        "manager_id": driver_profile.manager_id,
        "manager_name": f"{driver_profile.manager.first_name} {driver_profile.manager.last_name}" if driver_profile.manager else None,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email
    }

def get_drivers_by_company(db: Session, current_user):
    from app.domain.identity.models import User
    users = db.query(User).filter(User.company_id == current_user.company_id, User.role.has(name="DRIVER")).all()
    results = []
    for user in users:
        profile = driver_profile_repository.get_by_user_id(db=db, user_id=user.id)
        if profile:
            if current_user.role.name == "DISPATCHER" and profile.manager_id != current_user.id:
                continue
            results.append(_enrich_driver(profile, user))
    return results

def get_driver(db: Session, driver_id: str, company_id: str):
    profile = driver_profile_repository.get(db=db, id=driver_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    user = user_repository.get(db=db, id=profile.user_id)
    if user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return _enrich_driver(profile, user)

def update_driver(db: Session, driver_id: str, current_user, driver_in: DriverUpdate):
    profile = driver_profile_repository.get(db=db, id=driver_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    user = user_repository.get(db=db, id=profile.user_id)
    if user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if driver_in.phone is not None:
        profile.phone = driver_in.phone
    if driver_in.emergency_contact is not None:
        profile.emergency_contact = driver_in.emergency_contact
    if driver_in.status is not None:
        profile.status = driver_in.status
    if current_user.role.name == "COMPANY_ADMIN" and driver_in.manager_id is not None:
        profile.manager_id = driver_in.manager_id if driver_in.manager_id != "unassigned" else None
        
    db.commit()
    db.refresh(profile)
    return _enrich_driver(profile, user)

def deactivate_driver(db: Session, driver_id: str, company_id: str):
    profile = driver_profile_repository.get(db=db, id=driver_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    user = user_repository.get(db=db, id=profile.user_id)
    if user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    user.is_active = False
    profile.status = DriverStatus.SUSPENDED
    db.commit()
    
    return {"message": "Driver deactivated successfully"}

def reset_password(db: Session, driver_id: str, company_id: str):
    profile = driver_profile_repository.get(db=db, id=driver_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    user = user_repository.get(db=db, id=profile.user_id)
    if user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    temp_password = generate_temp_password()
    user.password_hash = get_password_hash(temp_password)
    user.requires_password_change = True
    db.commit()
    
    return {"message": "Password reset successfully", "temp_password": temp_password}

def update_hos_status(db: Session, driver_id: str, current_user, hos_in: HOSLogCreate):
    profile = None
    if driver_id == "me":
        profile = driver_profile_repository.get_by_user_id(db=db, user_id=current_user.id)
    else:
        profile = driver_profile_repository.get(db=db, id=driver_id)
        
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    user = user_repository.get(db=db, id=profile.user_id)
    
    if current_user.role.name == "DRIVER" and current_user.id != user.id:
        raise HTTPException(status_code=403, detail="Drivers can only update their own HOS status")
    if user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Close the previous log if exists
    active_log = db.query(DriverHOSLog).filter(
        DriverHOSLog.driver_id == user.id,
        DriverHOSLog.end_time == None
    ).first()
    
    if active_log:
        active_log.end_time = now
        db.commit()
        
    # Create new log
    new_log = DriverHOSLog(
        driver_id=user.id,
        status=hos_in.status,
        start_time=now,
        location=hos_in.location,
        notes=hos_in.notes
    )
    db.add(new_log)
    
    profile.current_hos_status = hos_in.status
    profile.hos_last_updated = now
    
    db.commit()
    db.refresh(new_log)
    return new_log

def get_hos_summary(db: Session, driver_id: str, current_user) -> DriverHOSSummary:
    profile = None
    if driver_id == "me":
        profile = driver_profile_repository.get_by_user_id(db=db, user_id=current_user.id)
    else:
        profile = driver_profile_repository.get(db=db, id=driver_id)
        
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    user = user_repository.get(db=db, id=profile.user_id)
    
    if current_user.role.name == "DRIVER" and current_user.id != user.id:
        raise HTTPException(status_code=403, detail="Drivers can only view their own HOS summary")
    if user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Calculate FMCSA shift start (last OFF_DUTY or SLEEPER >= 10 hours)
    # For POC, simplified: look back 24 hours
    logs = db.query(DriverHOSLog).filter(
        DriverHOSLog.driver_id == user.id,
        DriverHOSLog.start_time >= now - timedelta(days=2)
    ).order_by(DriverHOSLog.start_time).all()
    
    # Default shift start to the first log in the last 24h, or now if no logs
    shift_start = logs[0].start_time if logs else now
    
    driving_minutes = 0
    on_duty_minutes = 0
    consecutive_driving_minutes = 0
    
    # Find last valid 10-hour reset
    reset_found = False
    for i, log in reversed(list(enumerate(logs))):
        if log.status in [HOSStatus.OFF_DUTY, HOSStatus.SLEEPER]:
            duration = (log.end_time or now) - log.start_time
            if duration.total_seconds() >= 10 * 3600:
                shift_start = log.end_time or now
                reset_found = True
                break
                
    # If no reset found, and we have logs, the shift started at the earliest log
    # If no logs at all, shift_start is `now`.
                
    # Calculate hours since shift start
    shift_logs = [log for log in logs if (log.end_time or now) > shift_start]
    
    last_break_end = shift_start
    
    for log in shift_logs:
        log_start = max(log.start_time, shift_start)
        log_end = log.end_time or now
        duration_minutes = (log_end - log_start).total_seconds() / 60.0
        
        if log.status == HOSStatus.DRIVING:
            driving_minutes += duration_minutes
            consecutive_driving_minutes += duration_minutes
        elif log.status == HOSStatus.ON_DUTY_NOT_DRIVING:
            on_duty_minutes += duration_minutes
            consecutive_driving_minutes = 0 # Any non-driving resets consecutive driving (technically needs 30 min break)
        elif log.status in [HOSStatus.OFF_DUTY, HOSStatus.SLEEPER]:
            if duration_minutes >= 30:
                consecutive_driving_minutes = 0
                last_break_end = log_end
                
    active_log = next((log for log in logs if log.end_time is None), None)
    time_in_current_status = int((now - active_log.start_time).total_seconds() / 60.0) if active_log else 0
    
    driving_hours_remaining = max(0.0, 11.0 - (driving_minutes / 60.0))
    shift_hours_elapsed = (now - shift_start).total_seconds() / 3600.0
    on_duty_hours_remaining = max(0.0, 14.0 - shift_hours_elapsed)
    
    time_until_break_minutes = max(0.0, (8 * 60) - consecutive_driving_minutes)
    
    # 70 hours in 8 days - simplifed
    week_logs = db.query(DriverHOSLog).filter(
        DriverHOSLog.driver_id == user.id,
        DriverHOSLog.start_time >= now - timedelta(days=8)
    ).all()
    
    total_on_duty_minutes = 0
    for log in week_logs:
        if log.status in [HOSStatus.DRIVING, HOSStatus.ON_DUTY_NOT_DRIVING]:
            total_on_duty_minutes += ((log.end_time or now) - log.start_time).total_seconds() / 60.0
            
    cycle_hours_remaining = max(0.0, 70.0 - (total_on_duty_minutes / 60.0))
    
    return DriverHOSSummary(
        current_status=profile.current_hos_status or HOSStatus.OFF_DUTY,
        time_in_current_status_minutes=time_in_current_status,
        driving_hours_remaining=round(driving_hours_remaining, 2),
        on_duty_hours_remaining=round(on_duty_hours_remaining, 2),
        cycle_hours_remaining=round(cycle_hours_remaining, 2),
        time_until_break_required_minutes=round(time_until_break_minutes, 2)
    )
