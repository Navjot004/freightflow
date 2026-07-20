from sqlalchemy.orm import Session
from app.domain.identity.models import User, Role

class PermissionService:
    """
    Evaluates permissions based on active role.
    In future phases, this will check Redis caching.
    """
    
    @staticmethod
    def has_permission(db: Session, user: User, permission_name: str) -> bool:
        # User must have an active context
        active_role_id = getattr(user, "active_role_id", user.role_id)
        if not active_role_id:
            return False
            
        role = db.query(Role).filter(Role.id == active_role_id).first()
        if not role:
            return False
            
        # Super admin always has access
        if role.name == "SUPER_ADMIN":
            return True
            
        return permission_name in role.permissions

def check_permission(db: Session, user: User, permission_name: str) -> bool:
    return PermissionService.has_permission(db, user, permission_name)
