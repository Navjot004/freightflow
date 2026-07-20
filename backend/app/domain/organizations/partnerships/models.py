import uuid
import enum
from sqlalchemy import Column, String, ForeignKey, Enum, JSON, DateTime, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import Company, CompanyType

def generate_uuid():
    return str(uuid.uuid4())

class PartnershipStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONNECTED = "CONNECTED"
    REJECTED = "REJECTED"
    BLOCKED = "BLOCKED"
    REMOVED = "REMOVED"
    CANCELLED = "CANCELLED"

class Partnership(Base):
    __tablename__ = "transportation_partnerships"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    broker_company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    partner_company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    partner_type = Column(Enum(CompanyType), nullable=False) # CARRIER or OWNER_OPERATOR
    status = Column(Enum(PartnershipStatus), nullable=False, index=True)
    request_message = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    removed_at = Column(DateTime(timezone=True), nullable=True)

    broker = relationship("Company", foreign_keys=[broker_company_id])
    partner = relationship("Company", foreign_keys=[partner_company_id])
    
    __table_args__ = (
        UniqueConstraint('broker_company_id', 'partner_company_id', name='uq_broker_partner_partnership'),
    )

class CarrierProfile(Base):
    __tablename__ = "carrier_profiles"
    
    company_id = Column(String, ForeignKey("companies.id"), primary_key=True)
    fleet_size = Column(Integer, default=0)
    equipment_types = Column(JSON, default=list)
    operating_regions = Column(JSON, default=list)
    logo_url = Column(String, nullable=True)
    
    company = relationship("Company", backref="carrier_profile")
