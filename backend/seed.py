"""
Seed script: creates the default user, accounts, and categories.
Run once: python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Ensure utf-8 stdout for Windows console
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

from database import engine, SessionLocal, Base
from models import User, Category, Account
from utils.security import hash_password
from config import settings

import models  # noqa: F401

DEFAULT_CATEGORIES = [
    # Income
    {"name": "Salary",        "type": "income",  "icon": "💼", "color": "#059669"},
    {"name": "Freelance",     "type": "income",  "icon": "💻", "color": "#10B981"},
    {"name": "Investment",    "type": "income",  "icon": "📈", "color": "#34D399"},
    {"name": "Gift",          "type": "income",  "icon": "🎁", "color": "#6EE7B7"},
    {"name": "Other Income",  "type": "income",  "icon": "💰", "color": "#A7F3D0"},
    # Expense
    {"name": "Food",          "type": "expense", "icon": "🍽️", "color": "#DC2626"},
    {"name": "Groceries",     "type": "expense", "icon": "🛒", "color": "#EF4444"},
    {"name": "Travel",        "type": "expense", "icon": "✈️", "color": "#F97316"},
    {"name": "Fuel",          "type": "expense", "icon": "⛽", "color": "#FB923C"},
    {"name": "Shopping",      "type": "expense", "icon": "🛍️", "color": "#F59E0B"},
    {"name": "Entertainment", "type": "expense", "icon": "🎬", "color": "#EAB308"},
    {"name": "Health",        "type": "expense", "icon": "💊", "color": "#84CC16"},
    {"name": "Education",     "type": "expense", "icon": "📚", "color": "#06B6D4"},
    {"name": "Bills",         "type": "expense", "icon": "📄", "color": "#6366F1"},
    {"name": "Rent",          "type": "expense", "icon": "🏠", "color": "#8B5CF6"},
    {"name": "Subscription",  "type": "expense", "icon": "📱", "color": "#EC4899"},
    {"name": "Other Expense", "type": "expense", "icon": "💸", "color": "#94A3B8"},
    # Both
    {"name": "Transfer",      "type": "both",    "icon": "🔄", "color": "#64748B"},
]


def seed():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
        if not existing:
            user = User(
                username=settings.ADMIN_USERNAME,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
            )
            db.add(user)
            db.flush()

            accounts = [
                Account(user_id=user.id, name="Bank Account", account_type="bank",    icon="🏦", color="#6366F1", opening_balance=25000.0),
                Account(user_id=user.id, name="Cash",         account_type="cash",    icon="💵", color="#059669", opening_balance=3500.0),
                Account(user_id=user.id, name="UPI / GPay",   account_type="upi",     icon="📲", color="#F97316", opening_balance=1500.0),
            ]
            db.add_all(accounts)
            print(f"[OK] Created user '{settings.ADMIN_USERNAME}' with password '{settings.ADMIN_PASSWORD}'")
        else:
            print(f"[INFO] User '{settings.ADMIN_USERNAME}' already exists")

        for cat_data in DEFAULT_CATEGORIES:
            exists = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if not exists:
                db.add(Category(**cat_data))
        db.commit()
        print("[OK] Default categories and accounts seeded successfully")
        print("[READY] Database ready! Run: uvicorn main:app --reload")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
