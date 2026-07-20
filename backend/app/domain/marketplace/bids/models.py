import enum
from sqlalchemy import Column, String, Float, ForeignKey, Enum, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class BidStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    TENDER_SENT = "TENDER_SENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"
    EXPIRED = "EXPIRED"
    NOT_SELECTED = "NOT_SELECTED"

class Bid(Base):
    __tablename__ = "bids"
    id = Column(String, primary_key=True, default=generate_uuid)
    load_id = Column(String, ForeignKey("loads.id"), index=True, nullable=False)
    carrier_id = Column(String, ForeignKey("companies.id"), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(BidStatus), default=BidStatus.PENDING, index=True)
    notes = Column(String, nullable=True)
    available_pickup_date = Column(DateTime(timezone=True), nullable=True)
    transit_time_estimate_hours = Column(Integer, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    load = relationship("Load")
    carrier = relationship("Company", foreign_keys=[carrier_id])
