from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.domain.identity.models import User, CompanyType
from app.domain.organizations.partnerships import service
from app.domain.organizations.partnerships.schemas import PartnershipRequestCreate, PartnershipResponse, PartnerDirectoryItem

router = APIRouter()

@router.get("/transportation-partners", response_model=List[PartnerDirectoryItem])
def get_directory(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # If the user is a broker, we pass their company id to get connection statuses
    broker_id = current_user.company_id if current_user.company.type == CompanyType.BROKER else None
    return service.get_carrier_directory(db, broker_id=broker_id)

@router.post("/transportation-partnerships/request", response_model=PartnershipResponse)
def request_partnership(
    request_in: PartnershipRequestCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    return service.request_partnership(db, current_user.company_id, request_in)

@router.post("/transportation-partnerships/{partnership_id}/accept", response_model=PartnershipResponse)
def accept_partnership(
    partnership_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    return service.accept_partnership(db, partnership_id, current_user.company_id)

@router.post("/transportation-partnerships/{partnership_id}/reject", response_model=PartnershipResponse)
def reject_partnership(
    partnership_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    return service.reject_partnership(db, partnership_id, current_user.company_id)

@router.post("/transportation-partnerships/{partnership_id}/remove", response_model=PartnershipResponse)
def remove_partnership(
    partnership_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    return service.remove_partnership(db, partnership_id, current_user.company_id)

@router.get("/transportation-partnerships", response_model=List[PartnershipResponse])
def get_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return service.get_partnership_requests(db, current_user.company_id)

@router.get("/transportation-partnerships/network", response_model=List[PartnerDirectoryItem])
def get_network(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return service.get_carrier_network(db, current_user.company_id)

@router.get("/transportation-partnerships/connected-brokers", response_model=List[PartnershipResponse])
def get_connected_brokers(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return service.get_connected_brokers(db, current_user.company_id)
