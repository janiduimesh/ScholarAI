from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PaperChunk(Base):
    __tablename__ = "paper_chunks"

    id = Column(Integer, primary_key=True, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Text, nullable=True) # Stored as JSON string of floats list
    
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)

    paper = relationship("Paper", back_populates="chunks")
