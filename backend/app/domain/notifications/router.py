from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from app.db.database import get_db
from app.domain.notifications import schemas, service
from app.core.deps import get_current_active_user
from app.domain.identity.models import User

router = APIRouter()

@router.get("/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get recent notifications for the user's company."""
    role_name = current_user.role.name if current_user.role else None
    return service.get_my_notifications(db, current_user.company_id, role_name)

@router.patch("/notifications/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read."""
    role_name = current_user.role.name if current_user.role else None
    return service.mark_as_read(db, notification_id, current_user.company_id, role_name)

@router.post("/notifications/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read."""
    role_name = current_user.role.name if current_user.role else None
    return service.mark_all_as_read(db, current_user.company_id, role_name)
