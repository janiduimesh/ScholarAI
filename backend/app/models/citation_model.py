from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Citation(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False) # e.g. smith2023attention
    title = Column(String, nullable=False)
    authors = Column(String, nullable=False)
    venue = Column(String, nullable=True)
    year = Column(Integer, nullable=False)
    citation_type = Column(String, default="article") # article, book, conference
    
    # Pre-formatted citations
    bibtex = Column(Text, nullable=True)
    apa = Column(Text, nullable=True)
    ieee = Column(Text, nullable=True)
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    project = relationship("Project", back_populates="citations")
