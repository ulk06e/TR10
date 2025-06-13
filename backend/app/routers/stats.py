from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from ..database import get_db
from ..models.day import Day
from ..models.global_stats import GlobalStats

router = APIRouter(
    prefix="/stats",
    tags=["stats"]
)

@router.get("/day")
async def get_day_stats(
    project_id: str,
    date: str,
    db: AsyncSession = Depends(get_db)
):
    """Get stats for a specific day and project"""
    try:
        date_obj = datetime.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Get or create day record
    day_id = f"{date_obj.strftime('%Y-%m-%d')}_{project_id}"
    result = await db.execute(select(Day).where(Day.id == day_id))
    day = result.scalars().first()

    if not day:
        # Return default stats if no record exists
        return {
            "dayXP": 0,
            "actual_duration": 0,
            "streak": 0
        }

    # Get global stats for streak
    result = await db.execute(select(GlobalStats).order_by(GlobalStats.id.desc()).limit(1))
    global_stats = result.scalars().first()
    streak = global_stats.streak if global_stats else 0

    return {
        "dayXP": day.stats.get("dayXP", 0),
        "actual_duration": day.stats.get("actual_duration", 0),
        "streak": streak
    } 