from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.domain.finance.models import InvoiceStatus, SettlementStatus

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

# Invoice
class InvoiceCreate(BaseModel):
    shipper_id: str
    shipment_id: Optional[str] = None
    amount: float
    due_date: Optional[datetime] = None

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    shipper_id: str
    shipment_id: Optional[str] = None
    amount: float
    status: InvoiceStatus
    due_date: Optional[datetime] = None
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
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
