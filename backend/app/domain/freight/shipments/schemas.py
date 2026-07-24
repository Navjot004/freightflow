from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.domain.identity.schemas import CompanyResponse, UserResponse
from app.domain.freight.loads.schemas import LoadResponse
from app.domain.freight.shipments.models import ShipmentStatus, DocumentStatus

class ShipmentDocumentResponse(BaseModel):
    id: str
    shipment_id: str
    document_type: str
    file_path: str
    uploaded_by: str
    status: Optional[DocumentStatus] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class DriverAssign(BaseModel):
    driver_name: str
    driver_phone: str
    truck_number: Optional[str] = None

class DispatcherAssign(BaseModel):
    dispatcher_id: Optional[str] = None

class LocationUpdate(BaseModel):
    current_location: str

class ShipmentResponse(BaseModel):
    id: str
    load_id: str
    carrier_id: str
    
    dispatcher_id: Optional[str] = None
    
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    truck_number: Optional[str] = None
    
    status: ShipmentStatus
    current_location: Optional[str] = None
    eta: Optional[datetime] = None
    
    bol_url: Optional[str] = None
    pod_url: Optional[str] = None
    
    receiver_name: Optional[str] = None
    receiver_signature_url: Optional[str] = None
    delivery_notes: Optional[str] = None
    delivery_photos_urls: Optional[str] = None
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    load: Optional[LoadResponse] = None
    carrier: Optional[CompanyResponse] = None
    dispatcher: Optional[UserResponse] = None
    documents: Optional[list[ShipmentDocumentResponse]] = []
    active_partner_assignment: Optional['PartnerAssignmentResponse'] = None

    class Config:
        from_attributes = True

class PartnerAssignmentCreate(BaseModel):
    partner_id: str
    notes: Optional[str] = None

class PartnerAssignmentResponse(BaseModel):
    id: str
    shipment_id: str
    broker_id: str
    partner_id: str
    status: str
    assigned_at: datetime
    responded_at: Optional[datetime] = None
    notes: Optional[str] = None
    
    broker: Optional[CompanyResponse] = None
    partner: Optional[CompanyResponse] = None
    
    class Config:
        from_attributes = True

class ShipmentTrackingCreate(BaseModel):
    latitude: str
    longitude: str
    speed: Optional[str] = None
    heading: Optional[str] = None
    accuracy: Optional[str] = None
    altitude: Optional[str] = None

class ShipmentTrackingResponse(BaseModel):
    id: str
    shipment_id: str
    latitude: str
    longitude: str
    speed: Optional[str] = None
    heading: Optional[str] = None
    accuracy: Optional[str] = None
    altitude: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

from app.domain.freight.shipments.models import IssueType, IssueStatus

class ShipmentIssueCreate(BaseModel):
    issue_type: IssueType
    description: Optional[str] = None

class ShipmentIssueResponse(BaseModel):
    id: str
    shipment_id: str
    reported_by: str
    issue_type: IssueType
    description: Optional[str] = None
    status: IssueStatus
    created_at: datetime
    
    class Config:
        from_attributes = True
