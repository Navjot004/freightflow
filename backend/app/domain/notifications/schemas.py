from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.domain.notifications.models import NotificationType

class NotificationResponse(BaseModel):
    id: str
    company_id: str
    title: str
    message: str
    type: NotificationType
    is_read: bool
    entity_type: str | None = None
    entity_id: str | None = None
    action_url: str | None = None
    target_role: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
