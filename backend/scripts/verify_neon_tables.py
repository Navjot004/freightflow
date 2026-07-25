import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db.database import engine

def check():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'partner_assignments';"))
        cols = [f"{r[0]} ({r[1]})" for r in res.fetchall()]
        print("partner_assignments columns:", cols)

        res2 = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shipments';"))
        cols2 = [f"{r[0]} ({r[1]})" for r in res2.fetchall()]
        print("shipments columns:", cols2)

if __name__ == "__main__":
    check()
