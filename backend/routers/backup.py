from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, run_integrity_check
from models.user import User
from routers.auth import get_current_user
from services.backup import create_backup, list_backups, restore_backup

router = APIRouter(prefix="/api/backup", tags=["backup"])


@router.get("/list")
def get_backups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_backups(db)


@router.post("/create")
def trigger_backup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = create_backup(db, backup_type="manual")
        return {"message": "Backup created successfully", **result}
    except Exception as e:
        raise HTTPException(500, f"Backup failed: {str(e)}")


@router.post("/restore/{backup_id}")
def restore(
    backup_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = restore_backup(backup_id, db)
        return result
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Restore failed: {str(e)}")


@router.get("/integrity")
def check_integrity(
    current_user: User = Depends(get_current_user),
):
    result = run_integrity_check()
    return result
