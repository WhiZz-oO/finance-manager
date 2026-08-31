from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    file_path = Column(String, nullable=False)        # relative path under receipts dir
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=True)
    ocr_text = Column(Text, nullable=True)            # full OCR extracted text
    merchant = Column(String, nullable=True)          # parsed from OCR
    receipt_date = Column(Date, nullable=True)        # parsed from OCR
    total_amount = Column(Float, nullable=True)       # parsed from OCR
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="receipts")
