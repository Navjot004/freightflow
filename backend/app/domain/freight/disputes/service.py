from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.domain.freight.disputes.models import Dispute, DisputeStatus
from app.domain.freight.disputes.schemas import DisputeCreate, DisputeResolve
from app.domain.freight.loads.models import Load, LoadStatus
from app.domain.identity.admin.service import log_action
from app.domain.freight.disputes.repository import dispute_repository
from app.domain.freight.loads.repository import load_repository

def create_dispute(db: Session, dispute_in: DisputeCreate, current_company_id: str):
    load = load_repository.get(db=db, id=dispute_in.load_id)
    if not load:
        raise HTTPException(404, "Load not found")
        
    from app.domain.freight.shipments.models import Shipment, ShipmentStatus
    from app.domain.notifications.service import create_notification
    from app.domain.notifications.models import NotificationType

    shipment = db.query(Shipment).filter(Shipment.load_id == load.id).first()
    if shipment:
        shipment.status = ShipmentStatus.DISPUTED

    # Determine against_company_id
    if current_company_id == load.shipper_id:
        if shipment and shipment.carrier_id:
            against_id = shipment.carrier_id
        else:
            raise HTTPException(400, "Cannot dispute load without an assigned carrier")
    else:
        against_id = load.shipper_id

    dispute = dispute_repository.model(
        load_id=load.id,
        raised_by_company_id=current_company_id,
        against_company_id=against_id,
        reason=dispute_in.reason,
        status=DisputeStatus.OPEN
    )
    db.add(dispute)

    create_notification(
        db,
        against_id,
        "Dispute Raised",
        f"A dispute has been raised regarding Load #{load.id[:8]}. Reason: {dispute_in.reason}",
        NotificationType.WARNING,
        "Dispute",
        dispute.id,
        "/disputes"
    )

    db.commit()
    db.refresh(dispute)
    return dispute

def resolve_dispute(db: Session, dispute_id: str, resolve_in: DisputeResolve, admin_id: str):
    dispute = dispute_repository.get(db=db, id=dispute_id)
    if not dispute:
        raise HTTPException(404, "Dispute not found")
        
    dispute.status = resolve_in.status
    dispute.resolution_notes = resolve_in.resolution_notes
    
    from app.domain.freight.shipments.models import Shipment, ShipmentStatus, ShipmentDocument, DocumentStatus
    from app.domain.freight.loads.models import Load, LoadStatus
    from app.domain.notifications.service import create_notification
    from app.domain.notifications.models import NotificationType

    shipment = db.query(Shipment).filter(Shipment.load_id == dispute.load_id).first()
    load = db.query(Load).filter(Load.id == dispute.load_id).first()

    if resolve_in.status == DisputeStatus.RESOLVED:
        # Resolve in favor of POD acceptance
        if shipment:
            shipment.status = ShipmentStatus.COMPLETED
            doc = db.query(ShipmentDocument).filter(
                ShipmentDocument.shipment_id == shipment.id,
                ShipmentDocument.document_type == 'POD'
            ).order_by(ShipmentDocument.created_at.desc()).first()
            if doc:
                doc.status = DocumentStatus.VERIFIED

        if load:
            load.status = LoadStatus.COMPLETED

        create_notification(
            db,
            dispute.raised_by_company_id,
            "Dispute Resolved",
            f"Dispute for Load #{dispute.load_id[:8]} has been RESOLVED in your favor. Load is completed.",
            NotificationType.SUCCESS,
            "Dispute",
            dispute.id,
            "/disputes"
        )
    elif resolve_in.status == DisputeStatus.DISMISSED:
        # Dismiss dispute, allow re-upload
        if shipment:
            shipment.status = ShipmentStatus.DELIVERED

        create_notification(
            db,
            dispute.raised_by_company_id,
            "Dispute Dismissed",
            f"Dispute for Load #{dispute.load_id[:8]} was DISMISSED. Please re-upload valid Proof of Delivery.",
            NotificationType.INFO,
            "Dispute",
            dispute.id,
            "/disputes"
        )

    log_action(db, admin_id, "RESOLVE_DISPUTE", dispute_id, {"status": str(resolve_in.status)})
    db.commit()
    db.refresh(dispute)
    return dispute

