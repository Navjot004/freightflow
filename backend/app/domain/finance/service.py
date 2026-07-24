import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.domain.finance.models import Invoice, Settlement, SettlementLineItem, InvoiceStatus, SettlementStatus
from app.domain.finance.repository import invoice_repository, settlement_repository
from app.domain.finance.schemas import InvoiceCreate, SettlementCreate, InvoiceStatusUpdate
from fastapi import HTTPException, status

def create_invoice(db: Session, issuer_company_id: str, invoice_in: InvoiceCreate) -> Invoice:
    total = (
        float(invoice_in.linehaul_amount) +
        float(invoice_in.fuel_surcharge or 0.0) +
        float(invoice_in.accessorials_amount or 0.0) +
        float(invoice_in.tax_amount or 0.0)
    )
    
    year = datetime.now().year
    random_code = uuid.uuid4().hex[:6].upper()
    invoice_number = f"INV-{year}-{random_code}"

    invoice = Invoice(
        invoice_number=invoice_number,
        issuer_company_id=issuer_company_id,
        recipient_company_id=invoice_in.recipient_company_id,
        relationship_type=invoice_in.relationship_type,
        load_id=invoice_in.load_id,
        shipment_id=invoice_in.shipment_id,
        linehaul_amount=invoice_in.linehaul_amount,
        fuel_surcharge=invoice_in.fuel_surcharge,
        accessorials_amount=invoice_in.accessorials_amount,
        tax_amount=invoice_in.tax_amount,
        amount=total,
        due_date=invoice_in.due_date,
        notes=invoice_in.notes,
        status=InvoiceStatus.ISSUED
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

def get_company_invoices(db: Session, company_id: str, side: Optional[str] = None) -> List[Invoice]:
    return invoice_repository.get_by_company(db=db, company_id=company_id, side=side)

def update_invoice_status(db: Session, invoice_id: str, company_id: str, update_in: InvoiceStatusUpdate) -> Invoice:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.issuer_company_id != company_id and invoice.recipient_company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this invoice")
        
    invoice.status = update_in.status
    if update_in.notes:
        invoice.notes = update_in.notes
        
    if update_in.status == InvoiceStatus.PAID:
        invoice.paid_at = datetime.now(timezone.utc)
        
    db.commit()
    db.refresh(invoice)
    return invoice

def create_settlement(db: Session, settlement_in: SettlementCreate) -> Settlement:
    settlement = settlement_repository.model(
        carrier_id=settlement_in.carrier_id,
        shipment_id=settlement_in.shipment_id,
        total_amount=settlement_in.total_amount,
        status=SettlementStatus.PENDING
    )
    db.add(settlement)
    db.flush()
    
    for item in settlement_in.line_items:
        line_item = SettlementLineItem(
            settlement_id=settlement.id,
            description=item.description,
            amount=item.amount,
            type=item.type
        )
        db.add(line_item)
        
    db.commit()
    db.refresh(settlement)
    return settlement

def get_company_settlements(db: Session, company_id: str):
    return settlement_repository.get_by_company(db=db, carrier_id=company_id)
