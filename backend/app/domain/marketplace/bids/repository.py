from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.repository import BaseRepository
from app.domain.marketplace.bids.models import Bid, BidStatus
from app.domain.marketplace.bids.schemas import BidCreate, BidUpdate

class BidRepository(BaseRepository[Bid, BidCreate, BidUpdate]):
    def get_active_bid(self, db: Session, *, load_id: str, carrier_id: str) -> Optional[Bid]:
        return db.query(self.model).filter(
            self.model.load_id == load_id,
            self.model.carrier_id == carrier_id,
            self.model.status == BidStatus.PENDING
        ).first()

    def get_my_bids(self, db: Session, *, carrier_id: str) -> List[Bid]:
        return db.query(self.model).filter(self.model.carrier_id == carrier_id).order_by(self.model.created_at.desc()).all()

    def get_by_id_and_carrier(self, db: Session, *, bid_id: str, carrier_id: str) -> Optional[Bid]:
        return db.query(self.model).filter(self.model.id == bid_id, self.model.carrier_id == carrier_id).first()

    def get_bids_for_load(self, db: Session, *, load_id: str) -> List[Bid]:
        return db.query(self.model).filter(self.model.load_id == load_id).order_by(self.model.amount.asc()).all()

bid_repository = BidRepository(Bid)
