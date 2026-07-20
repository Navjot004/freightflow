from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user, RequireRole
from app.domain.identity.models import User
from app.domain.finance import service
from app.domain.finance.schemas import (
    InvoiceCreate, InvoiceResponse,
    SettlementCreate, SettlementResponse
)

router = APIRouter()

@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_in: InvoiceCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"]))
):
    """
    Create a new invoice for a shipper.
    """
    return service.create_invoice(db=db, invoice_in=invoice_in)

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all invoices for current company.
    """
    return service.get_company_invoices(db=db, company_id=current_user.company_id)

@router.post("/settlements", response_model=SettlementResponse)
def create_settlement(
    *,
    db: Session = Depends(get_db),
    settlement_in: SettlementCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"]))
):
    """
    Create a settlement for a carrier.
    """
    return service.create_settlement(db=db, settlement_in=settlement_in)

@router.get("/settlements", response_model=List[SettlementResponse])
def get_settlements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all settlements for current company.
    """
    return service.get_company_settlements(db=db, company_id=current_user.company_id)
