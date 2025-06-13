from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from ..database import get_db
from ..models.project import Project
from ..schemas.project import Project as ProjectSchema, ProjectCreate

router = APIRouter(
    prefix="/projects",
    tags=["projects"]
)

@router.get("/", response_model=List[ProjectSchema])
async def get_projects(db: AsyncSession = Depends(get_db)):
    """Get all visible projects"""
    result = await db.execute(
        select(Project)
        .where(Project.exists == True)
        .order_by(Project.name)
    )
    projects = result.scalars().all()
    return projects

@router.post("/", response_model=ProjectSchema)
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_db)):
    """Create a new project"""
    db_project = Project(
        id=str(uuid.uuid4()),
        name=project.name,
        current_xp=0,
        current_level=1,
        next_level_xp=100,
        actual_duration_sum=0,
        exists=True
    )
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project

@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete a project by setting exists=False"""
    # Don't allow deletion of system projects
    if project_id in ["all_projects", "other_projects"]:
        raise HTTPException(status_code=400, detail="Cannot delete system projects")
    
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.exists = False
    await db.commit()
    return {"message": "Project deleted successfully"}

@router.get("/system", response_model=List[ProjectSchema])
async def get_or_create_system_projects(db: AsyncSession = Depends(get_db)):
    """Get or create the mandatory system projects"""
    all_projects, other_projects = await Project.get_or_create_system_projects(db)
    return [all_projects, other_projects]

