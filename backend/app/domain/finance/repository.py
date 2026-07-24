from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.db.repository import BaseRepository
from app.domain.finance.models import Invoice, Settlement, FinancialAccount
from app.domain.finance.schemas import InvoiceCreate, SettlementCreate, FinancialAccountBase

from app.domain.freight.shipments.models import Shipment
from app.domain.freight.loads.models import Load

class InvoiceRepository(BaseRepository[Invoice, InvoiceCreate, InvoiceCreate]):
    def get_by_company(self, db: Session, *, company_id: str, side: Optional[str] = None) -> List[Invoice]:
        query = db.query(self.model)
        
        if side == "ISSUED" or side == "AR":
            query = query.filter(self.model.issuer_company_id == company_id)
        elif side == "RECEIVED" or side == "AP":
            query = query.filter(self.model.recipient_company_id == company_id)
        else:
            query = query.filter(
                or_(
                    self.model.issuer_company_id == company_id,
                    self.model.recipient_company_id == company_id
                )
            )
            
        return query.order_by(self.model.created_at.desc()).all()

class SettlementRepository(BaseRepository[Settlement, SettlementCreate, SettlementCreate]):
    def get_by_company(self, db: Session, *, carrier_id: str) -> List[Settlement]:
        return db.query(self.model).outerjoin(Shipment, self.model.shipment_id == Shipment.id)\
                 .outerjoin(Load, Shipment.load_id == Load.id)\
                 .filter(or_(self.model.carrier_id == carrier_id, Load.shipper_id == carrier_id))\
                 .order_by(self.model.created_at.desc()).all()

class FinancialAccountRepository(BaseRepository[FinancialAccount, FinancialAccountBase, FinancialAccountBase]):
    def get_by_company(self, db: Session, *, company_id: str) -> Optional[FinancialAccount]:
        return db.query(self.model).filter(self.model.company_id == company_id).first()

invoice_repository = InvoiceRepository(Invoice)
settlement_repository = SettlementRepository(Settlement)
financial_account_repository = FinancialAccountRepository(FinancialAccount)
