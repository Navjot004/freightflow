from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.domain.identity.models import User, Company, Role
from app.domain.identity.schemas import UserCreate, UserLogin
from app.domain.identity.repository import user_repository, company_repository, role_repository
from app.core.security import get_password_hash, verify_password, create_access_token

ALLOWED_ROLES = {"COMPANY_ADMIN", "SHIPPER_OPS", "BROKER_OPS", "DISPATCHER", "DRIVER"}

def register_new_company_and_user(db: Session, user_in: UserCreate):
    from app.core.uow import BaseUnitOfWork
    from app.core.events import DomainEvent
    
    existing_user = user_repository.get_by_email(db=db, email=user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists. Please login")
    
    existing_company = company_repository.get_by_name(db=db, name=user_in.company.name)
    if existing_company:
        raise HTTPException(status_code=400, detail="Company name already registered")

    with BaseUnitOfWork(db) as uow:
        signup_role = "COMPANY_ADMIN"
        role = role_repository.get_by_name(db=db, name=signup_role)
        if not role:
            role = Role(name=signup_role, permissions=[])
            db.add(role)
            db.flush()

        company = Company(
            name=user_in.company.name,
            type=user_in.company.type,
            dot_number=user_in.company.dot_number,
            mc_number=user_in.company.mc_number,
            tax_id=user_in.company.tax_id,
            insurance_expiry_date=user_in.company.insurance_expiry_date
        )
        db.add(company)
        db.flush()

        user = User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            phone_number=user_in.phone_number,
            company_id=company.id,
            role_id=role.id
        )
        db.add(user)
        db.flush()

        from app.domain.identity.models import CompanyUser
        company_user = CompanyUser(
            user_id=user.id,
            company_id=company.id,
            role_id=role.id,
            is_active=True
        )
        db.add(company_user)
        
        # Register a domain event to outbox
        uow.register_event(DomainEvent(
            aggregate_type="User",
            aggregate_id=user.id,
            event_type="UserRegistered",
            payload={"email": user.email, "company_id": company.id}
        ))
        
        uow.commit()
        db.refresh(user)

    return user

def switch_context(db: Session, current_user: User, company_id: str):
    from app.domain.identity.models import CompanyUser
    company_user = db.query(CompanyUser).filter(
        CompanyUser.user_id == current_user.id,
        CompanyUser.company_id == company_id,
        CompanyUser.is_active == True
    ).first()

    if not company_user:
        raise HTTPException(status_code=403, detail="User does not have access to this company context")
    
    extra_claims = {
        "context_company_id": company_user.company_id,
        "context_role_id": company_user.role_id
    }
    access_token = create_access_token(subject=current_user.id, extra_claims=extra_claims)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "context": extra_claims
    }

def authenticate_user(db: Session, user_in: UserLogin):
    user = user_repository.get_by_email(db=db, email=user_in.email)
    if not user:
        raise HTTPException(status_code=404, detail="User doesn't exist. Please register")
    if not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": user}

def invite_employee(db: Session, email: str, role_name: str, company_id: str):
    from app.tasks.email_tasks import send_invite_email
    # Send mock email synchronously to bypass redis connection issue
    send_invite_email(email, role_name, company_id)
    return {"message": "Invite sent successfully"}

def change_password(db: Session, user: User, current_password: str, new_password: str):
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect current password")
    
    user.password_hash = get_password_hash(new_password)
    user.requires_password_change = False
    
    db.commit()
    db.refresh(user)
    return {"message": "Password changed successfully"}

def update_user(db: Session, user_id: str, user_in):
    user = user_repository.get(db=db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    return user_repository.update(db=db, db_obj=user, obj_in=update_data)


