from pydantic import BaseModel
from typing import Optional

class CitationBase(BaseModel):
    key: str
    title: str
    authors: str
    venue: Optional[str] = None
    year: int
    citation_type: Optional[str] = "article"

class CitationCreate(CitationBase):
    project_id: int
    bibtex: Optional[str] = None
    apa: Optional[str] = None
    ieee: Optional[str] = None

class CitationResponse(CitationBase):
    id: int
    bibtex: Optional[str] = None
    apa: Optional[str] = None
    ieee: Optional[str] = None
    project_id: int

    class Config:
        from_attributes = True
