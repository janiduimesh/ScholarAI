from sqlalchemy.orm import Session
from typing import List
from app.models.agent_log_model import AgentLog

class AgentLogRepository:
    @staticmethod
    def get_by_project(db: Session, project_id: int, limit: int = 100) -> List[AgentLog]:
        return db.query(AgentLog).filter(
            AgentLog.project_id == project_id
        ).order_by(AgentLog.created_at.desc()).limit(limit).all()

    @staticmethod
    def create(db: Session, project_id: int, agent_name: str, message: str, step: str = None, log_type: str = "info") -> AgentLog:
        db_log = AgentLog(
            project_id=project_id,
            agent_name=agent_name,
            step=step,
            log_type=log_type,
            message=message
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    def clear_project_logs(db: Session, project_id: int):
        db.query(AgentLog).filter(AgentLog.project_id == project_id).delete()
        db.commit()
        return True
