import math
from sqlalchemy import Column, String, Integer, Boolean
from ..database import Base

# Constants for XP/level calculation
XP_BASE = 300     # Base XP to start leveling
XP_GROWTH = 1.15  # How much harder each level gets
XP_ROUND_TO = 100 # Rounding factor

def xp_required_for_level(level: int) -> int:
    """
    Returns the total cumulative XP required to reach a given level.
    XP is rounded up to the nearest 100 for user clarity.
    """
    raw_xp = XP_BASE * (XP_GROWTH ** level - 1)
    return int(math.ceil(raw_xp / XP_ROUND_TO) * XP_ROUND_TO)

def xp_to_level(total_xp: int) -> int:
    """
    Calculates the current level from total XP.
    This is the inverse of the cumulative XP function, ignoring rounding.
    """
    level = math.log(1 + total_xp / XP_BASE, XP_GROWTH)
    return int(level)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    current_xp = Column(Integer, default=0)
    current_level = Column(Integer, default=1)
    next_level_xp = Column(Integer, default=300)
    actual_duration_sum = Column(Integer, default=0)
    exists = Column(Boolean, default=True)  # If false, project won't be visible in frontend

    @classmethod
    async def get_or_create_system_projects(cls, db):
        """Create or get the mandatory system projects"""
        all_projects = await db.get(cls, "all_projects")
        if not all_projects:
            all_projects = cls(
                id="all_projects",
                name="All Projects",
                exists=True
            )
            db.add(all_projects)

        other_projects = await db.get(cls, "other_projects")
        if not other_projects:
            other_projects = cls(
                id="other_projects",
                name="Other Projects",
                exists=True
            )
            db.add(other_projects)
        
        await db.commit()
        return all_projects, other_projects

    def update_level_and_xp(self):
        """
        Update the project's level and next_level_xp based on current_xp using the new formula.
        """
        self.current_level = xp_to_level(self.current_xp)
        self.next_level_xp = xp_required_for_level(self.current_level + 1)

    def add_xp(self, xp_amount):
        """
        Add XP and handle level progression using the new formula.
        """
        self.current_xp += xp_amount
        self.update_level_and_xp()

    def add_duration(self, duration):
        """
        Add duration to the total sum
        """
        self.actual_duration_sum += duration
