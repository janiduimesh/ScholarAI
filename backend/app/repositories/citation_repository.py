from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.citation_model import Citation
from app.schemas.citation_schema import CitationCreate

class CitationRepository:
    @staticmethod
    def get_by_id(db: Session, citation_id: int) -> Optional[Citation]:
        return db.query(Citation).filter(Citation.id == citation_id).first()

    @staticmethod
    def get_by_project(db: Session, project_id: int) -> List[Citation]:
        return db.query(Citation).filter(Citation.project_id == project_id).all()

    @staticmethod
    def get_by_key(db: Session, project_id: int, key: str) -> Optional[Citation]:
        return db.query(Citation).filter(
            Citation.project_id == project_id, 
            Citation.key == key
        ).first()

    @staticmethod
    def create(db: Session, citation_in: CitationCreate) -> Citation:
        db_citation = Citation(
            key=citation_in.key,
            title=citation_in.title,
            authors=citation_in.authors,
            venue=citation_in.venue,
            year=citation_in.year,
            citation_type=citation_in.citation_type,
            bibtex=citation_in.bibtex,
            apa=citation_in.apa,
            ieee=citation_in.ieee,
            project_id=citation_in.project_id
        )
        db.add(db_citation)
        db.commit()
        db.refresh(db_citation)
        return db_citation

    @staticmethod
    def delete(db: Session, citation_id: int) -> bool:
        db_citation = db.query(Citation).filter(Citation.id == citation_id).first()
        if db_citation:
            db.delete(db_citation)
            db.commit()
            return True
        return False
