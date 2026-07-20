from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.repository import BaseRepository
from app.domain.marketplace.ratings.models import Rating
from app.domain.marketplace.ratings.schemas import RatingCreate

class RatingRepository(BaseRepository[Rating, dict, dict]):
    def get_by_load_and_reviewer(self, db: Session, *, load_id: str, reviewer_company_id: str) -> Optional[Rating]:
        return db.query(self.model).filter(
            self.model.load_id == load_id, 
            self.model.reviewer_company_id == reviewer_company_id
        ).first()

    def get_company_ratings(self, db: Session, *, company_id: str) -> List[Rating]:
        return db.query(self.model).filter(self.model.reviewee_company_id == company_id).order_by(self.model.created_at.desc()).all()

rating_repository = RatingRepository(Rating)
