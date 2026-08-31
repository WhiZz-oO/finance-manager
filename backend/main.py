"""
Finance Manager — FastAPI Application Entry Point
"""

import sys
import os
import calendar

if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from contextlib import asynccontextmanager
from datetime import datetime, date as date_type

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler  # type: ignore[import-untyped]

from database import engine, SessionLocal, Base, run_integrity_check
from config import settings

import models  # noqa: F401

from routers import (
    auth, accounts, transactions, transfers,
    categories, analytics, receipts, budgets,
    backup, export,
)
from services.backup import create_backup
from seed import seed as run_seed


# ─── Scheduler ────────────────────────────────────────────────────────────────
scheduler = BackgroundScheduler()


def scheduled_backup():
    """Daily automatic backup — runs at configured hour."""
    db = SessionLocal()
    try:
        create_backup(db, backup_type="daily")
        print(f"[{datetime.now()}] [OK] Scheduled backup completed")
    except Exception as e:
        print(f"[{datetime.now()}] [ERR] Scheduled backup failed: {e}")
    finally:
        db.close()


def process_recurring_transactions():
    """
    Check recurring transactions and create any that are due today.
    Runs on startup and daily.
    """
    from datetime import date
    from models.recurring import RecurringTransaction
    from models.transaction import Transaction
    from routers.transactions import _next_reference

    db = SessionLocal()
    try:
        today = date.today()
        due = (
            db.query(RecurringTransaction)
            .filter(RecurringTransaction.is_active == True, RecurringTransaction.next_date <= today)
            .all()
        )
        for rec in due:
            txn = Transaction(
                account_id=rec.account_id,
                transaction_type=rec.transaction_type,
                amount=rec.amount,
                category_id=rec.category_id,
                merchant=rec.merchant,
                description=rec.description or f"Recurring {rec.transaction_type}",
                transaction_date=rec.next_date,
                reference=_next_reference(db),
            )
            db.add(txn)

            from datetime import date, timedelta
            freq = rec.frequency
            if freq == "daily":
                # pyrefly: ignore [bad-assignment]
                rec.next_date += timedelta(days=1)
            elif freq == "weekly":
                # pyrefly: ignore [bad-assignment]
                rec.next_date += timedelta(weeks=1)
            elif freq == "monthly":
                # Advance one month, clamping day to the last valid day of the target month
                # (e.g. Jan 31 → Feb 28/29, not an invalid Feb 31)
                month = rec.next_date.month
                year = rec.next_date.year
                new_month = (month % 12) + 1
                new_year = year + (1 if month == 12 else 0)
                last_day = calendar.monthrange(new_year, new_month)[1]
                new_day = min(rec.next_date.day, last_day)
                # pyrefly: ignore [bad-assignment]
                rec.next_date = date(new_year, new_month, new_day)
            elif freq == "yearly":
                # Clamp Feb 29 → Feb 28 in non-leap years
                last_day = calendar.monthrange(rec.next_date.year + 1, rec.next_date.month)[1]
                new_day = min(rec.next_date.day, last_day)
                # pyrefly: ignore [bad-assignment]
                rec.next_date = date(rec.next_date.year + 1, rec.next_date.month, new_day)

        if due:
            db.commit()
            print(f"[{datetime.now()}] [OK] Processed {len(due)} recurring transactions")
    except Exception as e:
        print(f"[{datetime.now()}] [ERR] Recurring transaction processing failed: {e}")
        db.rollback()
    finally:
        db.close()


# ─── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[START] Finance Manager starting...")
    Base.metadata.create_all(bind=engine)
    run_seed()

    result = run_integrity_check()
    if result["status"] == "ok":
        print("[OK] Database integrity: OK")
    else:
        print(f"[WARN] Database integrity issue: {result['details']}")

    process_recurring_transactions()

    scheduler.add_job(
        scheduled_backup,
        "cron",
        hour=settings.AUTO_BACKUP_HOUR,
        minute=settings.AUTO_BACKUP_MINUTE,
    )
    scheduler.add_job(process_recurring_transactions, "cron", hour=0, minute=5)
    scheduler.start()
    print(f"[OK] Scheduler started (daily backup at {settings.AUTO_BACKUP_HOUR:02d}:{settings.AUTO_BACKUP_MINUTE:02d})")

    yield

    scheduler.shutdown(wait=False)
    print("[STOP] Finance Manager stopped")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Finance Manager API",
    description="Personal banking-grade finance application backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(transfers.router)
app.include_router(categories.router)
app.include_router(analytics.router)
app.include_router(receipts.router)
app.include_router(budgets.router)
app.include_router(backup.router)
app.include_router(export.router)


@app.get("/")
def root():
    return {
        "app": "Finance Manager API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health():
    integrity = run_integrity_check()
    return {"status": "ok", "db_integrity": integrity["status"]}
