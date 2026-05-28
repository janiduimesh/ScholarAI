from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.prompts.topic_prompts import TOPIC_REFINEMENT_PROMPT
from app.repositories.project_repository import ProjectRepository
from app.schemas.project_schema import ProjectUpdate

class TopicAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "Topic Selection Agent")

    def run(self) -> str:
        self.log_info("Starting topic selection refinement stage...", "Init")
        
        project = ProjectRepository.get_by_id(self.db, self.project_id)
        if not project:
            raise ValueError(f"Project with id {self.project_id} not found")

        self.log_info(f"Analyzing user raw topic: '{project.title}'", "Analysis")
        
        # Build prompt
        prompt = TOPIC_REFINEMENT_PROMPT.format(
            topic=project.title,
            description=project.description or "No description provided."
        )

        # Call LLM
        refined_markdown = self.call_llm(prompt)
        
        # Save to database
        ProjectRepository.update(
            self.db, 
            project, 
            ProjectUpdate(refined_topic=refined_markdown, stage="Literature Review")
        )
        
        self.log_success("Topic refined successfully! Saved to proposal draft. Pipeline advanced to 'Literature Review'.", "Complete")
        return refined_markdown
