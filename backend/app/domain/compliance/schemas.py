from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.domain.compliance.models import ComplianceType, ComplianceStatus

class ComplianceRecordCreate(BaseModel):
    company_id: str
    type: str
    identifier: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    document_url: Optional[str] = None

class ComplianceRecordUpdate(BaseModel):
    status: Optional[ComplianceStatus] = None
    expiry_date: Optional[datetime] = None
    document_url: Optional[str] = None
    is_active: Optional[bool] = None

class ComplianceRecordResponse(BaseModel):
    id: str
    company_id: str
    type: ComplianceType
    identifier: Optional[str] = None
    status: ComplianceStatus
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    document_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
