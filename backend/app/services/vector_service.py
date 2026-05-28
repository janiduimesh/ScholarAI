import json
import numpy as np
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple
from app.repositories.paper_repository import PaperRepository
from app.services.embedding_service import EmbeddingService
from app.models.paper_chunk_model import PaperChunk

class VectorService:
    @staticmethod
    def chunk_and_index_paper(db: Session, paper_id: int, text: str, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Splits text into chunks, computes embeddings, and stores them in the database.
        """
        # Clean text from null bytes
        text = text.replace("\u0000", "")
        
        words = text.split()
        chunks = []
        
        # Simple word-based chunking with overlap
        step = chunk_size - chunk_overlap
        if step <= 0:
            step = chunk_size
            
        for i in range(0, len(words), step):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)
            if len(chunk_text.strip()) > 50: # Ignore tiny chunks
                chunks.append(chunk_text)

        # Store chunks in database
        for idx, chunk_content in enumerate(chunks):
            embedding = EmbeddingService.get_embedding(chunk_content)
            # Store embedding list as JSON string
            embedding_json = json.dumps(embedding)
            PaperRepository.create_chunk(
                db, 
                paper_id=paper_id, 
                chunk_index=idx, 
                content=chunk_content, 
                embedding=embedding_json
            )
            
        return len(chunks)

    @staticmethod
    def search_similar_chunks(db: Session, project_id: int, query: str, top_k: int = 5) -> List[Tuple[PaperChunk, float]]:
        """
        Performs vector cosine similarity search over chunks in a project.
        """
        query_vector = np.array(EmbeddingService.get_embedding(query))
        chunks = PaperRepository.get_chunks_by_project(db, project_id)
        
        if not chunks:
            return []

        results = []
        for chunk in chunks:
            if not chunk.embedding:
                continue
            
            try:
                chunk_vector = np.array(json.loads(chunk.embedding))
                # Cosine similarity (since vectors are L2 normalized, it's just dot product)
                score = float(np.dot(query_vector, chunk_vector))
                results.append((chunk, score))
            except Exception as e:
                # If JSON parsing fails, skip this chunk
                continue

        # Sort by similarity score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
