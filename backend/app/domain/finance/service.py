import uuid
from sqlalchemy.orm import Session
from app.domain.finance.models import Invoice, Settlement, SettlementLineItem, InvoiceStatus, SettlementStatus
from app.domain.finance.repository import invoice_repository, settlement_repository
from app.domain.finance.schemas import InvoiceCreate, SettlementCreate

def create_invoice(db: Session, invoice_in: InvoiceCreate) -> Invoice:
    invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
    invoice = invoice_repository.model(
        invoice_number=invoice_number,
        shipper_id=invoice_in.shipper_id,
        shipment_id=invoice_in.shipment_id,
        amount=invoice_in.amount,
        due_date=invoice_in.due_date,
        status=InvoiceStatus.DRAFT
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

def get_company_invoices(db: Session, company_id: str):
    return invoice_repository.get_by_company(db=db, shipper_id=company_id)

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
