from typing import Generator
from sqlalchemy.orm import Session
from app.db.database import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """
    Standard dependency for database sessions.
    Ensures that sessions are properly closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
