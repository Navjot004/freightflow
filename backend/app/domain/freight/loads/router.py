from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.domain.freight.loads import schemas, service
from app.core.deps import get_current_active_user, RequireRole
from app.domain.identity.models import User

router = APIRouter()

@router.post("/", response_model=schemas.LoadResponse)
def create_load(
    load_in: schemas.LoadCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SHIPPER_OPS", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Create a new load (Shippers/Brokers only). Company must be verified."""
    return service.create_load(db, current_user.company_id, load_in)

@router.get("/me", response_model=List[schemas.LoadResponse])
def get_my_loads(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """View loads created by the current user's company."""
    return service.get_my_loads(db, current_user.company_id, skip, limit)

@router.put("/{load_id}", response_model=schemas.LoadResponse)
def update_load(
    load_id: str,
    load_in: schemas.LoadUpdate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SHIPPER_OPS", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Edit an open load."""
    return service.update_load(db, load_id, current_user.company_id, load_in)

@router.patch("/{load_id}/cancel", response_model=schemas.LoadResponse)
def cancel_load(
    load_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SHIPPER_OPS", "BROKER_OPS"])),
    db: Session = Depends(get_db)
):
    """Cancel a load."""
    return service.cancel_load(db, load_id, current_user.company_id)

@router.get("/marketplace", response_model=schemas.PaginatedMarketplaceLoadResponse)
def search_marketplace(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    equipment_type: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|pickup_date|weight_lbs)$"),
    sort_desc: bool = Query(True),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Public load board (all active users can view)."""
    return service.search_marketplace(db, skip, limit, search, equipment_type, sort_by, sort_desc, current_user.company_id)
