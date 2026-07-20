from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.domain.freight.disputes.models import DisputeStatus

class DisputeCreate(BaseModel):
    load_id: str
    reason: str

class DisputeResolve(BaseModel):
    status: DisputeStatus
    resolution_notes: str

class DisputeResponse(BaseModel):
    id: str
    load_id: str
    raised_by_company_id: str
    against_company_id: str
    reason: str
    status: DisputeStatus
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
