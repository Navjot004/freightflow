from typing import Optional
from sqlalchemy.orm import Session
from app.db.repository import BaseRepository
from app.domain.fleet.drivers.models import DriverProfile, DriverAssignment

class DriverProfileRepository(BaseRepository[DriverProfile, dict, dict]):
    def get_by_user_id(self, db: Session, *, user_id: str) -> Optional[DriverProfile]:
        return db.query(self.model).filter(self.model.user_id == user_id).first()

class DriverAssignmentRepository(BaseRepository[DriverAssignment, dict, dict]):
    pass

driver_profile_repository = DriverProfileRepository(DriverProfile)
driver_assignment_repository = DriverAssignmentRepository(DriverAssignment)
