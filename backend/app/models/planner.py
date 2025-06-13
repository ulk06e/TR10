from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Planner(Base):
    __tablename__ = "planners"

    id = Column(Integer, primary_key=True, index=True)
    plan_name = Column(String, index=True)
    fact_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

