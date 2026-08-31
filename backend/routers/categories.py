from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.category import Category
from models.user import User
from routers.auth import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])

CATEGORY_ICONS = {
    "Food": "🍽️", "Travel": "✈️", "Shopping": "🛍️",
    "Education": "📚", "Bills": "📄", "Entertainment": "🎬",
    "Health": "💊", "Salary": "💼", "Freelance": "💻",
    "Investment": "📈", "Rent": "🏠", "Fuel": "⛽",
    "Groceries": "🛒", "Subscription": "📱", "Other": "💰",
}


class CategoryCreate(BaseModel):
    name: str
    type: str  # income / expense / both
    icon: Optional[str] = None
    color: Optional[str] = "#6366f1"


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


def _cat_to_dict(c: Category) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "type": c.type,
        "icon": c.icon,
        "color": c.color,
        "is_active": c.is_active,
    }


@router.get("/")
def list_categories(
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Category).filter(Category.is_active == True)
    if type:
        q = q.filter((Category.type == type) | (Category.type == "both"))
    return [_cat_to_dict(c) for c in q.order_by(Category.name).all()]


@router.post("/", status_code=201)
def create_category(
    data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Category).filter(Category.name == data.name).first()
    if existing:
        raise HTTPException(400, "Category already exists")
    cat = Category(
        name=data.name,
        type=data.type,
        icon=data.icon or CATEGORY_ICONS.get(data.name, "💰"),
        color=data.color,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _cat_to_dict(cat)


@router.patch("/{cat_id}")
def update_category(
    cat_id: int,
    data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(cat, field, val)
    db.commit()
    db.refresh(cat)
    return _cat_to_dict(cat)


@router.delete("/{cat_id}")
def delete_category(
    cat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    cat.is_active = False
    db.commit()
    return {"message": "Category deactivated"}
