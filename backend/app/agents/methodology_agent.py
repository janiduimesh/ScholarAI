from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.prompts.methodology_prompts import METHODOLOGY_DESIGN_PROMPT
from app.repositories.project_repository import ProjectRepository
from app.schemas.project_schema import ProjectUpdate

class MethodologyAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "Methodology Agent")

    def run(self) -> str:
        self.log_info("Starting methodology design stage...", "Init")
        
        project = ProjectRepository.get_by_id(self.db, self.project_id)
        if not project:
            raise ValueError("Project not found")

        self.log_info("Formulating mathematical models and algorithm modules...", "Formulation")
        
        prompt = METHODOLOGY_DESIGN_PROMPT.format(
            topic=project.title,
            research_gap=project.research_gap or "Unspecified open gaps."
        )

        methodology_markdown = self.call_llm(prompt)

        ProjectRepository.update(
            self.db,
            project,
            ProjectUpdate(methodology=methodology_markdown, stage="Writing")
        )

        self.log_success("Methodology designed and saved! Pipeline advanced to 'Writing'.", "Complete")
        return methodology_markdown
