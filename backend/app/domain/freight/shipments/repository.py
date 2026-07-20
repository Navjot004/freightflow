from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.repository import BaseRepository
from app.domain.freight.shipments.models import Shipment, ShipmentDocument, PartnerAssignment
from app.domain.freight.loads.models import Load

class ShipmentRepository(BaseRepository[Shipment, dict, dict]):
    def get_by_load(self, db: Session, *, load_id: str) -> Optional[Shipment]:
        return db.query(self.model).filter(self.model.load_id == load_id).first()

    def get_by_id_and_carrier(self, db: Session, *, shipment_id: str, carrier_id: str) -> Optional[Shipment]:
        return db.query(self.model).filter(self.model.id == shipment_id, self.model.carrier_id == carrier_id).first()

    def get_my_shipments(self, db: Session, *, company_id: str, company_type: str) -> List[Shipment]:
        if company_type == "BROKER":
            return db.query(self.model).join(Load).filter(
                or_(Load.shipper_id == company_id, self.model.carrier_id == company_id, self.model.broker_id == company_id)
            ).all()
        elif company_type == "SHIPPER":
            return db.query(self.model).join(Load).filter(Load.shipper_id == company_id).all()
        else:
            return db.query(self.model).filter(self.model.carrier_id == company_id).all()

class ShipmentDocumentRepository(BaseRepository[ShipmentDocument, dict, dict]):
    def get_latest_pod(self, db: Session, *, shipment_id: str) -> Optional[ShipmentDocument]:
        return db.query(self.model).filter(
            self.model.shipment_id == shipment_id, 
            self.model.document_type == 'POD'
        ).order_by(self.model.created_at.desc()).first()

class PartnerAssignmentRepository(BaseRepository[PartnerAssignment, dict, dict]):
    def get_active_assignment(self, db: Session, *, shipment_id: str) -> Optional[PartnerAssignment]:
        from app.domain.freight.shipments.models import AssignmentStatus
        return db.query(self.model).filter(
            self.model.shipment_id == shipment_id,
            self.model.status == AssignmentStatus.PENDING
        ).first()
        
    def get_by_id_and_partner(self, db: Session, *, assignment_id: str, partner_id: str) -> Optional[PartnerAssignment]:
        return db.query(self.model).filter(
            self.model.id == assignment_id, 
            self.model.partner_id == partner_id
        ).first()

    def get_by_id_and_broker(self, db: Session, *, assignment_id: str, broker_id: str) -> Optional[PartnerAssignment]:
        return db.query(self.model).filter(
            self.model.id == assignment_id, 
            self.model.broker_id == broker_id
        ).first()

    def get_my_assignments(self, db: Session, *, company_id: str, company_type: str) -> List[PartnerAssignment]:
        if company_type == "BROKER":
            return db.query(self.model).filter(self.model.broker_id == company_id).order_by(self.model.assigned_at.desc()).all()
        else:
            return db.query(self.model).filter(self.model.partner_id == company_id).order_by(self.model.assigned_at.desc()).all()

shipment_repository = ShipmentRepository(Shipment)
shipment_document_repository = ShipmentDocumentRepository(ShipmentDocument)
partner_assignment_repository = PartnerAssignmentRepository(PartnerAssignment)
