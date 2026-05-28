from sqlalchemy.orm import Session
from typing import List
from app.repositories.agent_log_repository import AgentLogRepository
from app.models.agent_log_model import AgentLog

class AgentLogService:
    @staticmethod
    def log(db: Session, project_id: int, agent_name: str, message: str, step: str = None, log_type: str = "info") -> AgentLog:
        return AgentLogRepository.create(
            db, 
            project_id=project_id, 
            agent_name=agent_name, 
            message=message, 
            step=step, 
            log_type=log_type
        )

    @staticmethod
    def log_thinking(db: Session, project_id: int, agent_name: str, thought: str, step: str = None) -> AgentLog:
        return AgentLogService.log(db, project_id, agent_name, thought, step, "thinking")

    @staticmethod
    def log_success(db: Session, project_id: int, agent_name: str, message: str, step: str = None) -> AgentLog:
        return AgentLogService.log(db, project_id, agent_name, message, step, "success")

    @staticmethod
    def log_warning(db: Session, project_id: int, agent_name: str, message: str, step: str = None) -> AgentLog:
        return AgentLogService.log(db, project_id, agent_name, message, step, "warning")

    @staticmethod
    def get_logs(db: Session, project_id: int, limit: int = 100) -> List[AgentLog]:
        return AgentLogRepository.get_by_project(db, project_id, limit)

    @staticmethod
    def clear_logs(db: Session, project_id: int):
        return AgentLogRepository.clear_project_logs(db, project_id)
