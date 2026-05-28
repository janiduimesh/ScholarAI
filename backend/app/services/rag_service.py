from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.services.vector_service import VectorService

class RagService:
    @staticmethod
    def get_context_for_query(db: Session, project_id: int, query: str, limit: int = 5) -> str:
        """
        Retrieves matching chunks and compiles a clean text block for LLM context.
        """
        matches = VectorService.search_similar_chunks(db, project_id, query, top_k=limit)
        
        if not matches:
            return "No matching literature findings found in database. Please upload papers."

        context_blocks = []
        for chunk, score in matches:
            paper_info = f"Source: {chunk.paper.title} ({chunk.paper.year}) by {chunk.paper.authors}"
            context_blocks.append(
                f"[{paper_info}] (Relevance Score: {score:.2f})\n{chunk.content}"
            )
            
        return "\n\n---\n\n".join(context_blocks)

    @staticmethod
    def get_all_papers_summary(db: Session, project_id: int) -> str:
        """
        Compiles a summary sheet of all uploaded papers for literature review.
        """
        from app.repositories.paper_repository import PaperRepository
        papers = PaperRepository.get_by_project(db, project_id)
        if not papers:
            return "No literature papers uploaded yet."

        summary_blocks = []
        for p in papers:
            summary_blocks.append(
                f"Title: {p.title}\n"
                f"Authors: {p.authors}\n"
                f"Year: {p.year}\n"
                f"Abstract: {p.abstract[:300]}..."
            )
        return "\n\n".join(summary_blocks)
