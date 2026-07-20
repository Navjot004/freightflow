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
        allowed = cls.LOAD_TRANSITIONS.get(current_state, [])
        return target_state in allowed

    @classmethod
    def enforce_load_transition(cls, current_state: LoadStatus, target_state: LoadStatus):
        if not cls.can_transition_load(current_state, target_state):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid state transition for Load: {current_state.value} -> {target_state.value}"
            )

    @classmethod
    def can_transition_shipment(cls, current_state: ShipmentStatus, target_state: ShipmentStatus) -> bool:
        allowed = cls.SHIPMENT_TRANSITIONS.get(current_state, [])
        return target_state in allowed

    @classmethod
    def enforce_shipment_transition(cls, current_state: ShipmentStatus, target_state: ShipmentStatus):
        if not cls.can_transition_shipment(current_state, target_state):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid state transition for Shipment: {current_state.value} -> {target_state.value}"
            )
