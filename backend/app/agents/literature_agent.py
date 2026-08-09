from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.prompts.literature_prompts import LITERATURE_SEARCH_PROMPT
from app.services.rag_service import RagService
from app.repositories.project_repository import ProjectRepository
from app.repositories.paper_repository import PaperRepository
from app.schemas.project_schema import ProjectUpdate

class LiteratureAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "Literature Search Agent")

    def run(self) -> str:
        self.log_info("Initializing literature search agent...", "Init")
        
        project = ProjectRepository.get_by_id(self.db, self.project_id)
        if not project:
            raise ValueError("Project not found")

        papers = PaperRepository.get_by_project(self.db, self.project_id)
        self.log_info(f"Loaded {len(papers)} uploaded scientific papers.", "Read Reference")

        papers_summary = RagService.get_all_papers_summary(self.db, self.project_id)
        
        prompt = LITERATURE_SEARCH_PROMPT.format(
            topic=project.title,
            papers_summary=papers_summary
        )

        self.log_info("Synthesizing citations and mapping claim structures...", "Synthesis")
        synthesis = self.call_llm(prompt)
        
        for paper in papers:
            from app.services.citation_service import CitationService
            CitationService.add_citation_from_paper(self.db, self.project_id, paper.title, paper.authors, paper.year)
        
        ProjectRepository.update(
            self.db,
            project,
            ProjectUpdate(stage="Research Gap")
        )

        self.log_success("Literature synthesis complete! Reference mapping populated. Pipeline advanced to 'Research Gap'.", "Complete")
        return synthesis
