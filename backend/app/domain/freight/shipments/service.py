from app.domain.fleet.drivers.schemas import DriverAssignmentCreate
import json
import os
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List
from app.domain.freight.shipments.models import Shipment
from app.domain.freight.shipments.schemas import DriverAssign, LocationUpdate
from app.domain.freight.loads.models import Load, LoadStatus
from app.domain.notifications.service import create_notification
from app.domain.notifications.models import NotificationType
import shutil
import uuid
import datetime as dt
from app.domain.freight.shipments.models import ShipmentStatus, DocumentStatus, ShipmentDocument, PartnerAssignment, AssignmentStatus
from app.domain.freight.shipments.schemas import PartnerAssignmentCreate
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from app.domain.freight.shipments.repository import shipment_repository, shipment_document_repository, partner_assignment_repository

UPLOAD_DIR = "uploads"

def ensure_upload_dir():
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

def assign_partner(db: Session, shipment_id: str, broker_id: str, assignment_in: PartnerAssignmentCreate):
    from app.domain.identity.models import Company, VerificationStatus
    
    broker = db.query(Company).filter(Company.id == broker_id).first()
    partner = db.query(Company).filter(Company.id == assignment_in.partner_id).first()
    
    if not partner or partner.status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="Invalid or unverified Partner")
        
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment or (shipment.broker_id != broker_id and shipment.carrier_id != broker_id):
        raise HTTPException(status_code=404, detail="Shipment not found or access denied")
        
    active_assignment = partner_assignment_repository.get_active_assignment(db=db, shipment_id=shipment_id)
    if active_assignment:
        raise HTTPException(status_code=400, detail="There is already a pending assignment for this shipment")
        
    assignment = PartnerAssignment(
        shipment_id=shipment_id,
        broker_id=broker_id,
        partner_id=assignment_in.partner_id,
        status=AssignmentStatus.PENDING,
        notes=assignment_in.notes
    )
    db.add(assignment)
    
    create_notification(
        db, 
        assignment_in.partner_id, 
        "New Shipment Assignment", 
        f"You received a new shipment assignment request from Broker.", 
        NotificationType.INFO,
        "PartnerAssignment",
        assignment.id,
        "/assignments/requests"
    )
    
    db.commit()
    db.refresh(assignment)
    return assignment

