from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PlannerBase(BaseModel):
    plan_name: str
    fact_name: Optional[str] = None

class PlannerCreate(PlannerBase):
    pass

class Planner(PlannerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

