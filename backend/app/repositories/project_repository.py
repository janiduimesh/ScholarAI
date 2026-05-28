from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.project_model import Project
from app.models.generated_section_model import GeneratedSection
from app.schemas.project_schema import ProjectCreate, ProjectUpdate

class ProjectRepository:
    @staticmethod
    def get_by_id(db: Session, project_id: int) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def get_by_owner(db: Session, owner_id: int) -> List[Project]:
        return db.query(Project).filter(Project.owner_id == owner_id).all()

    @staticmethod
    def create(db: Session, project_in: ProjectCreate, owner_id: int) -> Project:
        db_project = Project(
            title=project_in.title,
            description=project_in.description,
            owner_id=owner_id
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def update(db: Session, db_project: Project, project_in: ProjectUpdate) -> Project:
        update_data = project_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_project, key, value)
        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def delete(db: Session, project_id: int) -> bool:
        db_project = db.query(Project).filter(Project.id == project_id).first()
        if db_project:
            db.delete(db_project)
            db.commit()
            return True
        return False

    @staticmethod
    def get_latest_section(db: Session, project_id: int, section_name: str) -> Optional[GeneratedSection]:
        return db.query(GeneratedSection).filter(
            GeneratedSection.project_id == project_id,
            GeneratedSection.section_name == section_name
        ).order_by(GeneratedSection.version.desc()).first()

    @staticmethod
    def get_section_version(db: Session, project_id: int, section_name: str, version: int) -> Optional[GeneratedSection]:
        return db.query(GeneratedSection).filter(
            GeneratedSection.project_id == project_id,
            GeneratedSection.section_name == section_name,
            GeneratedSection.version == version
        ).first()

    @staticmethod
    def create_section_version(db: Session, project_id: int, section_name: str, content: str) -> GeneratedSection:
        latest = ProjectRepository.get_latest_section(db, project_id, section_name)
        next_version = (latest.version + 1) if latest else 1
        db_section = GeneratedSection(
            project_id=project_id,
            section_name=section_name,
            content=content,
            version=next_version
        )
        db.add(db_section)
        db.commit()
        db.refresh(db_section)
        return db_section

    @staticmethod
    def get_sections_list(db: Session, project_id: int) -> List[GeneratedSection]:
        # Return all drafts associated with the project
        return db.query(GeneratedSection).filter(GeneratedSection.project_id == project_id).all()

