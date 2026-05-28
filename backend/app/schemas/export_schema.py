from pydantic import BaseModel
from typing import Optional

class ExportRequest(BaseModel):
    project_id: int
    format: str = "html" # html, docx, txt
    citation_style: str = "ieee" # ieee, apa

class ExportResponse(BaseModel):
    success: bool
    download_url: str
    filename: str
