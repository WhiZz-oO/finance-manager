from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

from config import settings

# Ensure local data directory exists if using SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    os.makedirs("./data", exist_ok=True)
    os.makedirs("./data/receipts", exist_ok=True)
    os.makedirs("./data/backups/daily", exist_ok=True)
    os.makedirs("./data/backups/encrypted", exist_ok=True)
    
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )

    # Enable WAL mode and foreign keys on SQLite connections
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=10000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()

else:
    # PostgreSQL Cloud Database Engine
    db_url = settings.DATABASE_URL
    # Fix postgres:// -> postgresql:// if needed (e.g. from Render/Heroku)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    engine = create_engine(
        db_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=False,
    )


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency: yields a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_integrity_check() -> dict:
    """Run integrity check and return result."""
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            result = conn.execute(
                __import__("sqlalchemy").text("PRAGMA integrity_check")
            ).fetchall()
            rows = [r[0] for r in result]
            is_ok = rows == ["ok"]
            return {"status": "ok" if is_ok else "error", "details": rows}
    else:
        # PostgreSQL Health Check
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
            return {"status": "ok", "details": "PostgreSQL connection active"}
