from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    stage = Column(String, default="Topic Selection")  # Topic Selection -> Literature Review -> Research Gap -> Methodology -> Writing -> Reviewer -> Formatting
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Selected/refined research details
    refined_topic = Column(Text, nullable=True)
    research_gap = Column(Text, nullable=True)
    methodology = Column(Text, nullable=True)
    supervisor_feedback = Column(Text, default="[]") # JSON list of feedback items
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="projects")
    papers = relationship("Paper", back_populates="project", cascade="all, delete-orphan")
    sections = relationship("GeneratedSection", back_populates="project", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="project", cascade="all, delete-orphan")
    agent_logs = relationship("AgentLog", back_populates="project", cascade="all, delete-orphan")
