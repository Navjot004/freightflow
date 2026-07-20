from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.domain.marketplace.ratings.schemas import RatingCreate, CompanyRatingAggregate
from app.domain.freight.loads.models import LoadStatus
from app.domain.marketplace.ratings.repository import rating_repository
from app.domain.freight.loads.repository import load_repository

def create_rating(db: Session, rating_in: RatingCreate, current_company_id: str):
    if rating_in.score < 1 or rating_in.score > 5:
        raise HTTPException(400, "Score must be 1-5")
        
    load = load_repository.get(db=db, id=rating_in.load_id)
    if not load:
        raise HTTPException(404, "Load not found")
        
    if load.status != LoadStatus.COMPLETED:
        raise HTTPException(400, "Load must be completed to rate")
        
    if current_company_id == load.shipper_id:
        from app.domain.freight.shipments.repository import shipment_repository
        ship = shipment_repository.get_by_load(db=db, load_id=load.id)
        if not ship:
            raise HTTPException(404, "Shipment not found")
        reviewee_id = ship.carrier_id
    else:
        reviewee_id = load.shipper_id

    existing = rating_repository.get_by_load_and_reviewer(db=db, load_id=load.id, reviewer_company_id=current_company_id)
    if existing:
        raise HTTPException(400, "You have already rated this load")

    rating = rating_repository.model(
        load_id=load.id,
        reviewer_company_id=current_company_id,
        reviewee_company_id=reviewee_id,
        score=rating_in.score,
        comment=rating_in.comment
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating

def get_company_rating(db: Session, company_id: str):
    ratings = rating_repository.get_company_ratings(db=db, company_id=company_id)
    if not ratings:
        return CompanyRatingAggregate(company_id=company_id, average_score=0.0, total_reviews=0, recent_reviews=[])
        
    total = sum(r.score for r in ratings)
    avg = total / len(ratings)
    
    return CompanyRatingAggregate(
        company_id=company_id,
        average_score=avg,
        total_reviews=len(ratings),
        recent_reviews=ratings[:10]
    )
