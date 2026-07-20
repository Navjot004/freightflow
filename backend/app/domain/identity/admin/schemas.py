from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: str
    admin_user_id: str
    action: str
    target_entity_id: Optional[str] = None
    details: Dict
    created_at: datetime

    class Config:
        from_attributes = True

class AnalyticsResponse(BaseModel):
    total_users: int
    total_companies: int
    pending_companies: int
    total_loads: int
    active_disputes: int
