from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid
import enum
from sqlalchemy import Enum

class ShipmentStatus(str, enum.Enum):
    WAITING_FOR_PARTNER_ASSIGNMENT = "WAITING_FOR_PARTNER_ASSIGNMENT"
    WAITING_FOR_DRIVER_ASSIGNMENT = "WAITING_FOR_DRIVER_ASSIGNMENT"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    DRIVER_ACCEPTED = "DRIVER_ACCEPTED"
    PICKUP_STARTED = "PICKUP_STARTED"
    PICKUP_COMPLETED = "PICKUP_COMPLETED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    POD_UPLOADED = "POD_UPLOADED"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"

class DocumentStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(String, primary_key=True, default=generate_uuid)
    load_id = Column(String, ForeignKey("loads.id"), unique=True, index=True, nullable=False)
    carrier_id = Column(String, ForeignKey("companies.id"), index=True, nullable=True)
    broker_id = Column(String, ForeignKey("companies.id"), index=True, nullable=True)
    
    # Driver Info
    driver_name = Column(String, nullable=True)
    driver_phone = Column(String, nullable=True)
    truck_number = Column(String, nullable=True)
    
    # Tracking
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT, index=True)
    current_location = Column(String, nullable=True)
    eta = Column(DateTime(timezone=True), nullable=True)
    delay_reason = Column(String, nullable=True)
    
    # Legacy Document fields (can be kept for backward compatibility if needed, but we'll use shipment_documents)
    bol_url = Column(String, nullable=True) # Bill of Lading
    pod_url = Column(String, nullable=True) # Proof of Delivery

    # Detailed POD fields
    receiver_name = Column(String, nullable=True)
    receiver_signature_url = Column(String, nullable=True)
    delivery_notes = Column(String, nullable=True)
    delivery_photos_urls = Column(String, nullable=True) # Stored as JSON string
    osd_reported = Column(Boolean, default=False)
    osd_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    load = relationship("Load")
    carrier = relationship("Company", foreign_keys=[carrier_id])
    broker = relationship("Company", foreign_keys=[broker_id])
    dispatcher_id = Column(String, ForeignKey("users.id"), index=True, nullable=True)
    dispatcher = relationship("User", foreign_keys=[dispatcher_id])
    tracking_history = relationship("ShipmentTracking", back_populates="shipment", cascade="all, delete-orphan", order_by="ShipmentTracking.timestamp")
    documents = relationship("ShipmentDocument", back_populates="shipment", cascade="all, delete-orphan")

class ShipmentTracking(Base):
    __tablename__ = "shipment_tracking"
    id = Column(String, primary_key=True, default=generate_uuid)
    shipment_id = Column(String, ForeignKey("shipments.id"), index=True, nullable=False)
    
    latitude = Column(String, nullable=False)
    longitude = Column(String, nullable=False)
    speed = Column(String, nullable=True)     # m/s
    heading = Column(String, nullable=True)   # degrees
    accuracy = Column(String, nullable=True)  # meters
    altitude = Column(String, nullable=True)  # meters
    timestamp = Column(DateTime(timezone=True), default=func.now(), index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    shipment = relationship("Shipment", back_populates="tracking_history")

class ShipmentDocument(Base):
    __tablename__ = "shipment_documents"
    id = Column(String, primary_key=True, default=generate_uuid)
    shipment_id = Column(String, ForeignKey("shipments.id"), index=True, nullable=False)
    document_type = Column(String, nullable=False) # 'BOL' or 'POD'
    file_path = Column(String, nullable=False)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(DocumentStatus), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    shipment = relationship("Shipment", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])

class AssignmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class PartnerAssignment(Base):
    __tablename__ = "partner_assignments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    shipment_id = Column(String, ForeignKey("shipments.id", ondelete="CASCADE"), index=True, nullable=False)
    broker_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    partner_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.PENDING, nullable=False)
    
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    notes = Column(String, nullable=True)

    shipment = relationship("Shipment")
    broker = relationship("Company", foreign_keys=[broker_id])
    partner = relationship("Company", foreign_keys=[partner_id])

class IssueType(str, enum.Enum):
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN"
    WEATHER_DELAY = "WEATHER_DELAY"
    TRAFFIC = "TRAFFIC"
    ACCIDENT = "ACCIDENT"
    OTHER = "OTHER"

class IssueStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"

class ShipmentIssue(Base):
    __tablename__ = "shipment_issues"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    shipment_id = Column(String, ForeignKey("shipments.id", ondelete="CASCADE"), index=True, nullable=False)
    reported_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    issue_type = Column(Enum(IssueType), nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(IssueStatus), default=IssueStatus.OPEN, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    shipment = relationship("Shipment")
    reporter = relationship("User", foreign_keys=[reported_by])
