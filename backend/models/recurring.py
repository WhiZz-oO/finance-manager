from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    transaction_type = Column(String, nullable=False)   # income / expense
    amount = Column(Float, nullable=False)
    merchant = Column(String, nullable=True)
    description = Column(String, nullable=True)
    frequency = Column(String, nullable=False)          # daily / weekly / monthly / yearly
    next_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("Account", back_populates="recurring_transactions")
    category = relationship("Category", back_populates="recurring_transactions")
