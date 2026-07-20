from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date
from app.domain.identity.schemas import CompanyResponse, UserResponse

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    tax_id: Optional[str] = None
    insurance_expiry_date: Optional[str] = None

from typing import Optional, List, Dict, Any

class LoadStatusDistribution(BaseModel):
    name: str
    value: int

class WeeklyTrend(BaseModel):
    date: str
    loads: int

class RevenueStats(BaseModel):
    total_revenue: float
    pending_revenue: float

class CompanyDashboardStats(BaseModel):
    total_employees: int
    active_loads: int
    completed_loads: int
    status: str
    revenue_stats: Optional[RevenueStats] = None
    load_status_distribution: Optional[List[LoadStatusDistribution]] = None
    weekly_trends: Optional[List[WeeklyTrend]] = None
    active_drivers: Optional[int] = None
    available_drivers: Optional[int] = None

class InviteAccept(BaseModel):
    token: str
    first_name: str
    last_name: str
    password: str

class EmployeeInvite(BaseModel):
    email: EmailStr
    role_name: str

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role_name: str
    password: Optional[str] = None

class InviteResponse(BaseModel):
    message: str
    invite_link: str

class CompanyVehicleBase(BaseModel):
    truck_number: Optional[str] = None
    trailer_number: Optional[str] = None
    equipment_type: Optional[str] = None
    capacity_lbs: Optional[int] = None
    status: Optional[str] = "ACTIVE"
    insurance_expiry: Optional[date] = None
    registration_expiry: Optional[date] = None
    maintenance_date: Optional[date] = None

class CompanyVehicleCreate(CompanyVehicleBase):
    pass

class CompanyVehicleUpdate(CompanyVehicleBase):
    pass

class CompanyVehicleResponse(CompanyVehicleBase):
    id: str
    company_id: str

    class Config:
        from_attributes = True

class CarrierProfileBase(BaseModel):
    fleet_size: Optional[int] = 0
    equipment_types: Optional[List[str]] = []
    operating_regions: Optional[List[str]] = []
    logo_url: Optional[str] = None

class CarrierProfileUpdate(CarrierProfileBase):
    pass

class CarrierProfileResponse(CarrierProfileBase):
    company_id: str

    class Config:
        from_attributes = True
