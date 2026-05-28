from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.agents.topic_agent import TopicAgent
from app.agents.literature_agent import LiteratureAgent
from app.agents.gap_analysis_agent import GapAnalysisAgent
from app.agents.methodology_agent import MethodologyAgent
from app.agents.writing_agent import WritingAgent
from app.agents.reviewer_agent import ReviewerAgent
from app.agents.formatting_agent import FormattingAgent
from app.repositories.project_repository import ProjectRepository

class OrchestratorAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "Orchestrator Agent")

    def run_stage(self, stage_name: str, payload: dict = None) -> str:
        """
        Invokes the specialized agent responsible for the specified research stage.
        """
        payload = payload or {}
        
        self.log_info(f"Orchestrating stage execution: '{stage_name}'", "Routing")
        
        if stage_name == "Topic Selection":
            agent = TopicAgent(self.db, self.project_id)
            return agent.run()
            
        elif stage_name == "Literature Review":
            agent = LiteratureAgent(self.db, self.project_id)
            return agent.run()
            
        elif stage_name == "Research Gap":
            agent = GapAnalysisAgent(self.db, self.project_id)
            return agent.run(literature_synthesis=payload.get("literature_synthesis", ""))
            
        elif stage_name == "Methodology":
            agent = MethodologyAgent(self.db, self.project_id)
            return agent.run()
            
        elif stage_name == "Writing":
            section_name = payload.get("section_name", "Introduction")
            agent = WritingAgent(self.db, self.project_id)
            return agent.run(section_name)
            
        elif stage_name == "Reviewer":
            section_name = payload.get("section_name", "Introduction")
            agent = ReviewerAgent(self.db, self.project_id)
            return agent.run(section_name)
            
        elif stage_name == "Formatting":
            citation_style = payload.get("citation_style", "ieee")
            agent = FormattingAgent(self.db, self.project_id)
            return agent.run(citation_style)
            
        else:
            self.log_warning(f"Unknown stage name '{stage_name}' requested.", "Error")
            return f"Error: Unknown stage name {stage_name}"
