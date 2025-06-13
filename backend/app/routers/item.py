from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Dict, Any
import uuid
from datetime import datetime

from ..database import get_db
from ..models.item import Item, TimeQuality, ColumnOrigin
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

@router.put("/{item_id}", response_model=ItemSchema)
async def update_item(item_id: str, item_update: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    """Update an item"""
    try:
        # Find the item
        query = select(Item).where(Item.id == item_id)
        result = await db.execute(query)
        db_item = result.scalar_one_or_none()
        
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Update only allowed fields
        allowed_fields = {
            'completed', 'actual_duration', 'time_quality', 
            'completed_time', 'column_origin'
        }
        
        for key, value in item_update.items():
            if key in allowed_fields:
                if key == 'time_quality':
                    value = TimeQuality(value)
                elif key == 'column_origin':
                    value = ColumnOrigin(value)
                elif key == 'completed_time' and value:
                    value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                setattr(db_item, key, value)
        
        await db.commit()
        await db.refresh(db_item)
        return db_item
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/clean')
async def clean_db(db: AsyncSession = Depends(get_db)):
    try:
        # Delete all items
        await db.execute(delete(Item))
        # Delete all projects
        await db.execute(delete(Project))
        await db.commit()
        return {"message": "Database cleaned successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{item_id}")
async def delete_item(item_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an item by ID"""
    try:
        # Find the item
        query = select(Item).where(Item.id == item_id)
        result = await db.execute(query)
        db_item = result.scalar_one_or_none()
        
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Delete the item
        await db.delete(db_item)
        await db.commit()
        return {"message": "Item deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 