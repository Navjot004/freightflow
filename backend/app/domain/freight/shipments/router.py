from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.domain.freight.shipments import schemas, service
from app.core.deps import get_current_active_user, RequireRole
from app.domain.identity.models import User
from app.domain.freight.loads.models import LoadStatus

router = APIRouter()

@router.get("/shipments/me", response_model=List[schemas.ShipmentResponse])
def get_my_shipments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get active shipments for Carrier, Shipper, or Driver."""
    return service.get_my_shipments(db, current_user.company_id, current_user.company.type, current_user.id, current_user.role.name)

@router.get("/loads/{load_id}/shipment", response_model=schemas.ShipmentResponse)
def get_shipment_for_load(
    load_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the shipment execution record for a load."""
    return service.get_shipment_for_load(db, load_id, current_user.company_id, current_user.company.type)

@router.post("/shipments/{shipment_id}/assign-partner", response_model=schemas.PartnerAssignmentResponse)
def assign_partner(
    shipment_id: str,
    assignment_in: schemas.PartnerAssignmentCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"])),
    db: Session = Depends(get_db)
):
    """Assign a transportation partner (Carrier or Owner Operator) to a shipment."""
    if current_user.company.type != "BROKER":
        raise HTTPException(status_code=403, detail="Only Brokers can assign transportation partners.")
    return service.assign_partner(db, shipment_id, current_user.company_id, assignment_in)

@router.post("/partner-assignments/{assignment_id}/accept", response_model=schemas.PartnerAssignmentResponse)
def accept_partner_assignment(
    assignment_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR"])),
    db: Session = Depends(get_db)
):
    """Partner accepts a shipment assignment."""
    return service.accept_partner_assignment(db, assignment_id, current_user.company_id)

@router.post("/partner-assignments/{assignment_id}/reject", response_model=schemas.PartnerAssignmentResponse)
def reject_partner_assignment(
    assignment_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR"])),
    db: Session = Depends(get_db)
):
    """Partner rejects a shipment assignment."""
    return service.reject_partner_assignment(db, assignment_id, current_user.company_id)

