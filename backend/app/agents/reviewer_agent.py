from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.prompts.reviewer_prompts import REVIEWER_AUDIT_PROMPT
from app.repositories.project_repository import ProjectRepository
from app.services.rag_service import RagService

class ReviewerAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "Reviewer Agent")

    def run(self, section_name: str) -> str:
        self.log_info(f"Auditing draft section: '{section_name}' for academic style...", "Init")
        
        project = ProjectRepository.get_by_id(self.db, self.project_id)
        if not project:
            raise ValueError("Project not found")

        section = ProjectRepository.get_latest_section(self.db, self.project_id, section_name)
        if not section or not section.content:
            self.log_warning(f"No draft found for section '{section_name}'. Cannot review.", "Empty")
            return "No content to review. Please write draft first."

        # Fetch citation context list
        literature_context = RagService.get_all_papers_summary(self.db, self.project_id)

        prompt = REVIEWER_AUDIT_PROMPT.format(
            section_content=section.content,
            literature_context=literature_context
        )

        self.log_info(f"Performing passive voice scan and checking plagiarism risk...", "Audit Check")
        critique = self.call_llm(prompt)

        self.log_success(f"Style critique complete for '{section_name}'! Report generated.", "Complete")
        return critique
