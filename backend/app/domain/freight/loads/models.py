import enum
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class LoadStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    OPEN_FOR_BIDDING = "OPEN_FOR_BIDDING"
    TENDER_SENT = "TENDER_SENT"
    TENDER_ACCEPTED = "TENDER_ACCEPTED"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    PICKUP_COMPLETED = "PICKUP_COMPLETED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    DISPUTED = "DISPUTED"

class Load(Base):
    __tablename__ = "loads"
    id = Column(String, primary_key=True, default=generate_uuid)
    shipper_id = Column(String, ForeignKey("companies.id"), index=True, nullable=False)
    origin_address = Column(String, nullable=False)
    destination_address = Column(String, nullable=False)
    pickup_date = Column(DateTime, nullable=False)
    delivery_date = Column(DateTime, nullable=False)
    equipment_type = Column(String, nullable=False)
    weight_lbs = Column(Integer, nullable=False)
    commodity = Column(String, nullable=True)
    dimensions = Column(String, nullable=True)
    special_instructions = Column(String, nullable=True)
    
    # Pickup Appointment
    pickup_appointment_date = Column(DateTime, nullable=True)
    pickup_appointment_time = Column(String, nullable=True)
    pickup_contact_person = Column(String, nullable=True)
    pickup_contact_number = Column(String, nullable=True)
    pickup_dock_number = Column(String, nullable=True)
    pickup_reference_number = Column(String, nullable=True)
    pickup_special_instructions = Column(String, nullable=True)
    
    # Delivery Appointment
    delivery_appointment_date = Column(DateTime, nullable=True)
    delivery_appointment_time = Column(String, nullable=True)
    delivery_contact_person = Column(String, nullable=True)
    delivery_contact_number = Column(String, nullable=True)
    delivery_dock_number = Column(String, nullable=True)
    delivery_reference_number = Column(String, nullable=True)
    delivery_special_instructions = Column(String, nullable=True)
    status = Column(Enum(LoadStatus), default=LoadStatus.OPEN_FOR_BIDDING, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    shipper = relationship("Company", foreign_keys=[shipper_id])
