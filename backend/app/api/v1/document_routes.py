from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.project_service import ProjectService
from app.repositories.project_repository import ProjectRepository
from app.schemas.agent_schema import GeneratedSectionResponse, SectionDiffResponse
from app.utils.diff_engine import compute_word_diff
from app.models.user_model import User

router = APIRouter(tags=["documents"])

@router.get("/projects/{project_id}/sections", response_model=List[GeneratedSectionResponse])
def get_sections(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectRepository.get_sections_list(db, project_id)

@router.get("/projects/{project_id}/sections/{section_name}", response_model=GeneratedSectionResponse)
def get_section(
    project_id: int, 
    section_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    section = ProjectRepository.get_latest_section(db, project_id, section_name)
    if not section:
        raise HTTPException(status_code=404, detail=f"No draft found for section '{section_name}'")
    return section

@router.post("/projects/{project_id}/sections", response_model=GeneratedSectionResponse)
def save_section_draft(
    project_id: int,
    section_payload: dict, # {"section_name": "...", "content": "..."}
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    sec_name = section_payload.get("section_name")
    content = section_payload.get("content")
    
    if not sec_name or content is None:
        raise HTTPException(status_code=400, detail="section_name and content are required")
        
    return ProjectRepository.create_section_version(db, project_id, sec_name, content)

@router.get("/projects/{project_id}/sections/{section_name}/diff", response_model=SectionDiffResponse)
def get_section_diff(
    project_id: int,
    section_name: str,
    v_a: int,
    v_b: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    sec_a = ProjectRepository.get_section_version(db, project_id, section_name, v_a)
    sec_b = ProjectRepository.get_section_version(db, project_id, section_name, v_b)
    
    if not sec_a or not sec_b:
        raise HTTPException(status_code=404, detail="One or both versions not found")

    diff_html = compute_word_diff(sec_a.content, sec_b.content)
    
    return {
        "section_name": section_name,
        "version_a": v_a,
        "version_b": v_b,
        "diff_html": diff_html
    }
