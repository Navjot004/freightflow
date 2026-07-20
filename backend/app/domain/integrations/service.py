import secrets
import hashlib
from sqlalchemy.orm import Session
from app.domain.integrations.models import ApiKey, Webhook, EdiConfiguration, WebhookStatus
from app.domain.integrations.repository import api_key_repository, webhook_repository, edi_configuration_repository
from app.domain.integrations.schemas import ApiKeyCreate, WebhookCreate, EdiConfigurationCreate

def create_api_key(db: Session, company_id: str, key_in: ApiKeyCreate):
    raw_key = secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    prefix = raw_key[:8]
    
    api_key = api_key_repository.model(
        company_id=company_id,
        name=key_in.name,
        key_hash=key_hash,
        prefix=prefix
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    # Return raw key only once
    return {
        "id": api_key.id,
        "company_id": api_key.company_id,
        "name": api_key.name,
        "prefix": api_key.prefix,
        "is_active": api_key.is_active,
        "created_at": api_key.created_at,
        "expires_at": api_key.expires_at,
        "key": raw_key
    }

def get_company_api_keys(db: Session, company_id: str):
    return api_key_repository.get_by_company(db=db, company_id=company_id)

def create_webhook(db: Session, company_id: str, webhook_in: WebhookCreate) -> Webhook:
    secret = secrets.token_urlsafe(24)
    webhook = webhook_repository.model(
        company_id=company_id,
        url=webhook_in.url,
        secret=secret,
        events=webhook_in.events,
        status=WebhookStatus.ACTIVE
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    return webhook

def get_company_webhooks(db: Session, company_id: str):
    return webhook_repository.get_by_company(db=db, company_id=company_id)

def create_edi_config(db: Session, company_id: str, edi_in: EdiConfigurationCreate) -> EdiConfiguration:
    edi = edi_configuration_repository.model(
        company_id=company_id,
        partner_id=edi_in.partner_id,
        isa_sender_id=edi_in.isa_sender_id,
        isa_receiver_id=edi_in.isa_receiver_id,
        qualifier=edi_in.qualifier
    )
    db.add(edi)
    db.commit()
    db.refresh(edi)
    return edi

def get_company_edi_configs(db: Session, company_id: str):
    return edi_configuration_repository.get_by_company(db=db, company_id=company_id)
