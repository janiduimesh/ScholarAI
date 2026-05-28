from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.prompts.gap_prompts import GAP_ANALYSIS_PROMPT
from app.repositories.project_repository import ProjectRepository
from app.schemas.project_schema import ProjectUpdate

class GapAnalysisAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "Research Gap Agent")

    def run(self, literature_synthesis: str = "") -> str:
        self.log_info("Starting research gap analysis...", "Init")
        
        project = ProjectRepository.get_by_id(self.db, self.project_id)
        if not project:
            raise ValueError("Project not found")

        # Heuristic fallback if synthesis is empty: load from papers
        if not literature_synthesis:
            from app.services.rag_service import RagService
            literature_synthesis = RagService.get_all_papers_summary(self.db, self.project_id)

        prompt = GAP_ANALYSIS_PROMPT.format(
            topic=project.title,
            literature_synthesis=literature_synthesis
        )

        self.log_info("Evaluating limitations in state-of-the-art baselines...", "Audit")
        gap_markdown = self.call_llm(prompt)
        
        # Save gap analysis details
        ProjectRepository.update(
            self.db,
            project,
            ProjectUpdate(research_gap=gap_markdown, stage="Methodology")
        )

        self.log_success("Research gap identified and documented. Pipeline advanced to 'Methodology'.", "Complete")
        return gap_markdown
