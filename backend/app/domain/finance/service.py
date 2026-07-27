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

def generate_invoices_for_completed_shipment(db: Session, shipment_id: str):
    from app.domain.freight.shipments.models import Shipment
    from app.domain.freight.loads.models import Load
    from app.domain.identity.models import Company, CompanyType
    from app.domain.finance.models import InvoiceRelationshipType
    
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        return
        
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    if not load:
        return
        
    existing = db.query(Invoice).filter(Invoice.shipment_id == shipment.id).first()
    if existing:
        return

    year = datetime.now().year
    
    # 1. Primary Carrier / Broker invoice to Shipper
    primary_carrier_id = shipment.broker_id or shipment.carrier_id
    shipper_id = load.shipper_id
    shipper_rate = shipment.shipper_rate or load.rate or 0.0
    
    if primary_carrier_id and shipper_id and shipper_rate > 0:
        primary_company = db.query(Company).filter(Company.id == primary_carrier_id).first()
        rel_type = InvoiceRelationshipType.BROKER_TO_SHIPPER if (primary_company and primary_company.type == CompanyType.BROKER) else InvoiceRelationshipType.CARRIER_TO_SHIPPER
        
        inv1 = Invoice(
            invoice_number=f"INV-{year}-{uuid.uuid4().hex[:6].upper()}",
            issuer_company_id=primary_carrier_id,
            recipient_company_id=shipper_id,
            relationship_type=rel_type,
            load_id=load.id,
            shipment_id=shipment.id,
            linehaul_amount=shipper_rate,
            amount=shipper_rate,
            status=InvoiceStatus.ISSUED
        )
        db.add(inv1)

    # 2. Subcontracted Partner invoice to Primary Carrier / Broker
    subcontracted_partner_id = shipment.carrier_id if shipment.broker_id else (shipment.carrier_id if shipment.partner_rate else None)
    partner_rate = shipment.partner_rate or shipment.carrier_rate or 0.0
    
    if subcontracted_partner_id and primary_carrier_id and subcontracted_partner_id != primary_carrier_id and partner_rate > 0:
        partner_company = db.query(Company).filter(Company.id == subcontracted_partner_id).first()
        if partner_company and partner_company.type == CompanyType.OWNER_OPERATOR:
            p_rel_type = InvoiceRelationshipType.OWNER_OPERATOR_TO_CARRIER if shipment.broker_id is None else InvoiceRelationshipType.OWNER_OPERATOR_TO_BROKER
        elif partner_company and partner_company.type == CompanyType.CARRIER:
            p_rel_type = InvoiceRelationshipType.CARRIER_TO_CARRIER if shipment.broker_id is None else InvoiceRelationshipType.CARRIER_TO_BROKER
        else:
            p_rel_type = InvoiceRelationshipType.CARRIER_TO_BROKER
            
        inv2 = Invoice(
            invoice_number=f"INV-{year}-{uuid.uuid4().hex[:6].upper()}",
            issuer_company_id=subcontracted_partner_id,
            recipient_company_id=primary_carrier_id,
            relationship_type=p_rel_type,
            load_id=load.id,
            shipment_id=shipment.id,
            linehaul_amount=partner_rate,
            amount=partner_rate,
            status=InvoiceStatus.ISSUED
        )
        db.add(inv2)
        
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning: Failed to auto-generate invoices: {e}")
