from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class GeneratedSection(Base):
    __tablename__ = "generated_sections"

    id = Column(Integer, primary_key=True, index=True)
    section_name = Column(String, nullable=False) # e.g. "Introduction", "Literature Review", "Methodology", "Abstract"
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    project = relationship("Project", back_populates="sections")
