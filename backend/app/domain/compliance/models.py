import enum
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class ComplianceType(str, enum.Enum):
    INSURANCE_LIABILITY = "INSURANCE_LIABILITY"
    INSURANCE_CARGO = "INSURANCE_CARGO"
    FMCSA_AUTHORITY = "FMCSA_AUTHORITY"
    DOT_REGISTRATION = "DOT_REGISTRATION"
    DRIVER_LICENSE = "DRIVER_LICENSE"

class ComplianceStatus(str, enum.Enum):
    VALID = "VALID"
    EXPIRED = "EXPIRED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    REJECTED = "REJECTED"

class ComplianceRecord(Base):
    __tablename__ = "compliance_records"
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    type = Column(Enum(ComplianceType), nullable=False)
    identifier = Column(String, nullable=True) # e.g. Policy number, DOT number
    status = Column(Enum(ComplianceStatus), default=ComplianceStatus.PENDING_VERIFICATION)
    issue_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    document_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company")
