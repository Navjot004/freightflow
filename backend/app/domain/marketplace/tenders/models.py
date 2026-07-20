import enum
from sqlalchemy import Column, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class TenderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class Tender(Base):
    __tablename__ = "tenders"
    id = Column(String, primary_key=True, default=generate_uuid)
    load_id = Column(String, ForeignKey("loads.id"), index=True, nullable=False)
    shipper_id = Column(String, ForeignKey("companies.id"), index=True, nullable=False)
    carrier_id = Column(String, ForeignKey("companies.id"), index=True, nullable=False)
    bid_id = Column(String, ForeignKey("bids.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    status = Column(Enum(TenderStatus), default=TenderStatus.PENDING, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    load = relationship("Load")
    shipper = relationship("Company", foreign_keys=[shipper_id])
    carrier = relationship("Company", foreign_keys=[carrier_id])
    bid = relationship("Bid")
