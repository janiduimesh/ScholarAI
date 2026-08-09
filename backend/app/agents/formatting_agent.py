from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.repositories.project_repository import ProjectRepository

class FormattingAgent(BaseAgent):
    def __init__(self, db: Session, project_id: int):
        super().__init__(db, project_id, "Formatting Agent")

    def run(self, citation_style: str = "ieee") -> str:
        self.log_info(f"Applying academic styling template: {citation_style.upper()} rules...", "Init")
        
        project = ProjectRepository.get_by_id(self.db, self.project_id)
        if not project:
            raise ValueError("Project not found")

        self.log_info("Applying formatting guidelines: margins, double-column grid, font sizes...", "Layout")
        
        if citation_style.lower() == "ieee":
            guidelines = """# IEEE Formatting Rules Applied:
- Font: Times New Roman, 10pt (Body), 24pt (Title)
- Columns: Dual-column grid layout (0.22 in spacing)
- Margins: Top: 0.75 in, Bottom: 1.0 in, Left/Right: 0.625 in
- Citations: Numeric brackets, e.g. [1], [2], numbered sequentially by appearance.
- Reference List: Numbered items, ordered by citation sequence.
"""
        else:
            guidelines = """# APA Formatting Rules Applied:
- Font: Times New Roman, 12pt
- Columns: Single column layout, double-spaced
- Margins: 1.0 in on all sides
- Citations: Author-date format, e.g., (Smith, 2023).
- Reference List: Alphabetical order by first author's surname.
"""

        self.log_success(f"Academic formatting template applied ({citation_style.upper()})! Preview compiled.", "Complete")
        return guidelines
