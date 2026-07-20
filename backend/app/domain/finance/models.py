import enum
from sqlalchemy import Column, String, Float, ForeignKey, Enum, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    VOID = "VOID"

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
    shipper_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    due_date = Column(DateTime(timezone=True), nullable=True)
    pdf_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    shipper = relationship("Company")
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
