import enum
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class WebhookStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    FAILED = "FAILED"

class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    key_hash = Column(String, nullable=False, unique=True)
    prefix = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    company = relationship("Company")

class Webhook(Base):
    __tablename__ = "webhooks"
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    url = Column(String, nullable=False)
    secret = Column(String, nullable=False)
    events = Column(JSON, nullable=False) # List of event strings e.g. ["SHIPMENT.STATUS_CHANGED"]
    status = Column(Enum(WebhookStatus), default=WebhookStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company")

class EdiConfiguration(Base):
    __tablename__ = "edi_configurations"
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    partner_id = Column(String, ForeignKey("companies.id"), nullable=True, index=True)
    isa_sender_id = Column(String, nullable=False)
    isa_receiver_id = Column(String, nullable=False)
    qualifier = Column(String, default="ZZ")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", foreign_keys=[company_id])
