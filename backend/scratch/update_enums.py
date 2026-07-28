from app.db.database import engine
from sqlalchemy import text

def update_db_enums():
    shipment_statuses = [
        'WAITING_FOR_PARTNER_ASSIGNMENT',
        'WAITING_FOR_DRIVER_ASSIGNMENT',
        'DRIVER_ASSIGNED',
        'DRIVER_ACCEPTED',
        'PICKUP_STARTED',
        'PICKUP_COMPLETED',
        'IN_TRANSIT',
        'DELIVERED',
        'POD_UPLOADED',
        'COMPLETED',
        'DISPUTED',
        'CANCELLED',
        'SUSPENDED'
    ]

    load_statuses = [
        'DRAFT',
        'OPEN_FOR_BIDDING',
        'TENDER_SENT',
        'TENDER_ACCEPTED',
        'DRIVER_ASSIGNED',
        'PICKUP_COMPLETED',
        'IN_TRANSIT',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
        'EXPIRED',
        'DISPUTED',
        'SUSPENDED'
    ]

    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        for val in shipment_statuses:
            try:
                conn.execute(text(f"ALTER TYPE shipmentstatus ADD VALUE IF NOT EXISTS '{val}';"))
                print(f"Added shipmentstatus value: {val}")
            except Exception as e:
                print(f"Error adding {val} to shipmentstatus: {e}")

        for val in load_statuses:
            try:
                conn.execute(text(f"ALTER TYPE loadstatus ADD VALUE IF NOT EXISTS '{val}';"))
                print(f"Added loadstatus value: {val}")
            except Exception as e:
                print(f"Error adding {val} to loadstatus: {e}")

if __name__ == "__main__":
    update_db_enums()
