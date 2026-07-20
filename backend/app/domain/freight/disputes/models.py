import enum
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class DisputeStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class Dispute(Base):
    __tablename__ = "disputes"
    id = Column(String, primary_key=True, default=generate_uuid)
    load_id = Column(String, ForeignKey("loads.id"), index=True, nullable=False)
    raised_by_company_id = Column(String, ForeignKey("companies.id"), index=True, nullable=False)
    against_company_id = Column(String, ForeignKey("companies.id"), index=True, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(Enum(DisputeStatus), default=DisputeStatus.OPEN, index=True)
    resolution_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    load = relationship("Load")
    raised_by_company = relationship("Company", foreign_keys=[raised_by_company_id])
    against_company = relationship("Company", foreign_keys=[against_company_id])
