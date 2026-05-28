from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaperBase(BaseModel):
    title: str
    authors: Optional[str] = None
    year: Optional[int] = None
    abstract: Optional[str] = None

class PaperCreate(PaperBase):
    project_id: int
    file_path: str

class PaperResponse(PaperBase):
    id: int
    file_path: str
    uploaded_at: datetime
    project_id: int

    class Config:
        from_attributes = True

class PaperChunkResponse(BaseModel):
    id: int
    chunk_index: int
    content: str
    paper_id: int

    class Config:
        from_attributes = True
