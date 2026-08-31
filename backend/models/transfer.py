from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transfer_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    reference = Column(String, unique=True, index=True)   # TRF-000001
    created_at = Column(DateTime, default=datetime.utcnow)

    from_account = relationship("Account", foreign_keys=[from_account_id], back_populates="transfers_out")
    to_account = relationship("Account", foreign_keys=[to_account_id], back_populates="transfers_in")
