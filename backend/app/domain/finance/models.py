import enum
from sqlalchemy import Column, String, Float, ForeignKey, Enum, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid, Company
from app.domain.freight.loads.models import Load
from app.domain.freight.shipments.models import Shipment

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    VOID = "VOID"

class InvoiceRelationshipType(str, enum.Enum):
    BROKER_TO_SHIPPER = "BROKER_TO_SHIPPER"
    CARRIER_TO_SHIPPER = "CARRIER_TO_SHIPPER"
    OWNER_OPERATOR_TO_SHIPPER = "OWNER_OPERATOR_TO_SHIPPER"
    CARRIER_TO_BROKER = "CARRIER_TO_BROKER"
    OWNER_OPERATOR_TO_BROKER = "OWNER_OPERATOR_TO_BROKER"
    OWNER_OPERATOR_TO_CARRIER = "OWNER_OPERATOR_TO_CARRIER"

class SettlementStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    DISPUTED = "DISPUTED"

class FinancialAccount(Base):
    __tablename__ = "financial_accounts"
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), unique=True, nullable=False)
    account_type = Column(String, nullable=False) # e.g. "AR", "AP", "BOTH"
    balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(String, primary_key=True, default=generate_uuid)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    
    issuer_company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    recipient_company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    relationship_type = Column(Enum(InvoiceRelationshipType), nullable=False, index=True)
    
    load_id = Column(String, ForeignKey("loads.id"), nullable=True, index=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=True, index=True)
    
    linehaul_amount = Column(Float, default=0.0, nullable=False)
    fuel_surcharge = Column(Float, default=0.0, nullable=False)
    accessorials_amount = Column(Float, default=0.0, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    amount = Column(Float, nullable=False)
    
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, index=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    pdf_url = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    issuer_company = relationship("Company", foreign_keys=[issuer_company_id])
    recipient_company = relationship("Company", foreign_keys=[recipient_company_id])
    load = relationship("Load")
    shipment = relationship("Shipment")

class Settlement(Base):
    __tablename__ = "settlements"
    id = Column(String, primary_key=True, default=generate_uuid)
    carrier_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=True, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(SettlementStatus), default=SettlementStatus.PENDING)
    payment_method = Column(String, nullable=True) # ACH, WIRE, CHECK
    payment_reference = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    carrier = relationship("Company")
    shipment = relationship("Shipment")
    line_items = relationship("SettlementLineItem", back_populates="settlement", cascade="all, delete-orphan")

class SettlementLineItem(Base):
    __tablename__ = "settlement_line_items"
    id = Column(String, primary_key=True, default=generate_uuid)
    settlement_id = Column(String, ForeignKey("settlements.id"), nullable=False, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # LINEHAUL, FSC, ACCESSORIAL, DEDUCTION
    
    settlement = relationship("Settlement", back_populates="line_items")
