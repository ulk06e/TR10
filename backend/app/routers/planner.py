from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from ..models.planner import Planner as PlannerModel
from ..schemas.planner import Planner, PlannerCreate

router = APIRouter(
    prefix="/planners",
    tags=["planners"]
)

@router.post("/", response_model=Planner)
async def create_planner(planner: PlannerCreate, db: AsyncSession = Depends(get_db)):
    db_planner = PlannerModel(**planner.dict())
    db.add(db_planner)
    await db.commit()
    await db.refresh(db_planner)
    return db_planner

@router.get("/", response_model=List[Planner])
async def read_planners(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlannerModel).offset(skip).limit(limit))
    planners = result.scalars().all()
    return planners

@router.get("/{planner_id}", response_model=Planner)
async def read_planner(planner_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlannerModel).filter(PlannerModel.id == planner_id))
    planner = result.scalars().first()
    if planner is None:
        raise HTTPException(status_code=404, detail="Planner not found")
    return planner

