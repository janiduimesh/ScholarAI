import re
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.repositories.citation_repository import CitationRepository
from app.schemas.citation_schema import CitationCreate
from app.models.citation_model import Citation
from app.services.vector_service import VectorService

class CitationService:
    @staticmethod
    def generate_citation_formats(authors: str, title: str, year: int, venue: str = None) -> Dict[str, str]:
        """
        Auto-generates citation formats in APA, IEEE, and BibTeX.
        """
        # Clean author names
        auth_clean = authors if authors else "Unknown"
        venue_clean = venue if venue else "Academic Repository"
        
        # Key generation: e.g. smith2023attention
        first_author = auth_clean.split(",")[0].split(" ")[0].lower()
        # Remove non-alpha characters
        first_author = re.sub(r'[^a-z]', '', first_author)
        first_word_title = title.split(" ")[0].lower()
        first_word_title = re.sub(r'[^a-z]', '', first_word_title)
        citation_key = f"{first_author}{year}{first_word_title}"

        # APA
        apa = f"{auth_clean}. ({year}). {title}. {venue_clean}."
        
        # IEEE
        ieee = f'{auth_clean}, "{title}," {venue_clean}, {year}.'
        
        # BibTeX
        bibtex = f"@article{{{citation_key},\n  author = {{{auth_clean}}},\n  title = {{{title}}},\n  journal = {{{venue_clean}}},\n  year = {{{year}}}\n}}"

        return {
            "key": citation_key,
            "apa": apa,
            "ieee": ieee,
            "bibtex": bibtex
        }

    @staticmethod
    def add_citation_from_paper(db: Session, project_id: int, paper_title: str, paper_authors: str, paper_year: int) -> Citation:
        """
        Creates formatted citation records derived from paper details.
        """
        formats = CitationService.generate_citation_formats(paper_authors, paper_title, paper_year)
        
        # Check if citation key exists
        existing = CitationRepository.get_by_key(db, project_id, formats["key"])
        if existing:
            return existing

        citation_in = CitationCreate(
            key=formats["key"],
            title=paper_title,
            authors=paper_authors,
            year=paper_year,
            venue="Academic Journal",
            citation_type="article",
            bibtex=formats["bibtex"],
            apa=formats["apa"],
            ieee=formats["ieee"],
            project_id=project_id
        )
        return CitationRepository.create(db, citation_in)

    @staticmethod
    def get_citations(db: Session, project_id: int) -> List[Citation]:
        return CitationRepository.get_by_project(db, project_id)

    @staticmethod
    def verify_draft_claims(db: Session, project_id: int, text: str) -> List[Dict[str, Any]]:
        """
        Audits draft assertions by looking for matching source chunks in papers database.
        Detects statements with brackets like [Claim] and finds similar source paragraphs.
        """
        # Split text into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        reports = []

        for idx, sentence in enumerate(sentences):
            # Evaluate sentences that make strong claims (has length > 40, contains assertion verbs)
            if len(sentence.strip()) > 40 and any(v in sentence.lower() for v in ["demonstrate", "proves", "show", "lead to", "increase", "decrease", "is due to"]):
                # Search vector database
                matches = VectorService.search_similar_chunks(db, project_id, sentence, top_k=1)
                if matches:
                    chunk, score = matches[0]
                    support_status = "unsupported"
                    if score > 0.65:
                        support_status = "supported"
                    elif score > 0.45:
                        support_status = "partial"

                    reports.append({
                        "sentence_index": idx,
                        "sentence": sentence,
                        "support_status": support_status,
                        "score": score,
                        "source_chunk": chunk.content[:150] + "...",
                        "source_title": chunk.paper.title,
                        "source_authors": chunk.paper.authors
                    })
        return reports
