from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.domain.notifications.models import NotificationType
from app.domain.notifications.repository import notification_repository

def create_notification(
    db: Session, 
    company_id: str, 
    title: str, 
    message: str, 
    type: NotificationType = NotificationType.INFO,
    entity_type: str = None,
    entity_id: str = None,
    action_url: str = None,
    target_role: str = None
):
    from app.domain.notifications.models import Notification
    
    # Bypass celery/redis for POC and create synchronously to avoid hanging on redis connection
    notification = Notification(
        company_id=company_id,
        title=title,
        message=message,
        type=type,
        entity_type=entity_type,
        entity_id=entity_id,
        action_url=action_url,
        target_role=target_role
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def get_my_notifications(db: Session, company_id: str, role_name: str = None):
    return notification_repository.get_my_notifications(db=db, company_id=company_id, role_name=role_name)

def get_unread_count(db: Session, company_id: str, role_name: str = None):
    return notification_repository.get_unread_count(db=db, company_id=company_id, role_name=role_name)

def mark_as_read(db: Session, notification_id: str, company_id: str, role_name: str = None):
    notif = notification_repository.get_notification_for_read(db=db, notification_id=notification_id, company_id=company_id, role_name=role_name)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

def mark_all_as_read(db: Session, company_id: str, role_name: str = None):
    notification_repository.mark_all_as_read(db=db, company_id=company_id, role_name=role_name)
    db.commit()
    return {"message": "All marked as read"}

