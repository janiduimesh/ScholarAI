from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.project_service import ProjectService
from app.schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectResponse
from app.models.user_model import User

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    return ProjectService.create_project(db, project_in, owner_id=current_user.id)

@router.get("/", response_model=List[ProjectResponse])
def read_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    return ProjectService.get_user_projects(db, user_id=current_user.id)

@router.get("/{project_id}", response_model=ProjectResponse)
def read_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int, 
    project_in: ProjectUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectService.update_project(db, project_id, project_in)

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    success = ProjectService.delete_project(db, project_id)
    return {"success": success, "message": "Project deleted successfully"}

# Supervisor Feedback Endpoints
@router.post("/{project_id}/feedback", response_model=ProjectResponse)
def add_feedback(
    project_id: int,
    author: str,
    text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectService.add_supervisor_feedback(db, project_id, author, text)

@router.put("/{project_id}/feedback/{feedback_id}/resolve", response_model=ProjectResponse)
def resolve_feedback(
    project_id: int,
    feedback_id: str,
    resolved: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectService.resolve_supervisor_feedback(db, project_id, feedback_id, resolved)

@router.post("/{project_id}/feedback/{feedback_id}/reply", response_model=ProjectResponse)
def add_reply(
    project_id: int,
    feedback_id: str,
    author: str,
    text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectService.add_feedback_reply(db, project_id, feedback_id, author, text)
