from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from database import get_db
from models.transaction import Transaction
from models.account import Account
from models.category import Category
from models.user import User
from routers.auth import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

_counter: dict = {}


def _next_reference(db: Session) -> str:
    last = (
        db.query(Transaction)
        .filter(Transaction.reference.like("TXN-%"))
        .order_by(Transaction.id.desc())
        .first()
    )
    if last and last.reference:
        try:
            n = int(last.reference.split("-")[1]) + 1
        except Exception:
            n = 1
    else:
        n = 1
    return f"TXN-{n:06d}"


def _txn_to_dict(txn: Transaction, db: Session) -> dict:
    cat = db.query(Category).filter(Category.id == txn.category_id).first() if txn.category_id else None
    acc = db.query(Account).filter(Account.id == txn.account_id).first()
    return {
        "id": txn.id,
        "reference": txn.reference,
        "account_id": txn.account_id,
        "account_name": acc.name if acc else None,
        "transaction_type": txn.transaction_type,
        "amount": txn.amount,
        "category_id": txn.category_id,
        "category_name": cat.name if cat else None,
        "category_icon": cat.icon if cat else None,
        "merchant": txn.merchant,
        "description": txn.description,
        "transaction_date": txn.transaction_date.isoformat() if txn.transaction_date else None,
        "notes": txn.notes,
        "created_at": txn.created_at.isoformat() if txn.created_at else None,
    }


class TransactionCreate(BaseModel):
    account_id: int
    transaction_type: str  # income / expense / refund
    amount: float
    category_id: Optional[int] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: date
    notes: Optional[str] = None


class TransactionUpdate(BaseModel):
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    category_id: Optional[int] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    notes: Optional[str] = None


@router.get("/")
def list_transactions(
    account_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get account IDs for this user
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    q = db.query(Transaction).filter(
        Transaction.account_id.in_(user_account_ids),
        Transaction.is_deleted == False,
    )
    if account_id:
        q = q.filter(Transaction.account_id == account_id)
    if transaction_type:
        q = q.filter(Transaction.transaction_type == transaction_type)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if start_date:
        q = q.filter(Transaction.transaction_date >= start_date)
    if end_date:
        q = q.filter(Transaction.transaction_date <= end_date)
    if search:
        q = q.filter(
            (Transaction.merchant.ilike(f"%{search}%"))
            | (Transaction.description.ilike(f"%{search}%"))
            | (Transaction.reference.ilike(f"%{search}%"))
        )

    total = q.count()
    txns = q.order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "items": [_txn_to_dict(t, db) for t in txns],
    }


@router.post("/", status_code=201)
def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate account belongs to user
    acc = db.query(Account).filter(
        Account.id == data.account_id, Account.user_id == current_user.id
    ).first()
    if not acc:
        raise HTTPException(404, "Account not found")

    if data.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    txn = Transaction(
        account_id=data.account_id,
        transaction_type=data.transaction_type,
        amount=data.amount,
        category_id=data.category_id,
        merchant=data.merchant,
        description=data.description,
        transaction_date=data.transaction_date,
        notes=data.notes,
        reference=_next_reference(db),
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _txn_to_dict(txn, db)


@router.get("/{txn_id}")
def get_transaction(
    txn_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.account_id.in_(user_account_ids),
        Transaction.is_deleted == False,
    ).first()
    if not txn:
        raise HTTPException(404, "Transaction not found")
    return _txn_to_dict(txn, db)


@router.patch("/{txn_id}")
def update_transaction(
    txn_id: int,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.account_id.in_(user_account_ids),
        Transaction.is_deleted == False,
    ).first()
    if not txn:
        raise HTTPException(404, "Transaction not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(txn, field, val)
    txn.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(txn)
    return _txn_to_dict(txn, db)


@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.account_id.in_(user_account_ids),
        Transaction.is_deleted == False,
    ).first()
    if not txn:
        raise HTTPException(404, "Transaction not found")
    txn.is_deleted = True
    db.commit()
    return {"message": "Transaction deleted"}