@router.get("/partner-assignments/me", response_model=List[schemas.PartnerAssignmentResponse])
def get_my_partner_assignments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get pending partner assignments for Broker or Partner."""
    return service.get_my_partner_assignments(db, current_user.company_id, current_user.company.type)

@router.post("/partner-assignments/{assignment_id}/cancel", response_model=schemas.PartnerAssignmentResponse)
def cancel_partner_assignment(
    assignment_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"])),
    db: Session = Depends(get_db)
):
    """Broker cancels a pending partner assignment."""
    if current_user.company.type != "BROKER":
        raise HTTPException(status_code=403, detail="Only Brokers can cancel partner assignments.")
    return service.cancel_partner_assignment(db, assignment_id, current_user.company_id)

@router.post("/shipments/{shipment_id}/assign-driver", response_model=schemas.ShipmentResponse)
def assign_driver(
    shipment_id: str,
    driver_info: schemas.DriverAssign,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"])),
    db: Session = Depends(get_db)
):
    """Assign a flat driver to a shipment (Carrier only) - Backward compatibility."""
    if current_user.company.type == "BROKER":
        raise HTTPException(status_code=403, detail="Brokers cannot assign drivers.")
    return service.assign_driver(db, shipment_id, current_user.company_id, driver_info)
@router.post("/shipments/{shipment_id}/self-assign", response_model=schemas.ShipmentResponse)
def self_assign(
    shipment_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR"])),
    db: Session = Depends(get_db)
):
    """Owner Operator self assigns to a shipment."""
    if current_user.company.type != "OWNER_OPERATOR":
        raise HTTPException(status_code=403, detail="Only Owner Operators can self-assign.")
    return service.self_assign(db, shipment_id, current_user.company_id, current_user.id)

from app.domain.fleet.drivers.schemas import DriverAssignmentCreate, DriverAssignmentResponse, DriverAssignmentRejectRequest

@router.post("/shipments/{shipment_id}/assign-dispatcher", response_model=schemas.ShipmentResponse)
def assign_dispatcher(
    shipment_id: str,
    dispatcher_info: schemas.DispatcherAssign,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"])),
    db: Session = Depends(get_db)
):
    """Assign a dispatcher to a shipment (Carrier only)."""
    if current_user.company.type != "CARRIER":
        raise HTTPException(status_code=403, detail="Only Carriers can assign dispatchers.")
        
    dispatcher_id_to_assign = dispatcher_info.dispatcher_id or current_user.id
    
    return service.assign_dispatcher(db, shipment_id, current_user.company_id, dispatcher_id_to_assign, current_user.id)

@router.post("/shipments/{shipment_id}/assign-fleet-driver", response_model=DriverAssignmentResponse)
def assign_fleet_driver(
    shipment_id: str,
    assignment_info: DriverAssignmentCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"])),
    db: Session = Depends(get_db)
):
    """Assign a formal fleet driver to a shipment."""
    return service.assign_fleet_driver(db, shipment_id, current_user.company_id, current_user.id, assignment_info)

@router.post("/driver-assignments/{assignment_id}/accept", response_model=DriverAssignmentResponse)
def accept_driver_assignment(
    assignment_id: str,
    current_user: User = Depends(RequireRole(["DRIVER"])),
    db: Session = Depends(get_db)
):
    """Driver accepts an assignment."""
    return service.accept_driver_assignment(db, assignment_id, current_user.id)

@router.post("/driver-assignments/{assignment_id}/reject", response_model=DriverAssignmentResponse)
def reject_driver_assignment(
    assignment_id: str,
    reject_data: DriverAssignmentRejectRequest,
    current_user: User = Depends(RequireRole(["DRIVER"])),
    db: Session = Depends(get_db)
):
    """Driver rejects an assignment."""
    return service.reject_driver_assignment(db, assignment_id, current_user.id, reject_data.reason)

@router.get("/driver-assignments/me", response_model=List[DriverAssignmentResponse])
def get_my_driver_assignments(
    current_user: User = Depends(RequireRole(["DRIVER"])),
    db: Session = Depends(get_db)
):
    """Driver gets their pending assignments."""
    return service.get_my_driver_assignments(db, current_user.id)



from app.domain.freight.shipments.models import ShipmentStatus
import datetime as dt

@router.patch("/shipments/{shipment_id}/status", response_model=schemas.ShipmentResponse)
def update_status_new(
    shipment_id: str,
    status: ShipmentStatus = Form(...),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER", "DRIVER"])),
    db: Session = Depends(get_db)
):
    """Update lifecycle status of shipment (Carrier/Driver only)."""
    return service.update_shipment_status(db, shipment_id, current_user.company_id, status, current_user.id)

@router.patch("/shipments/{shipment_id}/location", response_model=schemas.ShipmentResponse)
def update_location(
    shipment_id: str,
    location_info: schemas.LocationUpdate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER", "DRIVER"])),
    db: Session = Depends(get_db)
):
    """Update current location of shipment."""
    return service.update_location(db, shipment_id, current_user.company_id, location_info)

@router.patch("/shipments/{shipment_id}/eta", response_model=schemas.ShipmentResponse)
def update_eta(
    shipment_id: str,
    eta: dt.datetime = Form(...),
    delay_reason: str = Form(None),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER", "DRIVER"])),
    db: Session = Depends(get_db)
):
    """Update ETA of shipment."""
    return service.update_eta(db, shipment_id, eta, delay_reason)

@router.post("/shipments/{shipment_id}/documents", response_model=schemas.ShipmentResponse)
def upload_document(
    shipment_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER", "DRIVER"])),
    db: Session = Depends(get_db)
):
    """Upload BOL or POD document."""
    return service.upload_document(db, shipment_id, current_user.id, doc_type, file)

@router.post("/shipments/{shipment_id}/pod-complete", response_model=schemas.ShipmentResponse)
def upload_pod_complete(
    shipment_id: str,
    receiver_name: str = Form(...),
    delivery_notes: str = Form(None),
    signature_file: UploadFile = File(...),
    photo_files: Optional[List[UploadFile]] = File(None),
    osd_reported: bool = Form(False),
    osd_notes: str = Form(None),
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER", "DRIVER"])),
    db: Session = Depends(get_db)
):
    """Upload Detailed POD data including signature and photos."""
    return service.upload_pod_complete(
        db, shipment_id, current_user.id, 
        receiver_name, delivery_notes, signature_file, photo_files,
        osd_reported, osd_notes
    )

@router.post("/shipments/{shipment_id}/documents/pod/approve", response_model=schemas.ShipmentResponse)
def approve_pod(
    shipment_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Approve POD and Complete Shipment (Shipper only)."""
    if current_user.company.type != "SHIPPER":
        raise HTTPException(status_code=403, detail="Only Shipper can approve POD")
    return service.approve_pod(db, shipment_id, current_user.company_id)

@router.post("/shipments/{shipment_id}/documents/pod/reject", response_model=schemas.ShipmentResponse)
def reject_pod(
    shipment_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Reject POD and Dispute Shipment (Shipper only)."""
    if current_user.company.type != "SHIPPER":
        raise HTTPException(status_code=403, detail="Only Shipper can reject POD")
    return service.reject_pod(db, shipment_id, current_user.company_id)

@router.post("/shipments/{shipment_id}/tracking", response_model=schemas.ShipmentTrackingResponse)
def add_tracking_point(
    shipment_id: str,
    tracking_in: schemas.ShipmentTrackingCreate,
    current_user: User = Depends(RequireRole(["DRIVER", "OWNER_OPERATOR"])),
    db: Session = Depends(get_db)
):
    """Add a live GPS tracking point for the shipment (Driver only)."""
    return service.add_tracking_point(db, shipment_id, tracking_in, current_user.id)

@router.get("/shipments/{shipment_id}/tracking", response_model=List[schemas.ShipmentTrackingResponse])
def get_tracking_history(
    shipment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the entire tracking history for a shipment."""
    return service.get_tracking_history(db, shipment_id, current_user.company_id, current_user.company.type)

@router.post("/shipments/{shipment_id}/issues", response_model=schemas.ShipmentIssueResponse)
def report_shipment_issue(
    shipment_id: str,
    issue_data: schemas.ShipmentIssueCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER", "DRIVER"])),
    db: Session = Depends(get_db)
):
    """Report an issue during transit (e.g. breakdown, weather delay)."""
    return service.report_shipment_issue(db, shipment_id, issue_data, current_user.id)

@router.get("/shipments/{shipment_id}/issues", response_model=List[schemas.ShipmentIssueResponse])
def get_shipment_issues(
    shipment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get reported issues for a shipment."""
    return service.get_shipment_issues(db, shipment_id, current_user.company_id, current_user.company.type)
