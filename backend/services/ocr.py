"""
OCR service using Tesseract (pytesseract + Pillow).
Extracts text from receipt images/PDFs.
"""

import re
from pathlib import Path


def extract_text(file_path: str) -> str:
    """Extract all text from an image file using Tesseract."""
    try:
        import pytesseract
        from PIL import Image

        img = Image.open(file_path)
        text = pytesseract.image_to_string(img, lang="eng")
        return text.strip()
    except ImportError:
        return "(Tesseract not installed — install pytesseract and tesseract-ocr)"
    except Exception as e:
        return f"(OCR error: {e})"


def parse_amount(text: str) -> float | None:
    """
    Try to extract a total amount from OCR text.
    Looks for patterns like: Total: 850.00 / TOTAL ₹850 / Rs. 850
    """
    patterns = [
        r"(?:total|amount|grand\s+total)[:\s₹Rs.]*([0-9,]+(?:\.[0-9]{1,2})?)",
        r"₹\s*([0-9,]+(?:\.[0-9]{1,2})?)",
        r"Rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                continue
    return None


def parse_date(text: str) -> str | None:
    """
    Try to extract a date from OCR text.
    Common formats: DD/MM/YYYY, DD-MM-YYYY, MMM DD YYYY
    """
    patterns = [
        r"(\d{2}[/\-]\d{2}[/\-]\d{4})",
        r"(\d{4}[/\-]\d{2}[/\-]\d{2})",
        r"([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return None


def parse_merchant(text: str) -> str | None:
    """Return the first non-empty line as likely merchant name."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return lines[0] if lines else None


def process_receipt(file_path: str) -> dict:
    """Full OCR pipeline — returns parsed receipt data."""
    text = extract_text(file_path)
    return {
        "ocr_text": text,
        "merchant": parse_merchant(text),
        "total_amount": parse_amount(text),
        "receipt_date": parse_date(text),
    }
