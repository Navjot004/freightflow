from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from .models import CompanyType, VerificationStatus

class CompanyBase(BaseModel):
    name: str
    type: CompanyType
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    tax_id: Optional[str] = None
    insurance_expiry_date: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: str
    status: VerificationStatus
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None


class UserCreate(UserBase):
    password: str
    company: CompanyCreate

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class RoleResponse(BaseModel):
    id: str
    name: str
    permissions: List[str]
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: str
    is_active: bool
    company_id: str
    role_id: str
    company: Optional[CompanyResponse] = None
    role: Optional[RoleResponse] = None
    requires_password_change: bool = False

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class InviteCreate(BaseModel):
    email: EmailStr
    role_name: str

class ContextSwitchRequest(BaseModel):
    company_id: str

class ContextTokenResponse(BaseModel):
    access_token: str
    token_type: str
    context: dict
