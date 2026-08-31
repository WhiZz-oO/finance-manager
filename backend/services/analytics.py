"""
Analytics service — all financial calculations derived from transactions.
Balance is always computed, never stored.
"""

from datetime import date, timedelta
from sqlalchemy import func, extract, case
from sqlalchemy.orm import Session

from models.transaction import Transaction
from models.transfer import Transfer
from models.account import Account
from models.category import Category


def get_account_balance(account_id: int, db: Session, as_of: date = None) -> float:
    """
    Compute account balance from:
      opening_balance
      + all income/refund transactions
      - all expense transactions
      + transfers_in
      - transfers_out
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return 0.0

    balance = account.opening_balance

    q = db.query(Transaction).filter(
        Transaction.account_id == account_id,
        Transaction.is_deleted == False,
    )
    if as_of:
        q = q.filter(Transaction.transaction_date <= as_of)

    for txn in q.all():
        if txn.transaction_type in ("income", "refund"):
            balance += txn.amount
        elif txn.transaction_type == "expense":
            balance -= txn.amount

    # Transfers out
    tq_out = db.query(Transfer).filter(Transfer.from_account_id == account_id)
    if as_of:
        tq_out = tq_out.filter(Transfer.transfer_date <= as_of)
    balance -= sum(t.amount for t in tq_out.all())

    # Transfers in
    tq_in = db.query(Transfer).filter(Transfer.to_account_id == account_id)
    if as_of:
        tq_in = tq_in.filter(Transfer.transfer_date <= as_of)
    balance += sum(t.amount for t in tq_in.all())

    return round(balance, 2)


def get_summary(db: Session, start_date: date = None, end_date: date = None) -> dict:
    """Total income, expenses, net for a period."""
    q = db.query(Transaction).filter(Transaction.is_deleted == False)
    if start_date:
        q = q.filter(Transaction.transaction_date >= start_date)
    if end_date:
        q = q.filter(Transaction.transaction_date <= end_date)

    total_income = 0.0
    total_expense = 0.0
    for txn in q.all():
        if txn.transaction_type in ("income", "refund"):
            total_income += txn.amount
        elif txn.transaction_type == "expense":
            total_expense += txn.amount

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net": round(total_income - total_expense, 2),
        "savings_rate": round(
            (total_income - total_expense) / total_income * 100 if total_income > 0 else 0, 1
        ),
    }


def get_monthly_analytics(db: Session, year: int) -> list:
    """Income and expenses grouped by month for a given year."""
    results = []
    for month in range(1, 13):
        start = date(year, month, 1)
        if month == 12:
            end = date(year, 12, 31)
        else:
            end = date(year, month + 1, 1) - timedelta(days=1)

        summary = get_summary(db, start, end)
        results.append(
            {
                "month": month,
                "month_name": start.strftime("%b"),
                **summary,
            }
        )
    return results


def get_weekly_analytics(db: Session, year: int, month: int) -> list:
    """Income and expenses grouped by week within a month."""
    start = date(year, month, 1)
    if month == 12:
        end = date(year, 12, 31)
    else:
        end = date(year, month + 1, 1) - timedelta(days=1)

    results = []
    current = start
    week_num = 1
    while current <= end:
        week_end = min(current + timedelta(days=6), end)
        summary = get_summary(db, current, week_end)
        results.append(
            {
                "week": week_num,
                "start": current.isoformat(),
                "end": week_end.isoformat(),
                **summary,
            }
        )
        current = week_end + timedelta(days=1)
        week_num += 1
    return results


def get_category_breakdown(db: Session, start_date: date = None, end_date: date = None) -> list:
    """Expense totals per category for a period."""
    q = (
        db.query(Category.name, Category.icon, Category.color, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.transaction_type == "expense",
            Transaction.is_deleted == False,
        )
    )
    if start_date:
        q = q.filter(Transaction.transaction_date >= start_date)
    if end_date:
        q = q.filter(Transaction.transaction_date <= end_date)

    rows = q.group_by(Category.id).order_by(func.sum(Transaction.amount).desc()).all()
    total = sum(r.total for r in rows)
    return [
        {
            "category": r.name,
            "icon": r.icon,
            "color": r.color,
            "amount": round(r.total, 2),
            "percentage": round(r.total / total * 100, 1) if total > 0 else 0,
        }
        for r in rows
    ]


def get_cash_flow(db: Session, months: int = 6) -> list:
    """Net cash flow for the last N months."""
    today = date.today()
    results = []
    for i in range(months - 1, -1, -1):
        # Go back i months
        if today.month - i <= 0:
            m = today.month - i + 12
            y = today.year - 1
        else:
            m = today.month - i
            y = today.year
        start = date(y, m, 1)
        if m == 12:
            end = date(y, 12, 31)
        else:
            end = date(y, m + 1, 1) - timedelta(days=1)
        summary = get_summary(db, start, end)
        results.append(
            {
                "month": start.strftime("%b %Y"),
                **summary,
            }
        )
    return results
