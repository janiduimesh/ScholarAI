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

    def run_stage(self, stage_name: str, payload: dict | None = None) -> str:
        """
        Routes a research workflow stage to the correct specialized agent.
        """

        payload = payload or {}

        self.log_info(
            f"Orchestrating stage execution: '{stage_name}'",
            "Routing"
        )

        try:
            project = ProjectRepository.get_by_id(self.db, self.project_id)

            if not project:
                raise ValueError("Project not found")

            stage_name = stage_name.strip()

            stage_handlers = {
                "Topic Selection": self._run_topic_selection,
                "Literature Review": self._run_literature_review,
                "Research Gap": self._run_research_gap,
                "Methodology": self._run_methodology,
                "Writing": self._run_writing,
                "Review": self._run_review,
                "Reviewer": self._run_review,
                "Formatting": self._run_formatting,
            }

            handler = stage_handlers.get(stage_name)

            if not handler:
                valid_stages = ", ".join(stage_handlers.keys())
                raise ValueError(
                    f"Unknown stage name '{stage_name}'. Valid stages are: {valid_stages}"
                )

            result = handler(payload)

            self.log_success(
                f"Stage '{stage_name}' completed successfully.",
                "Complete"
            )

            return result

        except Exception as e:
            self.db.rollback()

            self.log_error(
                f"Stage '{stage_name}' failed: {str(e)}",
                "Error"
            )

            raise RuntimeError(
                f"Agent execution failed at stage '{stage_name}': {str(e)}"
            )

    def _run_topic_selection(self, payload: dict) -> str:
        agent = TopicAgent(self.db, self.project_id)
        return agent.run()

    def _run_literature_review(self, payload: dict) -> str:
        agent = LiteratureAgent(self.db, self.project_id)
        return agent.run()

    def _run_research_gap(self, payload: dict) -> str:
        literature_synthesis = payload.get("literature_synthesis", "")

        agent = GapAnalysisAgent(self.db, self.project_id)
        return agent.run(literature_synthesis=literature_synthesis)

    def _run_methodology(self, payload: dict) -> str:
        agent = MethodologyAgent(self.db, self.project_id)
        return agent.run()

    def _run_writing(self, payload: dict) -> str:
        section_name = payload.get("section_name")

        if not section_name:
            section_name = "Introduction"

        agent = WritingAgent(self.db, self.project_id)
        return agent.run(section_name)

    def _run_review(self, payload: dict) -> str:
        section_name = payload.get("section_name")

        if not section_name:
            section_name = "Introduction"

        agent = ReviewerAgent(self.db, self.project_id)
        return agent.run(section_name)

    def _run_formatting(self, payload: dict) -> str:
        citation_style = payload.get("citation_style")

        if not citation_style:
            citation_style = "ieee"

        agent = FormattingAgent(self.db, self.project_id)
        return agent.run(citation_style)