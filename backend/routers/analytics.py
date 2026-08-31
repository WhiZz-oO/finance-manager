from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime

from database import get_db
from models.user import User
from routers.auth import get_current_user
from services import analytics as svc

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return svc.get_summary(db, start_date, end_date)


@router.get("/monthly")
def get_monthly(
    year: int = Query(default=datetime.now().year),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return svc.get_monthly_analytics(db, year)


@router.get("/weekly")
def get_weekly(
    year: int = Query(default=datetime.now().year),
    month: int = Query(default=datetime.now().month),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return svc.get_weekly_analytics(db, year, month)


@router.get("/by-category")
def get_by_category(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return svc.get_category_breakdown(db, start_date, end_date)


@router.get("/cash-flow")
def get_cash_flow(
    months: int = Query(default=6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return svc.get_cash_flow(db, months)
