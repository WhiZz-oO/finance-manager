from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from database import get_db
from models.budget import Budget
from models.category import Category
from models.transaction import Transaction
from models.user import User
from routers.auth import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


class BudgetCreate(BaseModel):
    category_id: int
    period: str   # monthly / weekly / yearly
    year: int
    month: Optional[int] = None
    limit_amount: float


class BudgetUpdate(BaseModel):
    limit_amount: Optional[float] = None
    period: Optional[str] = None


def _budget_with_spent(b: Budget, db: Session) -> dict:
    cat = db.query(Category).filter(Category.id == b.category_id).first()
    # Calculate spent amount
    q = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.category_id == b.category_id,
            Transaction.transaction_type == "expense",
            Transaction.is_deleted == False,
        )
    )
    if b.period == "monthly" and b.month:
        q = q.filter(
            func.strftime("%Y", Transaction.transaction_date) == str(b.year),
            func.strftime("%m", Transaction.transaction_date) == f"{b.month:02d}",
        )
    elif b.period == "yearly":
        q = q.filter(
            func.strftime("%Y", Transaction.transaction_date) == str(b.year),
        )

    spent = q.scalar() or 0.0
    remaining = b.limit_amount - spent
    pct = round(spent / b.limit_amount * 100, 1) if b.limit_amount > 0 else 0

    return {
        "id": b.id,
        "category_id": b.category_id,
        "category_name": cat.name if cat else None,
        "category_icon": cat.icon if cat else None,
        "category_color": cat.color if cat else None,
        "period": b.period,
        "year": b.year,
        "month": b.month,
        "limit_amount": b.limit_amount,
        "spent": round(spent, 2),
        "remaining": round(remaining, 2),
        "percentage_used": pct,
        "is_over_budget": spent > b.limit_amount,
    }


@router.get("/")
def list_budgets(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Budget).filter(Budget.user_id == current_user.id)
    if year:
        q = q.filter(Budget.year == year)
    if month:
        q = q.filter(Budget.month == month)
    return [_budget_with_spent(b, db) for b in q.all()]


@router.post("/", status_code=201)
def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = Budget(
        user_id=current_user.id,
        category_id=data.category_id,
        period=data.period,
        year=data.year,
        month=data.month,
        limit_amount=data.limit_amount,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _budget_with_spent(budget, db)


@router.patch("/{budget_id}")
def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(404, "Budget not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(b, field, val)
    b.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(b)
    return _budget_with_spent(b, db)


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(404, "Budget not found")
    db.delete(b)
    db.commit()
    return {"message": "Budget deleted"}
