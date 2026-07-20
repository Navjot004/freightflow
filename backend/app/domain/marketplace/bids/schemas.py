from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.domain.marketplace.bids.models import BidStatus
from app.domain.identity.schemas import CompanyResponse
from app.domain.freight.loads.schemas import LoadResponse

class BidBase(BaseModel):
    amount: float
    notes: Optional[str] = None
    available_pickup_date: Optional[datetime] = None
    transit_time_estimate_hours: Optional[int] = None
    expires_at: datetime

class BidCreate(BidBase):
    pass

class BidUpdate(BaseModel):
    amount: Optional[float] = None
    notes: Optional[str] = None
    available_pickup_date: Optional[datetime] = None
    transit_time_estimate_hours: Optional[int] = None
    expires_at: Optional[datetime] = None

class BidResponse(BidBase):
    id: str
    load_id: str
    carrier_id: str
    status: BidStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    carrier: Optional[CompanyResponse] = None
    load: Optional[LoadResponse] = None

    class Config:
        from_attributes = True
