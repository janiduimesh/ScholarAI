import os
import re
from pypdf import PdfReader
from typing import Dict, Any

class PdfService:
    @staticmethod
    def extract_text_and_metadata(file_path: str) -> Dict[str, Any]:
        """
        Reads a PDF file, extracts raw text, and returns metadata and content.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at {file_path}")

        reader = PdfReader(file_path)
        num_pages = len(reader.pages) 
        
        full_text = []
        first_page_text = ""
        
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                full_text.append(text)
                if i == 0:
                    first_page_text = text

        extracted_content = "\n\n".join(full_text)
        
        # Heuristics for metadata extraction from first page
        title = "Unknown Title"
        authors = "Unknown Authors"
        year = 2026
        abstract = ""

        # Let's try heuristic regexes on first page
        lines = [line.strip() for line in first_page_text.split("\n") if line.strip()]
        if lines:
            # Title is usually one of the first few lines that is not a journal name
            # Let's clean the lines and guess the title
            title_candidates = [l for l in lines[:5] if len(l) > 10 and "journal" not in l.lower() and "proceeding" not in l.lower()]
            if title_candidates:
                title = title_candidates[0]

            # Authors are usually listed after title
            # Let's check lines near title
            for idx, line in enumerate(lines[:10]):
                if line == title and idx + 1 < len(lines):
                    authors = lines[idx+1]
                    break
        
        # Extract abstract
        abstract_match = re.search(r'(?i)abstract[\s\.:\-]+(.*?)(?=\n\s*(?:introduction|keywords|1\b))', extracted_content, re.DOTALL)
        if abstract_match:
            abstract = abstract_match.group(1).strip()
        else:
            # Fallback abstract: first 1000 chars of text
            abstract = extracted_content[:800] + "..."

        # Look for year
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', first_page_text)
        if year_match:
            year = int(year_match.group(1))

        # Clean title and author strings
        title = title.replace("\u0000", "").strip()
        authors = authors.replace("\u0000", "").strip()

        return {
            "title": title[:200] if title else "Untitled Paper",
            "authors": authors[:200] if authors else "Unknown",
            "year": year,
            "abstract": abstract,
            "text": extracted_content
        }
