from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE shipments ADD COLUMN dispatcher_id VARCHAR(255) NULL;"))
    conn.commit()

print("Column added successfully.")
