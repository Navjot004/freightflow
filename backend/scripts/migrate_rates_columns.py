import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db.database import engine

def migrate():
    print("Connecting to database and applying ALTER TABLE statements...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_rate DOUBLE PRECISION;"))
        conn.execute(text("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS carrier_rate DOUBLE PRECISION;"))
        conn.execute(text("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS partner_rate DOUBLE PRECISION;"))
        
        conn.execute(text("ALTER TABLE partner_assignments ADD COLUMN IF NOT EXISTS agreed_rate DOUBLE PRECISION;"))
        
        conn.commit()
        print("Successfully added rate columns to Neon PostgreSQL database!")

if __name__ == "__main__":
    migrate()
