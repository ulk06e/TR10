from sqlalchemy import Column, String, Integer, Boolean
from ..database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    current_xp = Column(Integer, default=0)
    current_level = Column(Integer, default=1)
    next_level_xp = Column(Integer, default=100)  # Level 1 * 100
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

    def calculate_next_level_xp(self):
        """Calculate XP needed for next level based on current level"""
        return self.current_level * 100

    def add_xp(self, xp_amount):
        """Add XP and handle level progression"""
        self.current_xp += xp_amount
        
        while self.current_xp >= self.next_level_xp:
            self.current_level += 1
            self.next_level_xp = self.calculate_next_level_xp()

    def add_duration(self, duration):
        """Add duration to the total sum"""
        self.actual_duration_sum += duration
