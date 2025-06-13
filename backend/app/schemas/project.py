from pydantic import BaseModel

class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: str
    current_xp: int = 0
    current_level: int = 1
    next_level_xp: int = 100
    actual_duration_sum: int = 0
    exists: bool = True

    class Config:
        from_attributes = True

