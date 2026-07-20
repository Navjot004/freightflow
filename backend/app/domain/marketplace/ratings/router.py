from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.domain.marketplace.ratings import schemas, service
from app.core.deps import RequireRole
from app.domain.identity.models import User

router = APIRouter()

@router.post("", response_model=schemas.RatingResponse)
def create_rating(
    rating_in: schemas.RatingCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"])),
    db: Session = Depends(get_db)
):
    return service.create_rating(db, rating_in, current_user.company_id)

@router.get("/company/{company_id}", response_model=schemas.CompanyRatingAggregate)
def get_company_ratings(
    company_id: str,
    db: Session = Depends(get_db)
):
    return service.get_company_rating(db, company_id)
