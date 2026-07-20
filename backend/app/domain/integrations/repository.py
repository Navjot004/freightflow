from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.repository import BaseRepository
from app.domain.integrations.models import ApiKey, Webhook, EdiConfiguration
from app.domain.integrations.schemas import ApiKeyCreate, WebhookCreate, EdiConfigurationCreate

class ApiKeyRepository(BaseRepository[ApiKey, ApiKeyCreate, ApiKeyCreate]):
    def get_by_company(self, db: Session, *, company_id: str) -> List[ApiKey]:
        return db.query(self.model).filter(
            self.model.company_id == company_id
        ).order_by(self.model.created_at.desc()).all()

class WebhookRepository(BaseRepository[Webhook, WebhookCreate, WebhookCreate]):
    def get_by_company(self, db: Session, *, company_id: str) -> List[Webhook]:
        return db.query(self.model).filter(
            self.model.company_id == company_id
        ).order_by(self.model.created_at.desc()).all()

class EdiConfigurationRepository(BaseRepository[EdiConfiguration, EdiConfigurationCreate, EdiConfigurationCreate]):
    def get_by_company(self, db: Session, *, company_id: str) -> List[EdiConfiguration]:
        return db.query(self.model).filter(
            self.model.company_id == company_id
        ).order_by(self.model.created_at.desc()).all()

api_key_repository = ApiKeyRepository(ApiKey)
webhook_repository = WebhookRepository(Webhook)
edi_configuration_repository = EdiConfigurationRepository(EdiConfiguration)
