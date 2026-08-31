from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from database import Base


class BackupLog(Base):
    __tablename__ = "backup_log"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    backup_type = Column(String, nullable=False)   # manual / daily / encrypted
    location = Column(String, nullable=False)      # file path or "cloud"
    checksum = Column(String, nullable=True)       # SHA-256 hex digest
    status = Column(String, default="success")     # success / failed / corrupted
    size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
