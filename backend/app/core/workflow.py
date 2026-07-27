from fastapi import HTTPException
from app.domain.freight.loads.models import LoadStatus
from app.domain.freight.shipments.models import ShipmentStatus

class WorkflowStateEngine:
    LOAD_TRANSITIONS = {
        LoadStatus.DRAFT: [LoadStatus.OPEN_FOR_BIDDING, LoadStatus.TENDER_SENT, LoadStatus.CANCELLED],
        LoadStatus.OPEN_FOR_BIDDING: [LoadStatus.TENDER_SENT, LoadStatus.TENDER_ACCEPTED, LoadStatus.CANCELLED],
        LoadStatus.TENDER_SENT: [LoadStatus.TENDER_ACCEPTED, LoadStatus.CANCELLED, LoadStatus.EXPIRED],
        LoadStatus.TENDER_ACCEPTED: [LoadStatus.DRIVER_ASSIGNED, LoadStatus.CANCELLED],
        LoadStatus.DRIVER_ASSIGNED: [LoadStatus.PICKUP_COMPLETED, LoadStatus.CANCELLED],
        LoadStatus.PICKUP_COMPLETED: [LoadStatus.IN_TRANSIT],
        LoadStatus.IN_TRANSIT: [LoadStatus.DELIVERED],
        LoadStatus.DELIVERED: [LoadStatus.COMPLETED, LoadStatus.DISPUTED],
        LoadStatus.COMPLETED: [],
        LoadStatus.CANCELLED: [],
        LoadStatus.EXPIRED: [],
        LoadStatus.DISPUTED: [LoadStatus.COMPLETED]
    }

    SHIPMENT_TRANSITIONS = {
        ShipmentStatus.WAITING_FOR_PARTNER_ASSIGNMENT: [ShipmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT, ShipmentStatus.DRIVER_ASSIGNED, ShipmentStatus.COMPLETED],
        ShipmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT: [ShipmentStatus.DRIVER_ASSIGNED, ShipmentStatus.COMPLETED],
        ShipmentStatus.DRIVER_ASSIGNED: [ShipmentStatus.DRIVER_ACCEPTED, ShipmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT],
        ShipmentStatus.DRIVER_ACCEPTED: [ShipmentStatus.PICKUP_STARTED, ShipmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT],
        ShipmentStatus.PICKUP_STARTED: [ShipmentStatus.PICKUP_COMPLETED],
        ShipmentStatus.PICKUP_COMPLETED: [ShipmentStatus.IN_TRANSIT],
        ShipmentStatus.IN_TRANSIT: [ShipmentStatus.DELIVERED],
        ShipmentStatus.DELIVERED: [ShipmentStatus.POD_UPLOADED, ShipmentStatus.DISPUTED],
        ShipmentStatus.POD_UPLOADED: [ShipmentStatus.COMPLETED, ShipmentStatus.DISPUTED],
        ShipmentStatus.COMPLETED: [],
        ShipmentStatus.DISPUTED: [ShipmentStatus.COMPLETED]
    }

    @classmethod
    def can_transition_load(cls, current_state: LoadStatus, target_state: LoadStatus) -> bool:
        try:
            curr = LoadStatus(current_state)
            target = LoadStatus(target_state)
        except ValueError:
            return False
        allowed = cls.LOAD_TRANSITIONS.get(curr, [])
        return target in allowed

    @classmethod
    def enforce_load_transition(cls, current_state: LoadStatus, target_state: LoadStatus):
        if not cls.can_transition_load(current_state, target_state):
            curr_val = current_state.value if hasattr(current_state, 'value') else str(current_state)
            target_val = target_state.value if hasattr(target_state, 'value') else str(target_state)
            raise HTTPException(
                status_code=400,
                detail=f"Invalid state transition for Load: {curr_val} -> {target_val}"
            )

    @classmethod
    def can_transition_shipment(cls, current_state: ShipmentStatus, target_state: ShipmentStatus) -> bool:
        try:
            curr = ShipmentStatus(current_state)
            target = ShipmentStatus(target_state)
        except ValueError:
            return False
        allowed = cls.SHIPMENT_TRANSITIONS.get(curr, [])
        return target in allowed

    @classmethod
    def enforce_shipment_transition(cls, current_state: ShipmentStatus, target_state: ShipmentStatus):
        if not cls.can_transition_shipment(current_state, target_state):
            curr_val = current_state.value if hasattr(current_state, 'value') else str(current_state)
            target_val = target_state.value if hasattr(target_state, 'value') else str(target_state)
            raise HTTPException(
                status_code=400,
                detail=f"Invalid state transition for Shipment: {curr_val} -> {target_val}"
            )
