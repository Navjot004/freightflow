import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps channel name (e.g., "company:123" or "shipment:456") to list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.pubsub = redis_client.pubsub()
        self._listener_task = None

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
            # Subscribe to the redis channel if it's the first connection
            await self.pubsub.subscribe(channel)
        
        self.active_connections[channel].append(websocket)
        
        # Start listener if not already running
        if self._listener_task is None or self._listener_task.done():
            self._listener_task = asyncio.create_task(self._listen_to_redis())

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
            
            if len(self.active_connections[channel]) == 0:
                del self.active_connections[channel]
                # We could unsubscribe from redis channel here, but for simplicity
                # we can leave it or unsubscribe to save resources.
                asyncio.create_task(self.pubsub.unsubscribe(channel))

    async def _listen_to_redis(self):
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    channel = message["channel"]
                    data = message["data"]
                    
                    # Forward to all local websockets listening to this channel
                    if channel in self.active_connections:
                        dead_sockets = []
                        for ws in self.active_connections[channel]:
                            try:
                                await ws.send_text(data)
                            except Exception as e:
                                logger.error(f"Error sending to websocket: {e}")
                                dead_sockets.append(ws)
                        
                        # Cleanup dead sockets
                        for ws in dead_sockets:
                            self.disconnect(ws, channel)
        except Exception as e:
            logger.error(f"Redis PubSub listener error: {e}")
            self._listener_task = None

    async def broadcast_to_channel(self, channel: str, message: dict):
        """
        Publish message to Redis, so all workers receive it and forward to their websockets.
        """
        await redis_client.publish(channel, json.dumps(message))

manager = ConnectionManager()
