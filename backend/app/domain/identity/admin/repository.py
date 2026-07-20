from app.db.repository import BaseRepository
from app.domain.identity.admin.models import AuditLog

class AuditLogRepository(BaseRepository[AuditLog, dict, dict]):
    pass

audit_log_repository = AuditLogRepository(AuditLog)
