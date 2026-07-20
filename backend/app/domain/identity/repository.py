from typing import Optional
from sqlalchemy.orm import Session
from app.db.repository import BaseRepository
from app.domain.identity.models import User, Company, Role, Invitation, CompanyVehicle
from app.domain.identity.schemas import UserCreate

class UserRepository(BaseRepository[User, UserCreate, UserCreate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(self.model).filter(self.model.email == email).first()

    def get_by_company(self, db: Session, *, company_id: str):
        return db.query(self.model).filter(self.model.company_id == company_id).all()

    def count_by_company(self, db: Session, *, company_id: str) -> int:
        return db.query(self.model).filter(self.model.company_id == company_id).count()

class CompanyRepository(BaseRepository[Company, UserCreate, UserCreate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Company]:
        return db.query(self.model).filter(self.model.name == name).first()

class RoleRepository(BaseRepository[Role, UserCreate, UserCreate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Role]:
        return db.query(self.model).filter(self.model.name == name).first()

class InvitationRepository(BaseRepository[Invitation, UserCreate, UserCreate]):
    def get_valid_invite(self, db: Session, *, token: str):
        from datetime import datetime, timezone
        return db.query(self.model).filter(
            self.model.token == token,
            self.model.is_accepted == False,
            self.model.expires_at > datetime.now(timezone.utc)
        ).first()

class CompanyVehicleRepository(BaseRepository[CompanyVehicle, UserCreate, UserCreate]):
    def get_by_company(self, db: Session, *, company_id: str) -> Optional[CompanyVehicle]:
        return db.query(self.model).filter(self.model.company_id == company_id).first()

user_repository = UserRepository(User)
company_repository = CompanyRepository(Company)
role_repository = RoleRepository(Role)
invitation_repository = InvitationRepository(Invitation)
company_vehicle_repository = CompanyVehicleRepository(CompanyVehicle)
