from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.prompts.summary_prompts import SUMMARY_PROMPT

class PdfSummaryAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "PDF Summary Agent")

    def run(self, paper_title: str, paper_year: int, chunk_text: str) -> str:
        self.log_info(f"Summarizing chunk for paper: {paper_title}", "Init")
        
        prompt = SUMMARY_PROMPT.format(
            title=paper_title,
            year=paper_year,
            chunk_text=chunk_text
        )
        
        summary = self.call_llm(prompt)
        self.log_success(f"Summarized paper segment: {paper_title[:40]}...", "Complete")
        return summary
