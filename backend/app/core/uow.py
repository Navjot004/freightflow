import json
from typing import List, TypeVar, Type, Any
from sqlalchemy.orm import Session
from app.core.events import DomainEvent
from app.core.models import DomainEventRecord, OutboxEvent

class BaseUnitOfWork:
    def __init__(self, db: Session):
        self.db = db
        self._events: List[DomainEvent] = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()

    def register_event(self, event: DomainEvent):
        self._events.append(event)

    def _flush_events(self):
        for event in self._events:
            record = DomainEventRecord(
                aggregate_type=event.aggregate_type,
                aggregate_id=event.aggregate_id,
                event_type=event.event_type,
                payload=json.dumps(event.payload),
                created_at=event.created_at
            )
            self.db.add(record)
            self.db.flush() # Flush to get the record ID
            
            outbox = OutboxEvent(
                event_id=record.id,
                processed=False,
                created_at=event.created_at
            )
            self.db.add(outbox)
        self._events.clear()

    def commit(self):
        self._flush_events()
        self.db.commit()

    def rollback(self):
        self._events.clear()
        self.db.rollback()
