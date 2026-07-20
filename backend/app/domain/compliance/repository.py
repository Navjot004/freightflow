from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.repository import BaseRepository
from app.domain.compliance.models import ComplianceRecord
from app.domain.compliance.schemas import ComplianceRecordCreate, ComplianceRecordUpdate

class ComplianceRepository(BaseRepository[ComplianceRecord, ComplianceRecordCreate, ComplianceRecordUpdate]):
    def get_by_company(self, db: Session, *, company_id: str) -> List[ComplianceRecord]:
        return db.query(self.model).filter(
            self.model.company_id == company_id,
            self.model.is_active == True
        ).order_by(self.model.created_at.desc()).all()

compliance_repository = ComplianceRepository(ComplianceRecord)
