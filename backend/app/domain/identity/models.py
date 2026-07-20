import uuid
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum, JSON, DateTime, Date, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class CompanyType(str, enum.Enum):
    SHIPPER = "SHIPPER"
    BROKER = "BROKER"
    CARRIER = "CARRIER"
    OWNER_OPERATOR = "OWNER_OPERATOR"

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(Enum(CompanyType), nullable=False)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    dot_number = Column(String, unique=True, nullable=True)
    mc_number = Column(String, unique=True, nullable=True)
    tax_id = Column(String, unique=True, nullable=True)
    insurance_expiry_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="company")
    vehicle = relationship("CompanyVehicle", back_populates="company", uselist=False)
    company_users = relationship("CompanyUser", back_populates="company")

class CompanyVehicle(Base):
    __tablename__ = "company_vehicles"
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), unique=True)
    truck_number = Column(String)
    trailer_number = Column(String)
    equipment_type = Column(String)
    capacity_lbs = Column(Integer)
    status = Column(String, default="ACTIVE", index=True)
    insurance_expiry = Column(Date)
    registration_expiry = Column(Date)
    maintenance_date = Column(Date)

    company = relationship("Company", back_populates="vehicle")

class Role(Base):
    __tablename__ = "roles"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    permissions = Column(JSON, default=list)

    users = relationship("User", back_populates="role")
    company_users = relationship("CompanyUser", back_populates="role")

class CompanyUser(Base):
    __tablename__ = "company_users"
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), primary_key=True)
    role_id = Column(String, ForeignKey("roles.id"), index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="company_users")
    company = relationship("Company", back_populates="company_users")
    role = relationship("Role", back_populates="company_users")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    is_active = Column(Boolean, default=True)
    requires_password_change = Column(Boolean, default=False)
    phone_number = Column(String, nullable=True)
    
    company_id = Column(String, ForeignKey("companies.id"), index=True)
    role_id = Column(String, ForeignKey("roles.id"), index=True)

    company = relationship("Company", back_populates="users")
    role = relationship("Role", back_populates="users")
    company_users = relationship("CompanyUser", back_populates="user")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Invitation(Base):
    __tablename__ = "invitations"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, index=True, nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), index=True)
    role_name = Column(String, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    is_accepted = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
