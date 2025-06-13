from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import validates
from ..database import Base
import enum

class TimeType(enum.Enum):
    TO_GOAL = 'to-goal'
    TO_TIME = 'to-time'

class TaskQuality(enum.Enum):
    A = 'A'
    B = 'B'
    C = 'C'
    D = 'D'

class ColumnOrigin(enum.Enum):
    PLAN = 'plan'
    FACT = 'fact'

class TimeQuality(enum.Enum):
    PURE = 'pure'
    NOT_PURE = 'not-pure'

class Item(Base):
    __tablename__ = "items"

    id = Column(String, primary_key=True)
    description = Column(String, nullable=False)
    time_type = Column(Enum(TimeType), nullable=False)
    task_quality = Column(Enum(TaskQuality), nullable=False)
    estimated_minutes = Column(Integer, nullable=False)
    priority = Column(Integer, nullable=False)
    completed = Column(Boolean, default=False)
    column_origin = Column(Enum(ColumnOrigin), nullable=False)
    xp_value = Column(Integer, default=0)
    created_time = Column(DateTime, nullable=False)
    completed_time = Column(DateTime)
    actual_duration = Column(Integer)
    time_quality = Column(Enum(TimeQuality), nullable=False)
    project_id = Column(String, ForeignKey('projects.id'), nullable=False)
    day_id = Column(String, ForeignKey('days.id'), nullable=False)

    @validates('priority')
    def validate_priority(self, key, value):
        if not 1 <= value <= 10:
            raise ValueError("Priority must be between 1 and 10")
        return value

    @validates('estimated_minutes')
    def validate_estimated_minutes(self, key, value):
        if value <= 0:
            raise ValueError("Estimated minutes must be positive")
        return value

    def calculate_xp(self):
        if not self.completed or not self.actual_duration:
            return 0

        # Base XP: 1 XP per 10 minutes
        base_xp = self.actual_duration // 10

        # Quality multiplier
        quality_multipliers = {'A': 4, 'B': 3, 'C': 2, 'D': 1}
        quality_multiplier = quality_multipliers[self.task_quality.value]

        # Time quality multiplier
        time_quality_multiplier = 1.5 if self.time_quality == TimeQuality.PURE else 1.0

        # Priority multiplier
        priority_multipliers = {1: 1.5, 2: 1.4, 3: 1.3}
        priority_multiplier = priority_multipliers.get(self.priority, 1.0)

        # Time estimation accuracy multiplier
        time_diff_ratio = abs(self.actual_duration - self.estimated_minutes) / self.estimated_minutes
        accuracy_multiplier = 1.0 if time_diff_ratio <= 0.2 else 0.7

        total_xp = int(base_xp * quality_multiplier * time_quality_multiplier * 
                      priority_multiplier * accuracy_multiplier)
        
        return total_xp 