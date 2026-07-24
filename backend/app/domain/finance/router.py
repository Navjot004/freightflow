from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.deps import get_db, get_current_user, RequireRole
from app.domain.identity.models import User
from app.domain.finance import service
from app.domain.finance.schemas import (
    InvoiceCreate, InvoiceResponse, InvoiceStatusUpdate,
    SettlementCreate, SettlementResponse
)

router = APIRouter()

@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_in: InvoiceCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new invoice issued by the current company to a recipient partner.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must be associated with a company to create invoices")
    return service.create_invoice(db=db, issuer_company_id=current_user.company_id, invoice_in=invoice_in)

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(
    side: Optional[str] = Query(None, description="ISSUED (AR) or RECEIVED (AP)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all invoices associated with the current company (AR or AP).
    """
    if not current_user.company_id:
        return []
    return service.get_company_invoices(db=db, company_id=current_user.company_id, side=side)

@router.patch("/invoices/{invoice_id}/status", response_model=InvoiceResponse)
def update_invoice_status(
    invoice_id: str,
    update_in: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update invoice status (e.g. mark as PAID, ISSUED, or VOID).
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must be associated with a company")
    return service.update_invoice_status(db=db, invoice_id=invoice_id, company_id=current_user.company_id, update_in=update_in)

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
    if not current_user.company_id:
        return []
    return service.get_company_settlements(db=db, company_id=current_user.company_id)
