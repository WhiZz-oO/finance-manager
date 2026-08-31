from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from database import get_db
from models.transfer import Transfer
from models.account import Account
from models.user import User
from routers.auth import get_current_user

router = APIRouter(prefix="/api/transfers", tags=["transfers"])


def _next_trf_ref(db: Session) -> str:
    last = (
        db.query(Transfer)
        .filter(Transfer.reference.like("TRF-%"))
        .order_by(Transfer.id.desc())
        .first()
    )
    n = int(last.reference.split("-")[1]) + 1 if last and last.reference else 1
    return f"TRF-{n:06d}"


class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    transfer_date: date
    description: Optional[str] = None


@router.get("/")
def list_transfers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    transfers = (
        db.query(Transfer)
        .filter(
            (Transfer.from_account_id.in_(user_account_ids))
            | (Transfer.to_account_id.in_(user_account_ids))
        )
        .order_by(Transfer.transfer_date.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "reference": t.reference,
            "from_account": t.from_account.name,
            "to_account": t.to_account.name,
            "amount": t.amount,
            "transfer_date": t.transfer_date.isoformat(),
            "description": t.description,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in transfers
    ]


@router.post("/", status_code=201)
def create_transfer(
    data: TransferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.from_account_id == data.to_account_id:
        raise HTTPException(400, "Cannot transfer to the same account")
    if data.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    if data.from_account_id not in user_account_ids or data.to_account_id not in user_account_ids:
        raise HTTPException(404, "One or both accounts not found")

    transfer = Transfer(
        from_account_id=data.from_account_id,
        to_account_id=data.to_account_id,
        amount=data.amount,
        transfer_date=data.transfer_date,
        description=data.description,
        reference=_next_trf_ref(db),
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return {
        "id": transfer.id,
        "reference": transfer.reference,
        "from_account": transfer.from_account.name,
        "to_account": transfer.to_account.name,
        "amount": transfer.amount,
        "transfer_date": transfer.transfer_date.isoformat(),
        "description": transfer.description,
    }


@router.delete("/{transfer_id}")
def delete_transfer(
    transfer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    t = db.query(Transfer).filter(
        Transfer.id == transfer_id,
        Transfer.from_account_id.in_(user_account_ids),
    ).first()
    if not t:
        raise HTTPException(404, "Transfer not found")
    db.delete(t)
    db.commit()
    return {"message": "Transfer deleted"}
