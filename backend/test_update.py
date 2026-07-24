import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.db.database import SessionLocal, engine
from app.domain.freight.loads.models import Load, LoadStatus
from app.domain.freight.loads.schemas import LoadUpdate
from app.domain.freight.loads.service import update_load

def test():
    db = SessionLocal()
    try:
        load = db.query(Load).filter(Load.status == LoadStatus.OPEN_FOR_BIDDING).first()
        if not load:
            print("No open load found")
            return
        print(f"Testing update on OPEN load {load.id}, status {load.status}")

        load_in = LoadUpdate(
            origin_address=load.origin_address,
            destination_address=load.destination_address,
            pickup_date=load.pickup_date,
            delivery_date=load.delivery_date,
            equipment_type=load.equipment_type,
            weight_lbs=load.weight_lbs,
            commodity=load.commodity,
            dimensions="53ft x 8.5ft x 9ft",
            rate=2500.0
        )
        res = update_load(db, load.id, load.shipper_id, load_in)
        print("Update SUCCESS:", res.id, res.dimensions, res.rate)
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
