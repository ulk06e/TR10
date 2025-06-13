from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
import uuid
from datetime import datetime

from ..database import get_db
from ..models.item import Item
from ..models.project import Project
from ..schemas.item import Item as ItemSchema, ItemCreate

router = APIRouter(
    prefix="/items",
    tags=["items"]
)

@router.post("/", response_model=ItemSchema)
async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    """Create a new item"""
    db_item = Item(
        id=str(uuid.uuid4()),
        description=item.description,
        time_type=item.time_type,
        task_quality=item.task_quality,
        estimated_minutes=item.estimated_minutes,
        priority=item.priority,
        column_origin=item.column_origin,
        time_quality=item.time_quality,
        project_id=item.project_id,
        day_id=item.day_id,
        created_time=datetime.now()
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[ItemSchema])
async def get_items(project_id: str, day_id: str, db: AsyncSession = Depends(get_db)):
    """Get items filtered by project and day"""
    query = select(Item).where(Item.project_id == project_id, Item.day_id == day_id)
    result = await db.execute(query)
    items = result.scalars().all()
    return items

@router.delete('/clean')
async def clean_db(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Item))
    await db.execute(delete(Project))
    await db.commit()
    return {"message": "Database cleaned"} 