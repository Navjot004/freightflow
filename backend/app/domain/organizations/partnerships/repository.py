from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.repository import BaseRepository
from app.domain.organizations.partnerships.models import Partnership, CarrierProfile, PartnershipStatus

class PartnershipRepository(BaseRepository[Partnership, dict, dict]):
    def get_by_companies(self, db: Session, *, broker_id: str, partner_id: str) -> Optional[Partnership]:
        return db.query(self.model).filter(
            self.model.broker_company_id == broker_id,
            self.model.partner_company_id == partner_id
        ).first()

    def get_any_direction(self, db: Session, *, company_a: str, company_b: str) -> Optional[Partnership]:
        from sqlalchemy import or_, and_
        return db.query(self.model).filter(
            or_(
                and_(self.model.broker_company_id == company_a, self.model.partner_company_id == company_b),
                and_(self.model.broker_company_id == company_b, self.model.partner_company_id == company_a)
            )
        ).first()

    def get_pending_requests(self, db: Session, *, company_id: str) -> List[Partnership]:
        from sqlalchemy import or_
        return db.query(self.model).filter(
            or_(self.model.partner_company_id == company_id, self.model.broker_company_id == company_id),
            self.model.status == PartnershipStatus.PENDING
        ).order_by(self.model.created_at.desc()).all()

    def get_connected_partners(self, db: Session, *, company_id: str) -> List[Partnership]:
        from sqlalchemy import or_
        return db.query(self.model).filter(
            or_(self.model.broker_company_id == company_id, self.model.partner_company_id == company_id),
            self.model.status == PartnershipStatus.CONNECTED
        ).all()

    def get_connected_brokers(self, db: Session, *, partner_id: str) -> List[Partnership]:
        return db.query(self.model).filter(
            self.model.partner_company_id == partner_id,
            self.model.status == PartnershipStatus.CONNECTED
        ).order_by(self.model.accepted_at.desc()).all()

class CarrierProfileRepository(BaseRepository[CarrierProfile, dict, dict]):
    def get_by_company(self, db: Session, *, company_id: str) -> Optional[CarrierProfile]:
        return db.query(self.model).filter(self.model.company_id == company_id).first()

partnership_repository = PartnershipRepository(Partnership)
carrier_profile_repository = CarrierProfileRepository(CarrierProfile)
