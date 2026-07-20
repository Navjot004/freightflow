import enum
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class DriverStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    ON_TRIP = "ON_TRIP"
    OFF_DUTY = "OFF_DUTY"
    ON_LEAVE = "ON_LEAVE"
    SUSPENDED = "SUSPENDED"

class HOSStatus(str, enum.Enum):
    OFF_DUTY = "OFF_DUTY"
    SLEEPER = "SLEEPER"
    DRIVING = "DRIVING"
    ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING"

class DriverProfile(Base):
    __tablename__ = "driver_profiles"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    
    phone = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    license_expiry = Column(DateTime(timezone=True), nullable=True)
    emergency_contact = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)
    manager_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    status = Column(Enum(DriverStatus), default=DriverStatus.AVAILABLE)
    current_hos_status = Column(Enum(HOSStatus), default=HOSStatus.OFF_DUTY)
    hos_last_updated = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", foreign_keys=[user_id])
    manager = relationship("User", foreign_keys=[manager_id])

class DriverAssignmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class DriverAssignment(Base):
    __tablename__ = "driver_assignments"
    id = Column(String, primary_key=True, default=generate_uuid)
    shipment_id = Column(String, ForeignKey("shipments.id"), index=True, nullable=False)
    driver_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    assigned_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(DriverAssignmentStatus), default=DriverAssignmentStatus.PENDING)
    
    notes = Column(String, nullable=True)
    rejection_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)

    driver = relationship("User", foreign_keys=[driver_id])
    assigner = relationship("User", foreign_keys=[assigned_by])

class DriverHOSLog(Base):
    __tablename__ = "driver_hos_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    driver_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    status = Column(Enum(HOSStatus), nullable=False)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    location = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    driver = relationship("User", foreign_keys=[driver_id])
