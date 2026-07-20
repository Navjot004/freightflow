import uuid
import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Text
from app.db.database import Base

from app.domain.marketplace.bids.models import Bid
from app.domain.marketplace.tenders.models import Tender
from app.domain.notifications.models import Notification
from app.domain.identity.admin.models import AuditLog
from app.domain.freight.disputes.models import Dispute
from app.domain.marketplace.ratings.models import Rating
from app.domain.finance.models import FinancialAccount, Invoice, Settlement, SettlementLineItem
from app.domain.compliance.models import ComplianceRecord
from app.domain.integrations.models import ApiKey, Webhook, EdiConfiguration

def generate_uuid():
    return str(uuid.uuid4())

class DomainEventRecord(Base):
    __tablename__ = "domain_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    aggregate_type = Column(String, index=True)
    aggregate_id = Column(String, index=True)
    event_type = Column(String, index=True)
    payload = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, index=True) # Foreign key or reference to domain_events.id
    processed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
