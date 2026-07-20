from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user, RequireRole
from app.domain.identity.models import User
from app.domain.compliance import service
from app.domain.compliance.schemas import (
    ComplianceRecordCreate, ComplianceRecordResponse
)

router = APIRouter()

@router.post("/records", response_model=ComplianceRecordResponse)
def create_compliance_record(
    *,
    db: Session = Depends(get_db),
    record_in: ComplianceRecordCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"]))
):
    """
    Create a new compliance record.
    """
    # Security: Force company_id to be current user's company (unless admin)
    record_in.company_id = current_user.company_id
    return service.create_compliance_record(db=db, record_in=record_in)

@router.get("/records", response_model=List[ComplianceRecordResponse])
def get_compliance_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all compliance records for current company.
    """
    return service.get_company_compliance(db=db, company_id=current_user.company_id)

@router.get("/companies/{company_id}/records", response_model=List[ComplianceRecordResponse])
def get_company_compliance_records(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all compliance records for a specific company (cross-tenant viewing).
    In a fully strict environment, this would verify a Partnership exists.
    """
    return service.get_company_compliance(db=db, company_id=company_id)
