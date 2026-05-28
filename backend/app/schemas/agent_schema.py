from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AgentRunRequest(BaseModel):
    project_id: int
    agent_name: str # e.g. "topic", "literature", "gap", "methodology", "writing", "reviewer", "formatting"
    instructions: Optional[str] = None

class AgentRunResponse(BaseModel):
    success: bool
    message: str
    output: Optional[str] = None

class AgentLogResponse(BaseModel):
    id: int
    agent_name: str
    step: Optional[str] = None
    log_type: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class GeneratedSectionResponse(BaseModel):
    id: int
    section_name: str
    content: str
    version: int
    created_at: datetime
    project_id: int

    class Config:
        from_attributes = True

class SectionDiffResponse(BaseModel):
    section_name: str
    version_a: int
    version_b: int
    diff_html: str
