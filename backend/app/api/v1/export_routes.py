import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.project_service import ProjectService
from app.services.export_service import ExportService
from app.schemas.export_schema import ExportRequest, ExportResponse
from app.models.user_model import User

router = APIRouter(tags=["exports"])

@router.post("/export", response_model=ExportResponse)
def export_document(
    request: ExportRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, request.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        if request.format.lower() == "docx":
            file_path = ExportService.export_as_docx(db, request.project_id, request.citation_style)
        else: # html default
            file_path = ExportService.export_as_html(db, request.project_id, request.citation_style)
            
        filename = os.path.basename(file_path)
        
        # We can construct the download URL pointing to our download endpoint
        download_url = f"/api/v1/download/{filename}"
        
        return {
            "success": True,
            "download_url": download_url,
            "filename": filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/download/{filename}")
def download_file(filename: str):
    """
    Serves exported documents from disk as a download file response.
    """
    from app.config import settings
    
    # Secure filename from path traversal
    from app.utils.file_utils import secure_filename
    safe_name = secure_filename(filename)
    
    file_path = os.path.join(settings.DOCS_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Export file not found")
        
    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=safe_name
    )
