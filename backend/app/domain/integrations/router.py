from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user, RequireRole
from app.domain.identity.models import User
from app.domain.integrations import service
from app.domain.integrations.schemas import (
    ApiKeyCreate, ApiKeyResponse, ApiKeyCreateResponse,
    WebhookCreate, WebhookResponse,
    EdiConfigurationCreate, EdiConfigurationResponse
)

router = APIRouter()

# API Keys
@router.post("/api-keys", response_model=ApiKeyCreateResponse)
def create_api_key(
    *,
    db: Session = Depends(get_db),
    key_in: ApiKeyCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"]))
):
    """Create a new API Key."""
    return service.create_api_key(db=db, company_id=current_user.company_id, key_in=key_in)

@router.get("/api-keys", response_model=List[ApiKeyResponse])
def get_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all API Keys for current company."""
    return service.get_company_api_keys(db=db, company_id=current_user.company_id)

# Webhooks
@router.post("/webhooks", response_model=WebhookResponse)
def create_webhook(
    *,
    db: Session = Depends(get_db),
    webhook_in: WebhookCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"]))
):
    """Create a new webhook endpoint."""
    return service.create_webhook(db=db, company_id=current_user.company_id, webhook_in=webhook_in)

@router.get("/webhooks", response_model=List[WebhookResponse])
def get_webhooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all webhooks for current company."""
    return service.get_company_webhooks(db=db, company_id=current_user.company_id)

# EDI Configs
@router.post("/edi-configurations", response_model=EdiConfigurationResponse)
def create_edi_configuration(
    *,
    db: Session = Depends(get_db),
    edi_in: EdiConfigurationCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"]))
):
    """Create a new EDI configuration."""
    return service.create_edi_config(db=db, company_id=current_user.company_id, edi_in=edi_in)

@router.get("/edi-configurations", response_model=List[EdiConfigurationResponse])
def get_edi_configurations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all EDI configurations for current company."""
    return service.get_company_edi_configs(db=db, company_id=current_user.company_id)
