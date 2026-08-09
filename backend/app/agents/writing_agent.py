from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.prompts.writing_prompts import WRITING_DRAFT_PROMPT
from app.services.rag_service import RagService
from app.repositories.project_repository import ProjectRepository

class WritingAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "Writing Agent")

    def run(self, section_name: str) -> str:
        self.log_info(f"Initializing draft generation for section: '{section_name}'", "Init")
        
        project = ProjectRepository.get_by_id(self.db, self.project_id)
        if not project:
            raise ValueError("Project not found")

        self.log_info(f"Searching citation database for context matching '{section_name}'...", "RAG Search")
        rag_context = RagService.get_context_for_query(
            self.db, 
            self.project_id, 
            query=f"{section_name} {project.title} {project.research_gap[:100] if project.research_gap else ''}", 
            limit=4
        )

        prompt = WRITING_DRAFT_PROMPT.format(
            section_name=section_name,
            topic=project.title,
            research_gap=project.research_gap or "General academic proposal.",
            methodology=project.methodology or "General empirical approach.",
            rag_context=rag_context
        )

        self.log_info(f"Drafting formal content for {section_name}...", "Generation")
        draft_content = self.call_llm(prompt)
        
        db_section = ProjectRepository.create_section_version(
            self.db, 
            project_id=self.project_id, 
            section_name=section_name, 
            content=draft_content
        )
        
        self.log_success(
            f"Section '{section_name}' generated successfully (Version {db_section.version})!", 
            "Complete"
        )
        return draft_content

