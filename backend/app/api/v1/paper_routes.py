from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.paper_service import PaperService
from app.services.project_service import ProjectService
from app.schemas.paper_schema import PaperResponse
from app.models.user_model import User

router = APIRouter(tags=["papers"])

@router.post("/projects/{project_id}/papers", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
def upload_paper(
    project_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        db_paper = PaperService.upload_and_process_paper(db, project_id, file)
        return db_paper
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@router.get("/projects/{project_id}/papers", response_model=List[PaperResponse])
def get_project_papers(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return PaperService.get_project_papers(db, project_id)

@router.delete("/papers/{paper_id}")
def delete_paper(
    paper_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    from app.repositories.paper_repository import PaperRepository
    paper = PaperRepository.get_by_id(db, paper_id)
    if not paper:
         raise HTTPException(status_code=404, detail="Paper reference not found")
         
    project = ProjectService.get_project(db, paper.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this project")
         
    success = PaperService.delete_paper(db, paper_id)
    return {"success": success, "message": "Paper and its vector index deleted successfully"}
