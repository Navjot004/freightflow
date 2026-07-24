from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.core.deps import get_current_active_user, RequireRole
from app.domain.identity.models import User
from app.domain.fleet.drivers import schemas, service

router = APIRouter()

@router.post("", response_model=dict)
def create_driver(
    driver_in: schemas.DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"]))
):
    """Create a new driver (Carrier only). Returns temp password."""
    return service.create_driver(db, current_user, driver_in)

@router.get("", response_model=List[schemas.DriverResponse])
def get_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"]))
):
    """Get all drivers in the carrier's company (filtered by role)."""
    return service.get_drivers_by_company(db, current_user)

@router.get("/{driver_id}", response_model=schemas.DriverResponse)
def get_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"]))
):
    """Get a specific driver."""
    return service.get_driver(db, driver_id, current_user.company_id)

@router.put("/{driver_id}", response_model=schemas.DriverResponse)
def update_driver(
    driver_id: str,
    driver_in: schemas.DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"]))
):
    """Update driver details."""
    return service.update_driver(db, driver_id, current_user, driver_in)

@router.delete("/{driver_id}")
def deactivate_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"]))
):
    """Deactivate a driver."""
    return service.deactivate_driver(db, driver_id, current_user.company_id)

@router.post("/{driver_id}/reset-password")
def reset_password(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"]))
):
    """Reset driver password (generates new temp password)."""
    return service.reset_password(db, driver_id, current_user.company_id)

@router.post("/{driver_id}/hos", response_model=schemas.HOSLogResponse)
def update_hos_status(
    driver_id: str,
    hos_in: schemas.HOSLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["DRIVER", "SUPER_ADMIN"]))
):
    """Update driver HOS status."""
    return service.update_hos_status(db, driver_id, current_user, hos_in)

@router.get("/{driver_id}/hos/summary", response_model=schemas.DriverHOSSummary)
def get_hos_summary(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER", "DRIVER"]))
):
    """Get HOS summary for a driver (FMCSA limits)."""
    return service.get_hos_summary(db, driver_id, current_user)
