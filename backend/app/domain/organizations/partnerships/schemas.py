from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.domain.organizations.partnerships.models import PartnershipStatus
from app.domain.identity.schemas import CompanyResponse

class CarrierProfileBase(BaseModel):
    fleet_size: Optional[int] = 0
    equipment_types: Optional[List[str]] = []
    operating_regions: Optional[List[str]] = []
    logo_url: Optional[str] = None

class CarrierProfileResponse(CarrierProfileBase):
    company_id: str
    
    model_config = ConfigDict(from_attributes=True)

class PartnerDirectoryItem(BaseModel):
    company: CompanyResponse
    profile: Optional[CarrierProfileResponse] = None
    vehicle: Optional[Dict[str, Any]] = None # for Owner Operators
    partnership_status: Optional[PartnershipStatus] = None
    partnership_id: Optional[str] = None
    
    # Mock stats
    rating: float = 4.5
    completed_shipments: int = 0
    acceptance_rate: float = 100.0
    on_time_percentage: float = 100.0

class PartnershipRequestCreate(BaseModel):
    partner_company_id: str
    request_message: Optional[str] = None

class PartnershipResponse(BaseModel):
    id: str
    broker_company_id: str
    partner_company_id: str
    partner_type: str
    status: PartnershipStatus
    request_message: Optional[str]
    created_at: datetime
    accepted_at: Optional[datetime]
    updated_at: Optional[datetime]
    removed_at: Optional[datetime]
    
    broker: Optional[CompanyResponse] = None
    partner: Optional[CompanyResponse] = None
    
    model_config = ConfigDict(from_attributes=True)
