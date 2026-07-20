from sqlalchemy.orm import Session
from app.domain.compliance.models import ComplianceRecord, ComplianceType
from app.domain.compliance.repository import compliance_repository
from app.domain.compliance.schemas import ComplianceRecordCreate

def create_compliance_record(db: Session, record_in: ComplianceRecordCreate) -> ComplianceRecord:
    record = compliance_repository.model(
        company_id=record_in.company_id,
        type=ComplianceType(record_in.type),
        identifier=record_in.identifier,
        issue_date=record_in.issue_date,
        expiry_date=record_in.expiry_date,
        document_url=record_in.document_url
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_company_compliance(db: Session, company_id: str):
    return compliance_repository.get_by_company(db=db, company_id=company_id)
