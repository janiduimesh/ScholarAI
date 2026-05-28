import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.repositories.project_repository import ProjectRepository
from app.models.project_model import Project
from app.schemas.project_schema import ProjectCreate, ProjectUpdate

class ProjectService:
    @staticmethod
    def create_project(db: Session, project_in: ProjectCreate, owner_id: int) -> Project:
        # Prepopulate with empty supervisor feedback array
        db_project = ProjectRepository.create(db, project_in, owner_id)
        # Create an initial Abstract section placeholder
        ProjectRepository.create_section_version(
            db, 
            project_id=db_project.id, 
            section_name="Abstract", 
            content="[No abstract generated yet. Use the Writing Agent to generate it.]"
        )
        return db_project

    @staticmethod
    def get_project(db: Session, project_id: int) -> Optional[Project]:
        return ProjectRepository.get_by_id(db, project_id)

    @staticmethod
    def get_user_projects(db: Session, user_id: int) -> List[Project]:
        return ProjectRepository.get_by_owner(db, user_id)

    @staticmethod
    def update_project(db: Session, project_id: int, project_in: ProjectUpdate) -> Optional[Project]:
        db_project = ProjectRepository.get_by_id(db, project_id)
        if not db_project:
            return None
        return ProjectRepository.update(db, db_project, project_in)

    @staticmethod
    def add_supervisor_feedback(db: Session, project_id: int, author: str, text: str) -> Optional[Project]:
        db_project = ProjectRepository.get_by_id(db, project_id)
        if not db_project:
            return None
        
        try:
            feedback_list = json.loads(db_project.supervisor_feedback)
        except Exception:
            feedback_list = []

        new_feedback = {
            "id": str(uuid.uuid4()),
            "author": author,
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
            "resolved": False,
            "replies": []
        }
        feedback_list.append(new_feedback)
        
        db_project.supervisor_feedback = json.dumps(feedback_list)
        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def resolve_supervisor_feedback(db: Session, project_id: int, feedback_id: str, resolved: bool = True) -> Optional[Project]:
        db_project = ProjectRepository.get_by_id(db, project_id)
        if not db_project:
            return None
        
        try:
            feedback_list = json.loads(db_project.supervisor_feedback)
        except Exception:
            return db_project

        for item in feedback_list:
            if item.get("id") == feedback_id:
                item["resolved"] = resolved
                break
                
        db_project.supervisor_feedback = json.dumps(feedback_list)
        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def add_feedback_reply(db: Session, project_id: int, feedback_id: str, author: str, text: str) -> Optional[Project]:
        db_project = ProjectRepository.get_by_id(db, project_id)
        if not db_project:
            return None

        try:
            feedback_list = json.loads(db_project.supervisor_feedback)
        except Exception:
            return db_project

        for item in feedback_list:
            if item.get("id") == feedback_id:
                if "replies" not in item:
                    item["replies"] = []
                item["replies"].append({
                    "id": str(uuid.uuid4()),
                    "author": author,
                    "text": text,
                    "timestamp": datetime.utcnow().isoformat()
                })
                break

        db_project.supervisor_feedback = json.dumps(feedback_list)
        db.commit()
        db.refresh(db_project)
        return db_project
        
    @staticmethod
    def delete_project(db: Session, project_id: int) -> bool:
        return ProjectRepository.delete(db, project_id)
