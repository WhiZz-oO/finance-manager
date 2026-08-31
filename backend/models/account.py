from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)  # bank/cash/upi/savings/credit/wallet
    currency = Column(String, default="INR")
    opening_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    color = Column(String, default="#6366f1")     # hex color for card
    icon = Column(String, default="🏦")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", lazy="dynamic")
    transfers_out = relationship(
        "Transfer", foreign_keys="Transfer.from_account_id", back_populates="from_account", lazy="dynamic"
    )
    transfers_in = relationship(
        "Transfer", foreign_keys="Transfer.to_account_id", back_populates="to_account", lazy="dynamic"
    )
    recurring_transactions = relationship("RecurringTransaction", back_populates="account", lazy="dynamic")
