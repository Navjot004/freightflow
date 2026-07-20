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
        
    if load.status not in [LoadStatus.COMPLETED, LoadStatus.IN_TRANSIT, LoadStatus.DELIVERED]:
        raise HTTPException(400, "Can only dispute active or completed loads")
        
    # Determine against_company_id
    if current_company_id == load.shipper_id:
        # Get carrier from shipment
        from app.domain.freight.shipments.repository import shipment_repository
        ship = shipment_repository.get_by_load(db=db, load_id=load.id)
        if not ship:
            raise HTTPException(400, "Cannot dispute load without an assigned carrier")
        against_id = ship.carrier_id
    else:
        against_id = load.shipper_id

    dispute = dispute_repository.model(
        load_id=load.id,
        raised_by_company_id=current_company_id,
        against_company_id=against_id,
        reason=dispute_in.reason
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)
    return dispute

def resolve_dispute(db: Session, dispute_id: str, resolve_in: DisputeResolve, admin_id: str):
    dispute = dispute_repository.get(db=db, id=dispute_id)
    if not dispute:
        raise HTTPException(404, "Dispute not found")
        
    dispute.status = resolve_in.status
    dispute.resolution_notes = resolve_in.resolution_notes
    
    log_action(db, admin_id, "RESOLVE_DISPUTE", dispute_id, {"status": resolve_in.status.value if hasattr(resolve_in.status, "value") else str(resolve_in.status)})
    db.commit()
    db.refresh(dispute)
    return dispute

