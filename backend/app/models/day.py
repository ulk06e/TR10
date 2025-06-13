from sqlalchemy import Column, String, DateTime, JSON, Integer
from sqlalchemy.orm import validates
from datetime import datetime
from ..database import Base
import json

class Day(Base):
    __tablename__ = "days"

    id = Column(String, primary_key=True)
    date = Column(DateTime, nullable=False)
    stats = Column(JSON, nullable=False)
    reflection = Column(String)
    sum_estimated_duration = Column(Integer, default=0)

    @validates('stats')
    def validate_stats(self, key, stats_value):
        required_fields = {
            'dayXP', 'estimated_duration', 'actual_duration',
            'number_of_tasks', 'actual_duration_with_quality',
            'average_task_quality'
        }
        
        if isinstance(stats_value, str):
            stats_dict = json.loads(stats_value)
        else:
            stats_dict = stats_value

        if not all(field in stats_dict for field in required_fields):
            raise ValueError(f"Stats must contain all required fields: {required_fields}")
            
        return stats_dict

    @validates('date')
    def validate_date(self, key, date_value):
        if isinstance(date_value, str):
            return datetime.fromisoformat(date_value)
        return date_value 