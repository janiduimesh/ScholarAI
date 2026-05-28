from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.paper_model import Paper
from app.models.paper_chunk_model import PaperChunk
from app.schemas.paper_schema import PaperCreate

class PaperRepository:
    @staticmethod
    def get_by_id(db: Session, paper_id: int) -> Optional[Paper]:
        return db.query(Paper).filter(Paper.id == paper_id).first()

    @staticmethod
    def get_by_project(db: Session, project_id: int) -> List[Paper]:
        return db.query(Paper).filter(Paper.project_id == project_id).all()

    @staticmethod
    def create(db: Session, paper_in: PaperCreate) -> Paper:
        db_paper = Paper(
            title=paper_in.title,
            authors=paper_in.authors,
            year=paper_in.year,
            abstract=paper_in.abstract,
            file_path=paper_in.file_path,
            project_id=paper_in.project_id
        )
        db.add(db_paper)
        db.commit()
        db.refresh(db_paper)
        return db_paper

    @staticmethod
    def delete(db: Session, paper_id: int) -> bool:
        db_paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if db_paper:
            db.delete(db_paper)
            db.commit()
            return True
        return False

    @staticmethod
    def create_chunk(db: Session, paper_id: int, chunk_index: int, content: str, embedding: Optional[str] = None) -> PaperChunk:
        db_chunk = PaperChunk(
            paper_id=paper_id,
            chunk_index=chunk_index,
            content=content,
            embedding=embedding
        )
        db.add(db_chunk)
        db.commit()
        db.refresh(db_chunk)
        return db_chunk

    @staticmethod
    def get_chunks_by_project(db: Session, project_id: int) -> List[PaperChunk]:
        return db.query(PaperChunk).join(Paper).filter(Paper.project_id == project_id).all()
        
    @staticmethod
    def get_chunks_by_paper(db: Session, paper_id: int) -> List[PaperChunk]:
        return db.query(PaperChunk).filter(PaperChunk.paper_id == paper_id).all()
