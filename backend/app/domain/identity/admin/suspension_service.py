from sqlalchemy.orm import Session
from app.domain.identity.models import User, Company
from app.domain.freight.loads.models import Load, LoadStatus
from app.domain.freight.shipments.models import Shipment, ShipmentStatus, PartnerAssignment, AssignmentStatus
from app.domain.fleet.drivers.models import DriverAssignment, DriverAssignmentStatus
from app.domain.notifications.models import NotificationType
from app.domain.notifications.service import create_notification

IN_TRANSIT_SHIPMENT_STATUSES = [
    ShipmentStatus.PICKUP_COMPLETED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.POD_UPLOADED
]

def apply_cascading_suspension(db: Session, user: User) -> dict:
    """
    Applies cascading suspension logic across the hierarchy when a user is suspended by an Admin.
    
    Rule:
    - Pre-pickup loads/shipments are immediately cancelled, suspended, or returned to Marketplace.
    - Picked up / In-Transit loads are protected and allowed to complete delivery, POD approval, and invoicing.
      Super Admin receives notification detailing deferred suspension for in-transit shipments.
    """
    company = user.company
    role_name = user.role.name if user.role else None
    company_type = company.type if company else None

    effects = []
    deferred_notices = []

    admin_company_id = "comp_ff_admin"  # Default Super Admin company ID context

    # 1. SHIPPER SUSPENSION
    if company_type == "SHIPPER":
        shipper_loads = db.query(Load).filter(
            Load.shipper_id == company.id,
            Load.status.notin_([LoadStatus.COMPLETED, LoadStatus.CANCELLED, LoadStatus.SUSPENDED])
        ).all()

        suspended_count = 0
        for load in shipper_loads:
            shipment = db.query(Shipment).filter(Shipment.load_id == load.id).first()
            if shipment and shipment.status in IN_TRANSIT_SHIPMENT_STATUSES:
                notice_msg = f"Notice: Shipment #{shipment.id[:8]} for Shipper '{company.name}' is already picked up ({shipment.status.value}). Full suspension will take effect after POD approval & invoicing completion."
                deferred_notices.append(notice_msg)
                create_notification(
                    db=db,
                    company_id=admin_company_id,
                    title="In-Transit Suspension Notice",
                    message=notice_msg,
                    type=NotificationType.WARNING,
                    entity_type="Shipment",
                    entity_id=shipment.id
                )
            else:
                load.status = LoadStatus.SUSPENDED
                if shipment and shipment.status not in [ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.SUSPENDED]:
                    shipment.status = ShipmentStatus.SUSPENDED
                suspended_count += 1
        
        effects.append(f"Suspended {suspended_count} pre-pickup loads created by Shipper '{company.name}'")

    # 2. BROKER SUSPENSION
    elif company_type == "BROKER":
        broker_shipments = db.query(Shipment).filter(
            Shipment.broker_id == company.id,
            Shipment.status.notin_([ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.SUSPENDED])
        ).all()

        released_count = 0
        for shipment in broker_shipments:
            if shipment.status in IN_TRANSIT_SHIPMENT_STATUSES:
                notice_msg = f"Notice: Shipment #{shipment.id[:8]} brokered by '{company.name}' is already picked up ({shipment.status.value}). Full suspension will take effect after POD approval & invoicing completion."
                deferred_notices.append(notice_msg)
                create_notification(
                    db=db,
                    company_id=admin_company_id,
                    title="In-Transit Suspension Notice",
                    message=notice_msg,
                    type=NotificationType.WARNING,
                    entity_type="Shipment",
                    entity_id=shipment.id
                )
            else:
                p_assignments = db.query(PartnerAssignment).filter(
                    PartnerAssignment.shipment_id == shipment.id,
                    PartnerAssignment.status.in_([AssignmentStatus.PENDING, AssignmentStatus.ACCEPTED])
                ).all()
                for pa in p_assignments:
                    pa.status = AssignmentStatus.CANCELLED

                load = db.query(Load).filter(Load.id == shipment.load_id).first()
                if load and load.status not in [LoadStatus.COMPLETED, LoadStatus.CANCELLED, LoadStatus.SUSPENDED]:
                    load.status = LoadStatus.OPEN_FOR_BIDDING

                shipment.status = ShipmentStatus.CANCELLED
                released_count += 1

        effects.append(f"Released {released_count} pre-pickup brokered loads back to Marketplace")

    # 3. CARRIER / OWNER_OPERATOR SUSPENSION
    elif company_type in ["CARRIER", "OWNER_OPERATOR"] and role_name != "DISPATCHER" and role_name != "DRIVER":
        carrier_shipments = db.query(Shipment).filter(
            Shipment.carrier_id == company.id,
            Shipment.status.notin_([ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.SUSPENDED])
        ).all()

        released_count = 0
        for shipment in carrier_shipments:
            if shipment.status in IN_TRANSIT_SHIPMENT_STATUSES:
                notice_msg = f"Notice: Shipment #{shipment.id[:8]} for Carrier '{company.name}' is already picked up ({shipment.status.value}). Full suspension will take effect after POD approval & invoicing completion."
                deferred_notices.append(notice_msg)
                create_notification(
                    db=db,
                    company_id=admin_company_id,
                    title="In-Transit Suspension Notice",
                    message=notice_msg,
                    type=NotificationType.WARNING,
                    entity_type="Shipment",
                    entity_id=shipment.id
                )
            else:
                p_assignments = db.query(PartnerAssignment).filter(
                    PartnerAssignment.shipment_id == shipment.id,
                    PartnerAssignment.status.in_([AssignmentStatus.PENDING, AssignmentStatus.ACCEPTED])
                ).all()
                for pa in p_assignments:
                    pa.status = AssignmentStatus.CANCELLED

                load = db.query(Load).filter(Load.id == shipment.load_id).first()
                if load and load.status not in [LoadStatus.COMPLETED, LoadStatus.CANCELLED, LoadStatus.SUSPENDED]:
                    load.status = LoadStatus.OPEN_FOR_BIDDING

                shipment.status = ShipmentStatus.CANCELLED
                shipment.driver_id = None
                shipment.driver_name = None
                shipment.driver_phone = None
                shipment.truck_number = None
                released_count += 1

        effects.append(f"Released {released_count} pre-pickup carrier shipments back to Marketplace")

    # 4. DISPATCHER SUSPENSION
    if role_name == "DISPATCHER":
        dispatcher_shipments = db.query(Shipment).filter(
            Shipment.dispatcher_id == user.id,
            Shipment.status.notin_([ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.SUSPENDED])
        ).all()

        reverted_count = 0
        for shipment in dispatcher_shipments:
            if shipment.status in IN_TRANSIT_SHIPMENT_STATUSES:
                notice_msg = f"Notice: Shipment #{shipment.id[:8]} managed by Dispatcher '{user.first_name}' is in-transit ({shipment.status.value}). Dispatcher unassignment deferred until POD completion."
                deferred_notices.append(notice_msg)
            else:
                shipment.dispatcher_id = None
                reverted_count += 1

        effects.append(f"Reverted {reverted_count} pre-pickup shipments back to Carrier's shared pool")

    # 5. DRIVER SUSPENSION
    if role_name == "DRIVER":
        driver_shipments = db.query(Shipment).filter(
            Shipment.driver_id == user.id,
            Shipment.status.notin_([ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.SUSPENDED])
        ).all()

        cleared_count = 0
        for shipment in driver_shipments:
            if shipment.status in IN_TRANSIT_SHIPMENT_STATUSES:
                notice_msg = f"Notice: Driver '{user.first_name} {user.last_name}' is currently in-transit with Shipment #{shipment.id[:8]} ({shipment.status.value}). Driver unassignment deferred until delivery completion & POD approval."
                deferred_notices.append(notice_msg)
                create_notification(
                    db=db,
                    company_id=admin_company_id,
                    title="In-Transit Driver Suspension Notice",
                    message=notice_msg,
                    type=NotificationType.WARNING,
                    entity_type="Shipment",
                    entity_id=shipment.id
                )
            else:
                shipment.driver_id = None
                shipment.driver_name = None
                shipment.driver_phone = None
                shipment.truck_number = None
                if shipment.status in [ShipmentStatus.DRIVER_ASSIGNED, ShipmentStatus.DRIVER_ACCEPTED]:
                    shipment.status = ShipmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT
                cleared_count += 1

        d_assignments = db.query(DriverAssignment).filter(
            DriverAssignment.driver_id == user.id,
            DriverAssignment.status.in_([DriverAssignmentStatus.PENDING, DriverAssignmentStatus.ACCEPTED])
        ).all()
        for da in d_assignments:
            da.status = DriverAssignmentStatus.REJECTED

        effects.append(f"Cleared Driver from {cleared_count} pre-pickup shipments")

    db.commit()
    return {"user_id": user.id, "effects": effects, "deferred_notices": deferred_notices}

def apply_cascading_activation(db: Session, user: User) -> dict:
    """
    Applies cascading activation logic across the hierarchy when a user/company is reactivated by an Admin.
    """
    company = user.company
    role_name = user.role.name if user.role else None
    company_type = company.type if company else None

    effects = []

    # 1. SHIPPER ACTIVATION
    if company_type == "SHIPPER" and company:
        shipper_loads = db.query(Load).filter(
            Load.shipper_id == company.id,
            Load.status == LoadStatus.SUSPENDED
        ).all()

        reactivated_count = 0
        for load in shipper_loads:
            load.status = LoadStatus.OPEN_FOR_BIDDING
            shipment = db.query(Shipment).filter(Shipment.load_id == load.id).first()
            if shipment and shipment.status == ShipmentStatus.SUSPENDED:
                shipment.status = ShipmentStatus.WAITING_FOR_PARTNER_ASSIGNMENT
            reactivated_count += 1

        effects.append(f"Reactivated {reactivated_count} suspended loads for Shipper '{company.name}' back to Marketplace")

    db.commit()
    return {"user_id": user.id, "effects": effects}
