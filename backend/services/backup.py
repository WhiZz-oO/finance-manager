"""
Backup service: creates encrypted SQLite copies, manages retention, restores.
"""

import os
import shutil
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session

from config import settings
from utils.encryption import encrypt_file, decrypt_file, sha256_checksum
from models.backup_log import BackupLog
from database import run_integrity_check

DB_PATH = "./data/finance.db"
DAILY_DIR = Path(settings.BACKUPS_DIR) / "daily"
ENCRYPTED_DIR = Path(settings.BACKUPS_DIR) / "encrypted"

BACKUP_PASSWORD = "finance-backup-2026"  # In production, derive from user password


def _ensure_dirs():
    DAILY_DIR.mkdir(parents=True, exist_ok=True)
    ENCRYPTED_DIR.mkdir(parents=True, exist_ok=True)


def create_backup(db: Session, backup_type: str = "manual") -> dict:
    """
    Creates a hot SQLite backup using the SQLite backup API (safe while DB is in use).
    Optionally encrypts it.
    Returns backup metadata dict.
    """
    _ensure_dirs()
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    plain_filename = f"finance_{timestamp}.db"
    enc_filename = f"finance_{timestamp}.enc"

    plain_path = DAILY_DIR / plain_filename
    enc_path = ENCRYPTED_DIR / enc_filename

    # --- Hot backup using SQLite backup API ---
    try:
        src = sqlite3.connect(DB_PATH)
        dst = sqlite3.connect(str(plain_path))
        src.backup(dst)
        dst.close()
        src.close()
    except Exception as e:
        log = BackupLog(
            filename=plain_filename,
            backup_type=backup_type,
            location=str(plain_path),
            status="failed",
        )
        db.add(log)
        db.commit()
        raise RuntimeError(f"Backup failed: {e}")

    # --- Checksum ---
    checksum = sha256_checksum(str(plain_path))
    size = os.path.getsize(str(plain_path))

    # --- Encrypt ---
    encrypt_file(str(plain_path), str(enc_path), BACKUP_PASSWORD)
    enc_checksum = sha256_checksum(str(enc_path))
    enc_size = os.path.getsize(str(enc_path))

    # --- Log both ---
    plain_log = BackupLog(
        filename=plain_filename,
        backup_type=backup_type,
        location=str(plain_path),
        checksum=checksum,
        status="success",
        size_bytes=size,
    )
    enc_log = BackupLog(
        filename=enc_filename,
        backup_type="encrypted",
        location=str(enc_path),
        checksum=enc_checksum,
        status="success",
        size_bytes=enc_size,
    )
    db.add(plain_log)
    db.add(enc_log)
    db.commit()
    db.refresh(plain_log)

    # --- Purge old backups ---
    _purge_old_backups(db)

    return {
        "id": plain_log.id,
        "filename": plain_filename,
        "encrypted_filename": enc_filename,
        "checksum": checksum,
        "size_bytes": size,
        "created_at": plain_log.created_at.isoformat(),
    }


def restore_backup(backup_id: int, db: Session) -> dict:
    """
    Restores from an encrypted backup after integrity verification.
    """
    log = db.query(BackupLog).filter(BackupLog.id == backup_id).first()
    if not log:
        raise ValueError("Backup not found")

    # Find corresponding encrypted backup
    enc_filename = log.filename.replace(".db", ".enc")
    enc_path = ENCRYPTED_DIR / enc_filename
    if not enc_path.exists():
        raise FileNotFoundError(f"Encrypted backup not found: {enc_path}")

    # Verify encrypted checksum
    current_checksum = sha256_checksum(str(enc_path))
    enc_log = db.query(BackupLog).filter(BackupLog.filename == enc_filename).first()
    if enc_log and enc_log.checksum and enc_log.checksum != current_checksum:
        raise ValueError("Backup integrity check FAILED — backup may be corrupted")

    # Decrypt to temp file
    temp_path = DAILY_DIR / "restore_temp.db"
    decrypt_file(str(enc_path), str(temp_path), BACKUP_PASSWORD)

    # Verify decrypted DB integrity
    conn = sqlite3.connect(str(temp_path))
    result = conn.execute("PRAGMA integrity_check").fetchone()
    conn.close()
    if result[0] != "ok":
        os.remove(str(temp_path))
        raise ValueError("Decrypted backup failed integrity check")

    # Replace current DB
    shutil.copy2(str(temp_path), DB_PATH)
    os.remove(str(temp_path))

    return {"status": "restored", "from_backup": log.filename}


def list_backups(db: Session) -> list:
    logs = (
        db.query(BackupLog)
        .filter(BackupLog.backup_type != "encrypted")
        .order_by(BackupLog.created_at.desc())
        .all()
    )
    return [
        {
            "id": l.id,
            "filename": l.filename,
            "backup_type": l.backup_type,
            "location": l.location,
            "checksum": l.checksum,
            "status": l.status,
            "size_bytes": l.size_bytes,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


def _purge_old_backups(db: Session):
    """Remove backups older than retention policy."""
    cutoff = datetime.now() - timedelta(days=settings.BACKUP_RETENTION_DAYS)
    old_logs = db.query(BackupLog).filter(BackupLog.created_at < cutoff).all()
    for log in old_logs:
        path = Path(log.location)
        if path.exists():
            path.unlink()
        db.delete(log)
    db.commit()
