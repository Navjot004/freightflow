from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.db.repository import BaseRepository
from app.domain.freight.loads.models import Load, LoadStatus
from app.domain.freight.loads.schemas import LoadCreate, LoadUpdate

class LoadRepository(BaseRepository[Load, LoadCreate, LoadUpdate]):
    def create_with_shipper(self, db: Session, *, obj_in: LoadCreate, shipper_id: str) -> Load:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(
            shipper_id=shipper_id,
            **obj_in_data,
            status=LoadStatus.OPEN_FOR_BIDDING
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_my_loads(self, db: Session, *, shipper_id: str, skip: int = 0, limit: int = 100):
        return db.query(self.model).filter(self.model.shipper_id == shipper_id).order_by(desc(self.model.created_at)).offset(skip).limit(limit).all()

    def get_by_id_and_shipper(self, db: Session, *, load_id: str, shipper_id: str) -> Optional[Load]:
        return db.query(self.model).filter(self.model.id == load_id, self.model.shipper_id == shipper_id).first()

    def get_marketplace_loads(self, db: Session, *, skip: int = 0, limit: int = 20, search: str = None, equipment_type: str = None, sort_by: str = "created_at", sort_desc: bool = True):
        query = db.query(self.model).filter(self.model.status == LoadStatus.OPEN_FOR_BIDDING)
        
        if search:
            search_filter = or_(
                self.model.origin_address.ilike(f"%{search}%"),
                self.model.destination_address.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
            
        if equipment_type:
            query = query.filter(self.model.equipment_type == equipment_type)
            
        total = query.count()
        
        if sort_by == "pickup_date":
            order_col = self.model.pickup_date
        elif sort_by == "weight_lbs":
            order_col = self.model.weight_lbs
        else:
            order_col = self.model.created_at
            
        if sort_desc:
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(order_col)
            
        items = query.offset(skip).limit(limit).all()
        return total, items

load_repository = LoadRepository(Load)
