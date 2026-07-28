import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool, QueuePool
from app.core.config import settings

IS_SERVERLESS = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
elif IS_SERVERLESS:
    # Serverless: use NullPool — each invocation opens/closes its own connection.
    # Neon's pgbouncer pooler (the `-pooler` suffix in the URL) handles real pooling.
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=NullPool,
        connect_args={"connect_timeout": 5}
    )
else:
    # Persistent server (local dev, VPS): use QueuePool with sane defaults.
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,       # detect stale connections
        pool_recycle=300,          # recycle connections every 5 min
        connect_args={"connect_timeout": 5}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


