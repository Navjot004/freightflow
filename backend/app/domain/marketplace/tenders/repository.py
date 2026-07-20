from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.repository import BaseRepository
from app.domain.marketplace.tenders.models import Tender, TenderStatus
from app.domain.marketplace.tenders.schemas import TenderCreate, TenderUpdate

class TenderRepository(BaseRepository[Tender, TenderCreate, TenderUpdate]):
    def get_active_tender(self, db: Session, *, load_id: str) -> Optional[Tender]:
        return db.query(self.model).filter(
            self.model.load_id == load_id,
            self.model.status == TenderStatus.PENDING
        ).first()

    def get_by_id_and_carrier(self, db: Session, *, tender_id: str, carrier_id: str) -> Optional[Tender]:
        return db.query(self.model).filter(
            self.model.id == tender_id,
            self.model.carrier_id == carrier_id
        ).first()

    def get_my_tenders(self, db: Session, *, company_id: str, company_type: str) -> List[Tender]:
        if company_type == "BROKER":
            return db.query(self.model).filter(
                or_(self.model.shipper_id == company_id, self.model.carrier_id == company_id)
            ).order_by(self.model.created_at.desc()).all()
        elif company_type == "SHIPPER":
            return db.query(self.model).filter(self.model.shipper_id == company_id).order_by(self.model.created_at.desc()).all()
        else:
            return db.query(self.model).filter(self.model.carrier_id == company_id).order_by(self.model.created_at.desc()).all()

    def get_load_tenders(self, db: Session, *, load_id: str, shipper_id: str) -> List[Tender]:
        return db.query(self.model).filter(
            self.model.load_id == load_id,
            self.model.shipper_id == shipper_id
        ).order_by(self.model.created_at.desc()).all()

tender_repository = TenderRepository(Tender)
