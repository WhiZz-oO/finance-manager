from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    type = Column(String, nullable=False)  # income / expense / both
    icon = Column(String, default="💰")
    color = Column(String, default="#6366f1")
    is_active = Column(Boolean, default=True)

    transactions = relationship("Transaction", back_populates="category", lazy="dynamic")
    budgets = relationship("Budget", back_populates="category", lazy="dynamic")
    recurring_transactions = relationship("RecurringTransaction", back_populates="category", lazy="dynamic")
