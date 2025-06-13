from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from ..models.item import TimeType, TaskQuality, ColumnOrigin, TimeQuality

class ItemBase(BaseModel):
    description: str
    time_type: TimeType
    task_quality: TaskQuality
    estimated_minutes: int = Field(gt=0)
    priority: int = Field(ge=1, le=10)
    column_origin: ColumnOrigin
    time_quality: TimeQuality
    project_id: str
    day_id: str

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: str
    completed: bool = False
    xp_value: int = 0
    created_time: datetime
    completed_time: Optional[datetime] = None
    actual_duration: Optional[int] = None

    class Config:
        from_attributes = True 