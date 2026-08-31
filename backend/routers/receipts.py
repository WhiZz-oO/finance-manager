import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models.receipt import Receipt
from models.transaction import Transaction
from models.account import Account
from models.user import User
from routers.auth import get_current_user
from services.ocr import process_receipt
from config import settings

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
RECEIPTS_DIR = Path(settings.RECEIPTS_DIR)


def _receipt_to_dict(r: Receipt) -> dict:
    return {
        "id": r.id,
        "transaction_id": r.transaction_id,
        "original_filename": r.original_filename,
        "mime_type": r.mime_type,
        "ocr_text": r.ocr_text,
        "merchant": r.merchant,
        "receipt_date": r.receipt_date.isoformat() if r.receipt_date else None,
        "total_amount": r.total_amount,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.post("/upload/{transaction_id}", status_code=201)
async def upload_receipt(
    transaction_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify transaction belongs to user
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    txn = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.account_id.in_(user_account_ids),
        Transaction.is_deleted == False,
    ).first()
    if not txn:
        raise HTTPException(404, "Transaction not found")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"File type not allowed. Allowed: {', '.join(ALLOWED_TYPES)}")

    # Save file
    ext = Path(file.filename).suffix or ".jpg"
    unique_name = f"receipt_{uuid.uuid4().hex}{ext}"
    dest = RECEIPTS_DIR / unique_name
    RECEIPTS_DIR.mkdir(parents=True, exist_ok=True)

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Run OCR
    ocr_data = process_receipt(str(dest))

    # Parse date if string returned
    receipt_date = None
    if ocr_data.get("receipt_date"):
        from datetime import datetime
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
            try:
                receipt_date = datetime.strptime(ocr_data["receipt_date"], fmt).date()
                break
            except ValueError:
                pass

    receipt = Receipt(
        transaction_id=transaction_id,
        file_path=unique_name,
        original_filename=file.filename,
        mime_type=file.content_type,
        ocr_text=ocr_data.get("ocr_text"),
        merchant=ocr_data.get("merchant"),
        receipt_date=receipt_date,
        total_amount=ocr_data.get("total_amount"),
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return _receipt_to_dict(receipt)


@router.get("/transaction/{transaction_id}")
def get_receipts_for_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    receipts = db.query(Receipt).filter(Receipt.transaction_id == transaction_id).all()
    return [_receipt_to_dict(r) for r in receipts]


@router.get("/file/{receipt_id}")
def get_receipt_file(
    receipt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Receipt not found")
    path = RECEIPTS_DIR / receipt.file_path
    if not path.exists():
        raise HTTPException(404, "Receipt file not found on disk")
    return FileResponse(str(path), media_type=receipt.mime_type, filename=receipt.original_filename)


@router.delete("/{receipt_id}")
def delete_receipt(
    receipt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Receipt not found")
    path = RECEIPTS_DIR / receipt.file_path
    if path.exists():
        path.unlink()
    db.delete(receipt)
    db.commit()
    return {"message": "Receipt deleted"}
