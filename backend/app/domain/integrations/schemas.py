from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.domain.integrations.models import WebhookStatus

# Api Key
class ApiKeyCreate(BaseModel):
    name: str

class ApiKeyResponse(BaseModel):
    id: str
    company_id: str
    name: str
    prefix: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class ApiKeyCreateResponse(ApiKeyResponse):
    key: str # Only returned once

# Webhook
class WebhookCreate(BaseModel):
    url: str
    events: List[str]

class WebhookResponse(BaseModel):
    id: str
    company_id: str
    url: str
    events: List[str]
    status: WebhookStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# EDI Configuration
class EdiConfigurationCreate(BaseModel):
    isa_sender_id: str
    isa_receiver_id: str
    qualifier: Optional[str] = "ZZ"
    partner_id: Optional[str] = None

class EdiConfigurationResponse(BaseModel):
    id: str
    company_id: str
    partner_id: Optional[str] = None
    isa_sender_id: str
    isa_receiver_id: str
    qualifier: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
