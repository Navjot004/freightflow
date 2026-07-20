from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.domain.organizations.companies import schemas, service
from app.domain.identity.schemas import CompanyResponse, UserResponse
from app.core.deps import get_current_active_user, RequireRole
from app.domain.identity.models import User

router = APIRouter()

@router.get("/me", response_model=CompanyResponse)
def get_my_company(current_user: User = Depends(get_current_active_user)):
    return current_user.company

@router.put("/me", response_model=CompanyResponse)
def update_my_company(
    company_in: schemas.CompanyUpdate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.update_company(db, current_user.company_id, company_in)

@router.post("/me/verify", response_model=CompanyResponse)
def mock_verify_my_company(
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Mock endpoint to mark company as VERIFIED"""
    return service.verify_company(db, current_user.company_id)

@router.get("/me/stats", response_model=schemas.CompanyDashboardStats)
def get_my_company_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return service.get_company_stats(db, current_user.company_id)

@router.get("/me/employees", response_model=List[UserResponse])
def get_my_company_employees(
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.get_company_employees(db, current_user.company_id)

@router.post("/me/employees")
def create_my_company_employee(
    employee_in: schemas.EmployeeCreate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.create_employee(db, current_user.company_id, employee_in)

@router.post("/me/employees/{employee_id}/reset-password")
def reset_company_employee_password(
    employee_id: str,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.reset_employee_password(db, employee_id, current_user.company_id)

@router.post("/invites", response_model=schemas.InviteResponse)
def create_employee_invite(
    invite_in: schemas.EmployeeInvite,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    link = service.create_invite(db, invite_in.email, invite_in.role_name, current_user.company_id)
    return {"message": "Invite generated successfully", "invite_link": link}

@router.get("/invites/{token}")
def get_invite_info(token: str, db: Session = Depends(get_db)):
    return service.get_invite_details(db, token)

@router.post("/invites/accept", response_model=UserResponse)
def accept_employee_invite(accept_in: schemas.InviteAccept, db: Session = Depends(get_db)):
    return service.accept_invite(db, accept_in)

@router.get("/me/vehicle", response_model=schemas.CompanyVehicleResponse)
def get_my_company_vehicle(
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR"])),
    db: Session = Depends(get_db)
):
    return service.get_company_vehicle(db, current_user.company_id)

@router.put("/me/vehicle", response_model=schemas.CompanyVehicleResponse)
def update_my_company_vehicle(
    vehicle_in: schemas.CompanyVehicleUpdate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "OWNER_OPERATOR"])),
    db: Session = Depends(get_db)
):
    return service.update_company_vehicle(db, current_user.company_id, vehicle_in)

@router.get("/me/profile", response_model=schemas.CarrierProfileResponse)
def get_my_company_profile(
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN", "DISPATCHER"])),
    db: Session = Depends(get_db)
):
    return service.get_company_profile(db, current_user.company_id)

@router.put("/me/profile", response_model=schemas.CarrierProfileResponse)
def update_my_company_profile(
    profile_in: schemas.CarrierProfileUpdate,
    current_user: User = Depends(RequireRole(["COMPANY_ADMIN"])),
    db: Session = Depends(get_db)
):
    return service.update_company_profile(db, current_user.company_id, profile_in)
