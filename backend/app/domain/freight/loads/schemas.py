from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.domain.freight.loads.models import LoadStatus
from app.domain.identity.schemas import CompanyResponse

class LoadBase(BaseModel):
    origin_address: str
    destination_address: str
    pickup_date: datetime
    delivery_date: datetime
    equipment_type: str
    weight_lbs: int
    commodity: Optional[str] = None
    dimensions: Optional[str] = None
    special_instructions: Optional[str] = None
    
    # Appointments
    pickup_appointment_date: Optional[datetime] = None
    pickup_appointment_time: Optional[str] = None
    pickup_contact_person: Optional[str] = None
    pickup_contact_number: Optional[str] = None
    pickup_dock_number: Optional[str] = None
    pickup_reference_number: Optional[str] = None
    pickup_special_instructions: Optional[str] = None
    
    delivery_appointment_date: Optional[datetime] = None
    delivery_appointment_time: Optional[str] = None
    delivery_contact_person: Optional[str] = None
    delivery_contact_number: Optional[str] = None
    delivery_dock_number: Optional[str] = None
    delivery_reference_number: Optional[str] = None
    delivery_special_instructions: Optional[str] = None

class LoadCreate(LoadBase):
    pass

class LoadUpdate(BaseModel):
    origin_address: Optional[str] = None
    destination_address: Optional[str] = None
    pickup_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    equipment_type: Optional[str] = None
    weight_lbs: Optional[int] = None
    commodity: Optional[str] = None
    dimensions: Optional[str] = None
    special_instructions: Optional[str] = None
    
    pickup_appointment_date: Optional[datetime] = None
    pickup_appointment_time: Optional[str] = None
    pickup_contact_person: Optional[str] = None
    pickup_contact_number: Optional[str] = None
    pickup_dock_number: Optional[str] = None
    pickup_reference_number: Optional[str] = None
    pickup_special_instructions: Optional[str] = None
    
    delivery_appointment_date: Optional[datetime] = None
    delivery_appointment_time: Optional[str] = None
    delivery_contact_person: Optional[str] = None
    delivery_contact_number: Optional[str] = None
    delivery_dock_number: Optional[str] = None
    delivery_reference_number: Optional[str] = None
    delivery_special_instructions: Optional[str] = None

class LoadResponse(LoadBase):
    id: str
    shipper_id: str
    status: LoadStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    shipper: Optional[CompanyResponse] = None
    current_user_has_bidded: Optional[bool] = False

    class Config:
        from_attributes = True

class PaginatedLoadResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[LoadResponse]

class MarketplaceLoadResponse(BaseModel):
    id: str
    shipper_id: str
    status: LoadStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    shipper: Optional[CompanyResponse] = None
    current_user_has_bidded: Optional[bool] = False
    
    origin_address: str
    destination_address: str
    pickup_date: datetime
    delivery_date: datetime
    equipment_type: str
    weight_lbs: int
    commodity: Optional[str] = None
    dimensions: Optional[str] = None
    
    # Appointment fields intentionally omitted for security
    # special_instructions intentionally omitted

    class Config:
        from_attributes = True

class PaginatedMarketplaceLoadResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[MarketplaceLoadResponse]
