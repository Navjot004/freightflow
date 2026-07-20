from fastapi import Query
from sqlalchemy.orm import Query as SAQuery
from typing import TypeVar, Generic, List
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    skip: int
    limit: int
    items: List[T]

class PaginationParams:
    def __init__(
        self, 
        skip: int = Query(0, ge=0, description="Number of items to skip"), 
        limit: int = Query(100, ge=1, le=100, description="Max number of items to return")
    ):
        self.skip = skip
        self.limit = limit

def apply_pagination(query: SAQuery, params: PaginationParams) -> SAQuery:
    """Applies limit and offset to a SQLAlchemy query."""
    return query.offset(params.skip).limit(params.limit)

def get_paginated_response(query: SAQuery, params: PaginationParams) -> dict:
    """Executes the query and returns a dictionary matching PaginatedResponse format."""
    total = query.count()
    items = apply_pagination(query, params).all()
    return {
        "total": total,
        "skip": params.skip,
        "limit": params.limit,
        "items": items
    }
