from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[str] = None
    refined_topic: Optional[str] = None
    research_gap: Optional[str] = None
    methodology: Optional[str] = None
    supervisor_feedback: Optional[str] = None # JSON string

class FeedbackComment(BaseModel):
    id: str
    author: str
    text: str
    timestamp: str
    resolved: bool = False

class ProjectResponse(ProjectBase):
    id: int
    stage: str
    created_at: datetime
    refined_topic: Optional[str] = None
    research_gap: Optional[str] = None
    methodology: Optional[str] = None
    supervisor_feedback: Optional[str] = None
    owner_id: int

    class Config:
        from_attributes = True
