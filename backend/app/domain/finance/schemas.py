from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.domain.finance.models import InvoiceStatus, InvoiceRelationshipType, SettlementStatus
from app.domain.identity.schemas import CompanyResponse

# Financial Account
class FinancialAccountBase(BaseModel):
    company_id: str
    account_type: str
    balance: float = 0.0
    currency: str = "USD"

class FinancialAccountResponse(FinancialAccountBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class LoadShortResponse(BaseModel):
    id: str
    title: Optional[str] = None
    origin_address: str
    destination_address: str
    status: str
    rate: float
    equipment_type: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Invoice
class InvoiceCreate(BaseModel):
    recipient_company_id: str
    relationship_type: InvoiceRelationshipType
    load_id: Optional[str] = None
    shipment_id: Optional[str] = None
    linehaul_amount: float
    fuel_surcharge: float = 0.0
    accessorials_amount: float = 0.0
    tax_amount: float = 0.0
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    issuer_company_id: str
    recipient_company_id: str
    relationship_type: InvoiceRelationshipType
    load_id: Optional[str] = None
    shipment_id: Optional[str] = None
    
    linehaul_amount: float
    fuel_surcharge: float
    accessorials_amount: float
    tax_amount: float
    amount: float
    
    status: InvoiceStatus
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    pdf_url: Optional[str] = None
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    issuer_company: Optional[CompanyResponse] = None
    recipient_company: Optional[CompanyResponse] = None
    load: Optional[LoadShortResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

# Settlement Line Item
class SettlementLineItemCreate(BaseModel):
    description: str
    amount: float
    type: str

class SettlementLineItemResponse(SettlementLineItemCreate):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# Settlement
class SettlementCreate(BaseModel):
    carrier_id: str
    shipment_id: Optional[str] = None
    total_amount: float
    line_items: List[SettlementLineItemCreate] = []

class SettlementResponse(BaseModel):
    id: str
    carrier_id: str
    shipment_id: Optional[str] = None
    total_amount: float
    status: SettlementStatus
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    line_items: List[SettlementLineItemResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
