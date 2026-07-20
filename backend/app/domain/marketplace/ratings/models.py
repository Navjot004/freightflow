from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.domain.identity.models import generate_uuid

class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        UniqueConstraint('load_id', 'reviewer_company_id', name='uq_rating_load_reviewer'),
    )
    id = Column(String, primary_key=True, default=generate_uuid)
    load_id = Column(String, ForeignKey("loads.id"), index=True, nullable=False)
    reviewer_company_id = Column(String, ForeignKey("companies.id"), index=True, nullable=False)
    reviewee_company_id = Column(String, ForeignKey("companies.id"), index=True, nullable=False)
    
    score = Column(Integer, nullable=False) # 1 to 5
    comment = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    load = relationship("Load")
    reviewer = relationship("Company", foreign_keys=[reviewer_company_id])
    reviewee = relationship("Company", foreign_keys=[reviewee_company_id])
