from pydantic import BaseModel
from typing import Any, Dict
from datetime import datetime

class DomainEvent(BaseModel):
    event_type: str
    aggregate_type: str
    aggregate_id: str
    payload: Dict[str, Any]
    created_at: datetime = None

    def __init__(self, **data):
        super().__init__(**data)
        if self.created_at is None:
            self.created_at = datetime.utcnow()
