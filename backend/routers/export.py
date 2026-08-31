from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import io

from database import get_db
from models.user import User
from routers.auth import get_current_user
from services.export import generate_excel

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/excel")
def export_excel(
    month: int = Query(default=datetime.now().month, ge=1, le=12),
    year: int = Query(default=datetime.now().year),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    xlsx_bytes = generate_excel(db, month=month, year=year)
    filename = f"Finance_{datetime.now().strftime('%B_%Y')}.xlsx"
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
