from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RatingCreate(BaseModel):
    load_id: str
    score: int
    comment: Optional[str] = None

class RatingResponse(BaseModel):
    id: str
    load_id: str
    reviewer_company_id: str
    reviewee_company_id: str
    score: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CompanyRatingAggregate(BaseModel):
    company_id: str
    average_score: float
    total_reviews: int
    recent_reviews: List[RatingResponse]
