from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.domain.marketplace.tenders.models import TenderStatus
from app.domain.identity.schemas import CompanyResponse
from app.domain.freight.loads.schemas import LoadResponse

class TenderCreate(BaseModel):
    carrier_id: str
    amount: float
    expires_at: datetime
    bid_id: Optional[str] = None

class TenderUpdate(BaseModel):
    status: Optional[TenderStatus] = None

class TenderResponse(BaseModel):
    id: str
    load_id: str
    shipper_id: str
    carrier_id: str
    bid_id: Optional[str] = None
    amount: float
    status: TenderStatus
    expires_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    load: Optional[LoadResponse] = None
    shipper: Optional[CompanyResponse] = None
    carrier: Optional[CompanyResponse] = None

    class Config:
        from_attributes = True
