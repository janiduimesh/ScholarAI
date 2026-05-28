import os
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.config import settings
from app.repositories.paper_repository import PaperRepository
from app.services.pdf_service import PdfService
from app.services.vector_service import VectorService
from app.schemas.paper_schema import PaperCreate
from app.models.paper_model import Paper

class PaperService:
    @staticmethod
    def upload_and_process_paper(db: Session, project_id: int, file: UploadFile) -> Paper:
        """
        Saves uploaded file to disk, parses text, populates database, and runs chunk indexer.
        """
        # Save file to disk
        filename = f"{project_id}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        try:
            # Parse text and metadata
            parsed = PdfService.extract_text_and_metadata(file_path)
            
            # Create Paper DB record
            paper_in = PaperCreate(
                title=parsed["title"],
                authors=parsed["authors"],
                year=parsed["year"],
                abstract=parsed["abstract"],
                project_id=project_id,
                file_path=file_path
            )
            db_paper = PaperRepository.create(db, paper_in)
            
            # Chunk and Index Paper text
            VectorService.chunk_and_index_paper(db, db_paper.id, parsed["text"])
            
            return db_paper
            
        except Exception as e:
            # Clean up file on failure
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e

    @staticmethod
    def get_project_papers(db: Session, project_id: int):
        return PaperRepository.get_by_project(db, project_id)

    @staticmethod
    def delete_paper(db: Session, paper_id: int) -> bool:
        paper = PaperRepository.get_by_id(db, paper_id)
        if paper:
            # Delete physical file
            if os.path.exists(paper.file_path):
                try:
                    os.remove(paper.file_path)
                except Exception:
                    pass
            # Delete DB record (cascade deletes chunks)
            return PaperRepository.delete(db, paper_id)
        return False
