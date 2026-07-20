from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websockets import manager

router = APIRouter()

@router.websocket("/company/{company_id}")
async def websocket_company_endpoint(websocket: WebSocket, company_id: str):
    channel = f"company:{company_id}"
    await manager.connect(websocket, channel)
    try:
        while True:
            # Keep connection alive, wait for messages (ping/pong)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)

@router.websocket("/shipment/{shipment_id}")
async def websocket_shipment_endpoint(websocket: WebSocket, shipment_id: str):
    channel = f"shipment:{shipment_id}"
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