def accept_partner_assignment(db: Session, assignment_id: str, partner_id: str):
    from app.domain.identity.models import CompanyType
    assignment = partner_assignment_repository.get_by_id_and_partner(db=db, assignment_id=assignment_id, partner_id=partner_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.status != AssignmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Assignment is not pending")
        
    assignment.status = AssignmentStatus.ACCEPTED
    assignment.responded_at = dt.datetime.now(dt.timezone.utc)
    
    shipment = shipment_repository.get(db=db, id=assignment.shipment_id)
    shipment.carrier_id = assignment.partner_id
    
    # Check if OWNER_OPERATOR for auto self-assign
    if assignment.partner.type == CompanyType.OWNER_OPERATOR:
        # We need to find the user ID for this company to self assign.
        from app.domain.identity.models import User, CompanyVehicle
        owner_user = db.query(User).filter(User.company_id == partner_id).first()
        if owner_user:
            vehicle = db.query(CompanyVehicle).filter(CompanyVehicle.company_id == partner_id).first()
            shipment.driver_id = owner_user.id
            shipment.driver_name = f"{owner_user.first_name} {owner_user.last_name}"
            shipment.driver_phone = "" 
            shipment.truck_number = vehicle.truck_number if vehicle else ""
            shipment.status = ShipmentStatus.DRIVER_ACCEPTED
            generate_bol(db, shipment.id)
            
            load = db.query(Load).filter(Load.id == shipment.load_id).first()
            if load.status == LoadStatus.TENDER_ACCEPTED or load.status == LoadStatus.DRIVER_ASSIGNED:
                load.status = LoadStatus.DRIVER_ASSIGNED
                
    create_notification(
        db, 
        assignment.broker_id, 
        "Assignment Accepted", 
        f"Partner {assignment.partner.name} accepted the assignment for shipment.", 
        NotificationType.SUCCESS,
        "PartnerAssignment",
        assignment.id,
        "/assignments/requests"
    )
    
    db.commit()
    db.refresh(assignment)
    return assignment

def reject_partner_assignment(db: Session, assignment_id: str, partner_id: str):
    assignment = partner_assignment_repository.get_by_id_and_partner(db=db, assignment_id=assignment_id, partner_id=partner_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.status != AssignmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Assignment is not pending")
        
    assignment.status = AssignmentStatus.REJECTED
    assignment.responded_at = dt.datetime.now(dt.timezone.utc)
    
    create_notification(
        db, 
        assignment.broker_id, 
        "Assignment Rejected", 
        f"Partner {assignment.partner.name} rejected the assignment for shipment.", 
        NotificationType.WARNING,
        "PartnerAssignment",
        assignment.id,
        "/assignments/requests"
    )
    
    db.commit()
    db.refresh(assignment)
    return assignment

def get_my_partner_assignments(db: Session, company_id: str, company_type: str):
    return partner_assignment_repository.get_my_assignments(db=db, company_id=company_id, company_type=company_type)

def cancel_partner_assignment(db: Session, assignment_id: str, broker_id: str):
    assignment = partner_assignment_repository.get_by_id_and_broker(db=db, assignment_id=assignment_id, broker_id=broker_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.status != AssignmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only cancel pending assignments")
        
    assignment.status = AssignmentStatus.CANCELLED
    assignment.responded_at = dt.datetime.now(dt.timezone.utc)
    
    db.commit()
    db.refresh(assignment)
    return assignment

def assign_driver(db: Session, shipment_id: str, carrier_id: str, driver_info: DriverAssign):
    shipment = shipment_repository.get_by_id_and_carrier(db=db, shipment_id=shipment_id, carrier_id=carrier_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    # Update fields
    shipment.driver_name = driver_info.driver_name
    shipment.driver_phone = driver_info.driver_phone
    shipment.truck_number = driver_info.truck_number
    
    # Update Load status
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    if load.status == LoadStatus.TENDER_ACCEPTED:
        load.status = LoadStatus.DRIVER_ASSIGNED
        
    db.commit()
    db.refresh(shipment)
    return shipment

def self_assign(db: Session, shipment_id: str, company_id: str, user_id: str):
    from app.domain.identity.models import User, CompanyVehicle
    shipment = shipment_repository.get_by_id_and_carrier(db=db, shipment_id=shipment_id, carrier_id=company_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    user = db.query(User).filter(User.id == user_id).first()
    vehicle = db.query(CompanyVehicle).filter(CompanyVehicle.company_id == company_id).first()
    
    shipment.driver_id = user_id
    shipment.driver_name = f"{user.first_name} {user.last_name}"
    # Owner Operator might not have a driver profile phone, so we might skip or put blank
    shipment.driver_phone = "" 
    shipment.truck_number = vehicle.truck_number if vehicle else ""
    shipment.status = ShipmentStatus.DRIVER_ACCEPTED
    
    # Update Load status
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    if load.status == LoadStatus.TENDER_ACCEPTED or load.status == LoadStatus.DRIVER_ASSIGNED:
        load.status = LoadStatus.DRIVER_ASSIGNED
        
    # Generate BOL
    generate_bol(db, shipment.id)
    
    db.commit()
    db.refresh(shipment)
    return shipment

def assign_fleet_driver(db: Session, shipment_id: str, company_id: str, assigner_id: str, assignment_info: DriverAssignmentCreate):
    from app.domain.fleet.drivers.models import DriverAssignment, DriverAssignmentStatus, DriverProfile, DriverStatus
    
    shipment = shipment_repository.get_by_id_and_carrier(db=db, shipment_id=shipment_id, carrier_id=company_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == assignment_info.driver_id).first()
    if not driver_profile:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    if driver_profile.status != DriverStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Driver is not available")
        
    # Check if there is already an active assignment
    active_assignment = db.query(DriverAssignment).filter(
        DriverAssignment.shipment_id == shipment_id,
        DriverAssignment.status == DriverAssignmentStatus.PENDING
    ).first()
    if active_assignment:
        raise HTTPException(status_code=400, detail="There is already a pending driver assignment")
        
    assignment = DriverAssignment(
        shipment_id=shipment_id,
        driver_id=assignment_info.driver_id,
        assigned_by=assigner_id,
        status=DriverAssignmentStatus.PENDING,
        notes=assignment_info.notes
    )
    db.add(assignment)
    
    # Notify Driver
    create_notification(
        db, 
        company_id, 
        "New Driver Assignment", 
        "You have been assigned to a new shipment.", 
        NotificationType.INFO,
        "Shipment",
        shipment.id,
        f"/shipments/execute/{shipment.id}",
        target_role="DRIVER"
    )
    
    db.commit()
    db.refresh(assignment)
    return assignment

def assign_dispatcher(db: Session, shipment_id: str, company_id: str, dispatcher_id: str, assigner_id: str):
    from app.domain.identity.models import User
    
    shipment = shipment_repository.get_by_id_and_carrier(db=db, shipment_id=shipment_id, carrier_id=company_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    dispatcher = db.query(User).filter(User.id == dispatcher_id, User.company_id == company_id).first()
    if not dispatcher:
        raise HTTPException(status_code=404, detail="Dispatcher not found in your company")
        
    if dispatcher.role.name not in ["DISPATCHER", "COMPANY_ADMIN"]:
        raise HTTPException(status_code=400, detail="User must be a Dispatcher or Company Admin")
        
    shipment.dispatcher_id = dispatcher_id
    db.commit()
    db.refresh(shipment)
    return shipment

def accept_driver_assignment(db: Session, assignment_id: str, driver_id: str):
    from app.domain.fleet.drivers.models import DriverAssignment, DriverAssignmentStatus, DriverProfile, DriverStatus
    import datetime as dt
    
    assignment = db.query(DriverAssignment).filter(DriverAssignment.id == assignment_id, DriverAssignment.driver_id == driver_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.status != DriverAssignmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Assignment is not pending")
        
    assignment.status = DriverAssignmentStatus.ACCEPTED
    assignment.responded_at = dt.datetime.now(dt.timezone.utc)
    
    driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == driver_id).first()
    driver_profile.status = DriverStatus.ASSIGNED
    
    # Also update Shipment flat fields for backward compatibility
    shipment = shipment_repository.get(db=db, id=assignment.shipment_id)
    user = assignment.driver
    shipment.driver_name = f"{user.first_name} {user.last_name}"
    shipment.driver_phone = driver_profile.phone
    shipment.status = ShipmentStatus.DRIVER_ACCEPTED
    
    # Update Load status
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    if load.status == LoadStatus.TENDER_ACCEPTED or load.status == LoadStatus.DRIVER_ASSIGNED:
        load.status = LoadStatus.DRIVER_ASSIGNED
        
    # Generate BOL
    generate_bol(db, shipment.id)
        
    # Notify Assigner's Company (the Carrier)
    create_notification(
        db, 
        shipment.carrier_id, 
        "Driver Accepted Assignment", 
        f"Driver {user.first_name} {user.last_name} accepted the assignment.", 
        NotificationType.SUCCESS,
        "Shipment",
        shipment.id,
        f"/shipments/execute/{shipment.id}"
    )
    
    db.commit()
    db.refresh(assignment)
    return assignment

def reject_driver_assignment(db: Session, assignment_id: str, driver_id: str, reason: str = None):
    from app.domain.fleet.drivers.models import DriverAssignment, DriverAssignmentStatus
    import datetime as dt
    
    assignment = db.query(DriverAssignment).filter(DriverAssignment.id == assignment_id, DriverAssignment.driver_id == driver_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.status != DriverAssignmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Assignment is not pending")
        
    assignment.status = DriverAssignmentStatus.REJECTED
    assignment.responded_at = dt.datetime.now(dt.timezone.utc)
    if reason:
        assignment.rejection_reason = reason
    
    # Notify Assigner's Company
    user = assignment.driver
    reason_text = f" Reason: {reason}" if reason else ""
    
    # We need the shipment to get carrier_id
    shipment = shipment_repository.get(db=db, id=assignment.shipment_id)
    
    create_notification(
        db, 
        shipment.carrier_id if shipment else assignment.driver.company_id, 
        "Driver Rejected Assignment", 
        f"Driver {user.first_name} {user.last_name} rejected the assignment.{reason_text}", 
        NotificationType.WARNING,
        "Shipment",
        assignment.shipment_id,
        f"/shipments/execute/{assignment.shipment_id}"
    )
    
    db.commit()
    db.refresh(assignment)
    return assignment

def get_my_driver_assignments(db: Session, driver_id: str):
    from app.domain.fleet.drivers.models import DriverAssignment, DriverAssignmentStatus
    return db.query(DriverAssignment).filter(
        DriverAssignment.driver_id == driver_id,
        DriverAssignment.status == DriverAssignmentStatus.PENDING
    ).all()


from app.core.workflow import WorkflowStateEngine

def update_shipment_status(db: Session, shipment_id: str, company_id: str, status: ShipmentStatus, user_id: str):
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    # verify access (either driver or carrier or shipper)
    if shipment.carrier_id != company_id and getattr(shipment, 'driver_id', None) != user_id:
        # We need a proper access check, but for now allow assigned driver or carrier
        pass

    WorkflowStateEngine.enforce_shipment_transition(shipment.status, status)

    shipment.status = status
    
    # Cascade to Load Status
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    
    if status == ShipmentStatus.PICKUP_COMPLETED:
        load.status = LoadStatus.PICKUP_COMPLETED
    elif status == ShipmentStatus.IN_TRANSIT:
        load.status = LoadStatus.IN_TRANSIT
    elif status in [ShipmentStatus.DELIVERED, ShipmentStatus.COMPLETED]:
        load.status = LoadStatus.DELIVERED if status == ShipmentStatus.DELIVERED else LoadStatus.COMPLETED
        # Free up the driver
        from app.domain.fleet.drivers.models import DriverAssignment, DriverAssignmentStatus, DriverProfile, DriverStatus
        assignment = db.query(DriverAssignment).filter(
            DriverAssignment.shipment_id == shipment.id,
            DriverAssignment.status == DriverAssignmentStatus.ACCEPTED
        ).first()
        if assignment:
            driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == assignment.driver_id).first()
            if driver_profile:
                driver_profile.status = DriverStatus.AVAILABLE
    elif status == ShipmentStatus.DISPUTED:
        load.status = LoadStatus.DISPUTED
        
    # Notify Stakeholders
    create_notification(db, load.shipper_id, "Shipment Status Updated", f"Shipment for Load is now {status}.", NotificationType.INFO, "Shipment", shipment.id, f"/shipments/execute/{shipment.id}")
    create_notification(db, shipment.carrier_id, "Shipment Status Updated", f"Shipment for Load is now {status}.", NotificationType.INFO, "Shipment", shipment.id, f"/shipments/execute/{shipment.id}")
    
    db.commit()
    db.refresh(shipment)
    return shipment

def update_status(db: Session, shipment_id: str, carrier_id: str, status: LoadStatus):
    # Deprecated / legacy wrapper
    shipment = shipment_repository.get_by_id_and_carrier(db=db, shipment_id=shipment_id, carrier_id=carrier_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    load.status = status
    db.commit()
    db.refresh(shipment)
    return shipment

def update_location(db: Session, shipment_id: str, carrier_id: str, location_info: LocationUpdate):
    shipment = shipment_repository.get(db=db, id=shipment_id) # relaxed check for driver
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    shipment.current_location = location_info.current_location
    db.commit()
    db.refresh(shipment)
    return shipment

def update_eta(db: Session, shipment_id: str, eta: dt.datetime, delay_reason: str = None):
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    shipment.eta = eta
    if delay_reason is not None:
        shipment.delay_reason = delay_reason
    db.commit()
    db.refresh(shipment)
    return shipment

def upload_document(db: Session, shipment_id: str, user_id: str, doc_type: str, file: UploadFile):
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    if doc_type not in ['BOL', 'POD']:
        raise HTTPException(status_code=400, detail="Invalid document type. Must be 'BOL' or 'POD'")
        
    ensure_upload_dir()
    
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    filename = f"{shipment_id}_{doc_type.lower()}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not save file")
        
    url_path = f"/api/v1/uploads/{filename}"
    
    doc = ShipmentDocument(
        shipment_id=shipment.id,
        document_type=doc_type,
        file_path=url_path,
        uploaded_by=user_id,
        status=DocumentStatus.PENDING_REVIEW if doc_type == 'POD' else DocumentStatus.VERIFIED
    )
    db.add(doc)
    
    if doc_type == 'BOL':
        shipment.bol_url = url_path
    else:
        shipment.pod_url = url_path
        shipment.status = ShipmentStatus.POD_UPLOADED
        
    db.commit()
    db.refresh(shipment)
    return shipment

def upload_pod_complete(
    db: Session, 
    shipment_id: str, 
    user_id: str, 
    receiver_name: str, 
    delivery_notes: str, 
    signature_file: UploadFile, 
    photo_files: List[UploadFile],
    osd_reported: bool = False,
    osd_notes: str = None
):
    import shutil
    import uuid
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    ensure_upload_dir()
    
    if osd_reported and not photo_files:
        raise HTTPException(status_code=400, detail="Photos are required when OS&D is reported.")
    
    # Save signature
    sig_ext = signature_file.filename.split('.')[-1] if '.' in signature_file.filename else 'png'
    sig_filename = f"{shipment_id}_sig_{uuid.uuid4().hex[:8]}.{sig_ext}"
    sig_path = os.path.join(UPLOAD_DIR, sig_filename)
    with open(sig_path, "wb") as buffer:
        shutil.copyfileobj(signature_file.file, buffer)
    
    sig_url = f"/api/v1/uploads/{sig_filename}"
    
    # Save photos
    photo_urls = []
    if photo_files:
        for photo in photo_files:
            photo_ext = photo.filename.split('.')[-1] if '.' in photo.filename else 'jpg'
            photo_filename = f"{shipment_id}_photo_{uuid.uuid4().hex[:8]}.{photo_ext}"
            photo_path = os.path.join(UPLOAD_DIR, photo_filename)
            with open(photo_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            photo_urls.append(f"/api/v1/uploads/{photo_filename}")
        
    shipment.receiver_name = receiver_name
    shipment.delivery_notes = delivery_notes
    shipment.receiver_signature_url = sig_url
    shipment.delivery_photos_urls = json.dumps(photo_urls)
    shipment.osd_reported = osd_reported
    shipment.osd_notes = osd_notes
    
    # Update Status & Set pod_url so it is immediately available for Shipper
    shipment.status = ShipmentStatus.POD_UPLOADED
    shipment.pod_url = sig_url

    # Create or update ShipmentDocument entry for POD
    existing_doc = db.query(ShipmentDocument).filter(
        ShipmentDocument.shipment_id == shipment.id,
        ShipmentDocument.document_type == 'POD'
    ).first()

    if not existing_doc:
        doc = ShipmentDocument(
            shipment_id=shipment.id,
            document_type='POD',
            file_path=sig_url,
            uploaded_by=user_id,
            status=DocumentStatus.PENDING_REVIEW
        )
        db.add(doc)
    else:
        existing_doc.file_path = sig_url
        existing_doc.status = DocumentStatus.PENDING_REVIEW

    db.commit()
    
    # Safely attempt PDF generation (non-blocking if PDF library fails)
    try:
        from app.tasks.document_tasks import generate_pod_pdf_task
        generate_pod_pdf_task(
            shipment_id=shipment.id, 
            user_id=user_id, 
            receiver_name=receiver_name, 
            delivery_notes=delivery_notes, 
            sig_path=sig_path,
            sig_url=sig_url,
            osd_reported=osd_reported,
            osd_notes=osd_notes
        )
    except Exception as pdf_err:
        print("POD PDF generation warning:", pdf_err)
    
    db.refresh(shipment)
    return shipment


def generate_bol(db: Session, shipment_id: str):
    from app.tasks.document_tasks import generate_bol_task
    generate_bol_task(shipment_id)

def approve_pod(db: Session, shipment_id: str, shipper_id: str):
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    if load.shipper_id != shipper_id:
        raise HTTPException(status_code=403, detail="Only the shipper can approve POD")
        
    doc = shipment_document_repository.get_latest_pod(db=db, shipment_id=shipment_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="POD document not found")
        
    doc.status = DocumentStatus.VERIFIED
    
    # Complete Shipment
    update_shipment_status(db, shipment.id, shipper_id, ShipmentStatus.COMPLETED, shipper_id)
    
    db.commit()
    return shipment

def reject_pod(db: Session, shipment_id: str, shipper_id: str):
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    if load.shipper_id != shipper_id:
        raise HTTPException(status_code=403, detail="Only the shipper can reject POD")
        
    doc = shipment_document_repository.get_latest_pod(db=db, shipment_id=shipment_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="POD document not found")
        
    doc.status = DocumentStatus.REJECTED
    
    # Dispute Shipment
    update_shipment_status(db, shipment.id, shipper_id, ShipmentStatus.DISPUTED, shipper_id)
    
    db.commit()
    return shipment

def get_my_shipments(db: Session, company_id: str, company_type: str, user_id: str = None, role_name: str = None):
    from sqlalchemy import or_
    
    if role_name == "DRIVER" and user_id:
        from app.domain.fleet.drivers.models import DriverAssignment, DriverAssignmentStatus
        assignments = db.query(DriverAssignment).filter(
            DriverAssignment.driver_id == user_id,
            DriverAssignment.status == DriverAssignmentStatus.ACCEPTED
        ).all()
        shipment_ids = [a.shipment_id for a in assignments]
        shipments = db.query(Shipment).filter(Shipment.id.in_(shipment_ids)).all()
    else:
        shipments = shipment_repository.get_my_shipments(db=db, company_id=company_id, company_type=company_type)

    for s in shipments:
        active_assignment = partner_assignment_repository.get_active_assignment(db=db, shipment_id=s.id)
        if active_assignment:
            s.active_partner_assignment = active_assignment

    return shipments

def get_shipment_for_load(db: Session, load_id: str, company_id: str, company_type: str):
    shipment = shipment_repository.get_by_load(db=db, load_id=load_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found for this load")
        
    # Verify access
    if company_type == "BROKER":
        load = db.query(Load).filter(Load.id == load_id).first()
        if not load or (load.shipper_id != company_id and shipment.carrier_id != company_id and shipment.broker_id != company_id):
            raise HTTPException(status_code=403, detail="Access denied")
    elif company_type == "SHIPPER":
        load = db.query(Load).filter(Load.id == load_id, Load.shipper_id == company_id).first()
        if not load:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if shipment.carrier_id != company_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
    return shipment

def add_tracking_point(db: Session, shipment_id: str, tracking_in, user_id: str):
    from app.domain.freight.shipments.models import ShipmentTracking
    from app.core.websockets import manager
    import asyncio
    
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    # Only the assigned driver should post tracking updates
    if shipment.driver_id != user_id:
        raise HTTPException(status_code=403, detail="Only the assigned driver can post tracking data")
        
    # Create the tracking point
    tracking_point = ShipmentTracking(
        shipment_id=shipment_id,
        latitude=tracking_in.latitude,
        longitude=tracking_in.longitude,
        speed=tracking_in.speed,
        heading=tracking_in.heading,
        accuracy=tracking_in.accuracy,
        altitude=tracking_in.altitude
    )
    db.add(tracking_point)
    
    # Update current location on shipment for easy reference
    location_str = json.dumps({
        "lat": tracking_in.latitude, 
        "lng": tracking_in.longitude,
        "speed": tracking_in.speed,
        "heading": tracking_in.heading,
        "accuracy": tracking_in.accuracy,
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()
    })
    shipment.current_location = location_str
    
    db.commit()
    db.refresh(tracking_point)
    
    # Broadcast to websocket asynchronously without blocking response
    payload = {
        "event": "TRACKING_UPDATE",
        "data": {
            "id": tracking_point.id,
            "shipment_id": shipment_id,
            "latitude": tracking_point.latitude,
            "longitude": tracking_point.longitude,
            "speed": tracking_point.speed,
            "heading": tracking_point.heading,
            "accuracy": tracking_point.accuracy,
            "altitude": tracking_point.altitude,
            "timestamp": tracking_point.timestamp.isoformat()
        }
    }
    
    # Broadcast in async context if available
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_to_channel(f"shipment:{shipment_id}", payload))
    except RuntimeError:
        # For sync environments or tests without running loop
        asyncio.run(manager.broadcast_to_channel(f"shipment:{shipment_id}", payload))
        
    return tracking_point

def get_tracking_history(db: Session, shipment_id: str, company_id: str, company_type: str):
    from app.domain.freight.shipments.models import ShipmentTracking
    
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    # Basic auth check: Shipper, Carrier, Broker involved
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    if company_type == "SHIPPER" and load.shipper_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if company_type == "CARRIER" and shipment.carrier_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if company_type == "BROKER" and shipment.broker_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return db.query(ShipmentTracking).filter(
        ShipmentTracking.shipment_id == shipment_id
    ).order_by(ShipmentTracking.timestamp.asc()).all()

def report_shipment_issue(db: Session, shipment_id: str, issue_data, user_id: str):
    from app.domain.freight.shipments.models import ShipmentIssue
    
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    issue = ShipmentIssue(
        shipment_id=shipment_id,
        reported_by=user_id,
        issue_type=issue_data.issue_type,
        description=issue_data.description
    )
    db.add(issue)
    
    # Notify stakeholders
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    msg = f"Issue reported during transit: {issue_data.issue_type.value}. {issue_data.description or ''}"
    
    if load.shipper_id:
        create_notification(db, load.shipper_id, "Transit Issue Reported", msg, NotificationType.WARNING, "Shipment", shipment.id, f"/shipments/execute/{shipment.id}")
    if shipment.broker_id:
        create_notification(db, shipment.broker_id, "Transit Issue Reported", msg, NotificationType.WARNING, "Shipment", shipment.id, f"/shipments/execute/{shipment.id}")
    if shipment.carrier_id:
        create_notification(db, shipment.carrier_id, "Transit Issue Reported", msg, NotificationType.WARNING, "Shipment", shipment.id, f"/shipments/execute/{shipment.id}")
        
    db.commit()
    db.refresh(issue)
    return issue

def get_shipment_issues(db: Session, shipment_id: str, company_id: str, company_type: str):
    from app.domain.freight.shipments.models import ShipmentIssue
    shipment = shipment_repository.get(db=db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    # Basic auth check
    load = db.query(Load).filter(Load.id == shipment.load_id).first()
    if company_type == "SHIPPER" and load.shipper_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if company_type == "CARRIER" and shipment.carrier_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if company_type == "BROKER" and shipment.broker_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return db.query(ShipmentIssue).filter(ShipmentIssue.shipment_id == shipment_id).order_by(ShipmentIssue.created_at.desc()).all()
