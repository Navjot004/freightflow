from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.repository import BaseRepository
from app.domain.notifications.models import Notification

class NotificationRepository(BaseRepository[Notification, dict, dict]):
    def get_my_notifications(self, db: Session, *, company_id: str, role_name: Optional[str] = None) -> List[Notification]:
        query = db.query(self.model).filter(self.model.company_id == company_id)
        if role_name:
            query = query.filter(or_(self.model.target_role == None, self.model.target_role == role_name))
        return query.order_by(self.model.created_at.desc()).limit(50).all()

    def get_unread_count(self, db: Session, *, company_id: str, role_name: Optional[str] = None) -> int:
        query = db.query(self.model).filter(self.model.company_id == company_id, self.model.is_read == False)
        if role_name:
            query = query.filter(or_(self.model.target_role == None, self.model.target_role == role_name))
        return query.count()

    def get_notification_for_read(self, db: Session, *, notification_id: str, company_id: str, role_name: Optional[str] = None) -> Optional[Notification]:
        query = db.query(self.model).filter(self.model.id == notification_id, self.model.company_id == company_id)
        if role_name:
            query = query.filter(or_(self.model.target_role == None, self.model.target_role == role_name))
        return query.first()

    def mark_all_as_read(self, db: Session, *, company_id: str, role_name: Optional[str] = None):
        query = db.query(self.model).filter(self.model.company_id == company_id, self.model.is_read == False)
        if role_name:
            query = query.filter(or_(self.model.target_role == None, self.model.target_role == role_name))
        query.update({"is_read": True})

notification_repository = NotificationRepository(Notification)
