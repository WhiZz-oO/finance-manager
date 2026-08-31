from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    transaction_type = Column(String, nullable=False)  # income/expense/refund
    amount = Column(Float, nullable=False)             # always positive
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    merchant = Column(String, nullable=True)
    description = Column(String, nullable=True)
    transaction_date = Column(Date, nullable=False)
    reference = Column(String, unique=True, index=True)  # TXN-000001
    notes = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)          # soft delete
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    receipts = relationship("Receipt", back_populates="transaction", lazy="dynamic")
