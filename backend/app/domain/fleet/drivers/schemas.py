from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from app.domain.fleet.drivers.models import DriverStatus, HOSStatus

class DriverCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    manager_id: Optional[str] = None

class DriverUpdate(BaseModel):
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    status: Optional[DriverStatus] = None
    manager_id: Optional[str] = None

class DriverResponse(BaseModel):
    id: str
    user_id: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    emergency_contact: Optional[str] = None
    profile_photo: Optional[str] = None
    status: DriverStatus
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    
    # We will attach basic user info when returning
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    
    current_hos_status: Optional[HOSStatus] = None
    hos_last_updated: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class DriverAssignmentCreate(BaseModel):
    driver_id: str
    notes: Optional[str] = None

class DriverAssignmentResponse(BaseModel):
    id: str
    shipment_id: str
    driver_id: str
    assigned_by: str
    status: str
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    responded_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class DriverAssignmentRejectRequest(BaseModel):
    reason: Optional[str] = None

class HOSLogCreate(BaseModel):
    status: HOSStatus
    location: Optional[str] = None
    notes: Optional[str] = None

class HOSLogResponse(BaseModel):
    id: str
    driver_id: str
    status: HOSStatus
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class DriverHOSSummary(BaseModel):
    current_status: HOSStatus
    time_in_current_status_minutes: int
    driving_hours_remaining: float
    on_duty_hours_remaining: float
    cycle_hours_remaining: float
    time_until_break_required_minutes: float
