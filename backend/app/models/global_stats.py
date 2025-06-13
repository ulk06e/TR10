from sqlalchemy import Column, Integer, Float, String, DateTime, JSON
from sqlalchemy.orm import validates
from ..database import Base
import json

class GlobalStats(Base):
    __tablename__ = "global_stats"

    id = Column(Integer, primary_key=True)
    total_xp = Column(Integer, default=0)
    current_level = Column(Integer, default=1)
    next_level_xp = Column(Integer, default=100)
    streak = Column(Integer, default=0)
    highest_day_xp = Column(Integer, default=0)
    most_work_time_in_day = Column(Integer, default=0)
    highest_task_xp = Column(Integer, default=0)
    first_completed_task_date = Column(DateTime)

    # Weekly aggregations
    weekly_average_daily_xp = Column(Float, default=0.0)
    weekly_average_task_duration = Column(Float, default=0.0)
    weekly_most_used_project_id = Column(String)
    weekly_pure_time_ratio = Column(Float, default=0.0)
    weekly_day_with_max_tasks = Column(String)
    weekly_completion_rate = Column(Float, default=0.0)
    weekly_task_quality_distribution = Column(JSON)
    weekly_xp_per_quality_level = Column(JSON)

    # Monthly aggregations
    monthly_average_daily_xp = Column(Float, default=0.0)
    monthly_average_task_duration = Column(Float, default=0.0)
    monthly_most_used_project_id = Column(String)
    monthly_pure_time_ratio = Column(Float, default=0.0)
    monthly_day_with_max_tasks = Column(String)
    monthly_completion_rate = Column(Float, default=0.0)
    monthly_task_quality_distribution = Column(JSON)
    monthly_xp_per_quality_level = Column(JSON)

    # Yearly aggregations
    yearly_average_daily_xp = Column(Float, default=0.0)
    yearly_average_task_duration = Column(Float, default=0.0)
    yearly_most_used_project_id = Column(String)
    yearly_pure_time_ratio = Column(Float, default=0.0)
    yearly_day_with_max_tasks = Column(String)
    yearly_completion_rate = Column(Float, default=0.0)
    yearly_task_quality_distribution = Column(JSON)
    yearly_xp_per_quality_level = Column(JSON)

    @validates('weekly_task_quality_distribution', 'monthly_task_quality_distribution', 
              'yearly_task_quality_distribution')
    def validate_quality_distribution(self, key, value):
        if isinstance(value, str):
            value = json.loads(value)
        
        required_keys = {'A', 'B', 'C', 'D'}
        if not all(k in value for k in required_keys):
            raise ValueError(f"Quality distribution must contain all quality levels: {required_keys}")
        
        return value

    @validates('weekly_xp_per_quality_level', 'monthly_xp_per_quality_level', 
              'yearly_xp_per_quality_level')
    def validate_xp_per_quality(self, key, value):
        if isinstance(value, str):
            value = json.loads(value)
        
        required_keys = {'A', 'B', 'C', 'D'}
        if not all(k in value for k in required_keys):
            raise ValueError(f"XP per quality level must contain all quality levels: {required_keys}")
        
        return value

    def calculate_next_level_xp(self):
        """Calculate XP needed for next level based on current level"""
        return self.current_level * 100

    def add_xp(self, xp_amount):
        """Add XP and handle level progression"""
        self.total_xp += xp_amount
        
        while self.total_xp >= self.next_level_xp:
            self.current_level += 1
            self.next_level_xp = self.calculate_next_level_xp() 