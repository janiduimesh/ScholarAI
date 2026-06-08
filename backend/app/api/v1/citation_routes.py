from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.project_service import ProjectService
from app.services.citation_service import CitationService
from app.schemas.citation_schema import CitationResponse
from app.models.user_model import User

router = APIRouter(tags=["citations"])

@router.get("/projects/{project_id}/citations", response_model=List[CitationResponse])
def get_citations(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return CitationService.get_citations(db, project_id)

@router.post("/projects/{project_id}/citations/verify-claims")
def verify_claims(
    project_id: int,
    draft_text: dict, # JSON containing {"text": "..."}
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    text = draft_text.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text field is required")
        
    reports = CitationService.verify_draft_claims(db, project_id, text)
    return {"reports": reports}
