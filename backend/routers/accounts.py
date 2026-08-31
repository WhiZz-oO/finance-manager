from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from models.account import Account
from models.user import User
from routers.auth import get_current_user
from services.analytics import get_account_balance

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


class AccountCreate(BaseModel):
    name: str
    account_type: str
    currency: str = "INR"
    opening_balance: float = 0.0
    color: str = "#6366f1"
    icon: str = "🏦"


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


def _account_to_dict(acc: Account, db: Session) -> dict:
    balance = get_account_balance(acc.id, db)
    return {
        "id": acc.id,
        "name": acc.name,
        "account_type": acc.account_type,
        "currency": acc.currency,
        "opening_balance": acc.opening_balance,
        "balance": balance,
        "is_active": acc.is_active,
        "color": acc.color,
        "icon": acc.icon,
        "created_at": acc.created_at.isoformat() if acc.created_at else None,
    }


@router.get("/")
def list_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accounts = (
        db.query(Account)
        .filter(Account.user_id == current_user.id, Account.is_active == True)
        .order_by(Account.created_at)
        .all()
    )
    return [_account_to_dict(a, db) for a in accounts]


@router.post("/", status_code=201)
def create_account(
    data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    acc = Account(
        user_id=current_user.id,
        name=data.name,
        account_type=data.account_type,
        currency=data.currency,
        opening_balance=data.opening_balance,
        color=data.color,
        icon=data.icon,
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return _account_to_dict(acc, db)


@router.get("/{account_id}")
def get_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(404, "Account not found")
    return _account_to_dict(acc, db)


@router.patch("/{account_id}")
def update_account(
    account_id: int,
    data: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(404, "Account not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(acc, field, val)
    acc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(acc)
    return _account_to_dict(acc, db)


@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(404, "Account not found")
    acc.is_active = False
    db.commit()
    return {"message": "Account deactivated"}
