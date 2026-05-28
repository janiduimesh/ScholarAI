import math
import json
import hashlib
from typing import List, Optional
from app.config import settings

class EmbeddingService:
    @staticmethod
    def get_embedding(text: str) -> List[float]:
        """
        Generates an embedding vector for the text. 
        Uses Gemini or OpenAI if keys are provided; falls back to offline hashing vectorizer.
        """
        # 1. Attempt Gemini Embedding
        if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                # Call modern Gemini embedding model
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text,
                    task_type="retrieval_document"
                )
                return result['embedding']
            except Exception as e:
                # Fallback to local vector generation on API failure
                pass

        # 2. Attempt OpenAI Embedding
        if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.embeddings.create(
                    input=[text],
                    model="text-embedding-3-small"
                )
                return response.data[0].embedding
            except Exception as e:
                pass

        # 3. Offline Heuristic Vectorizer (384 Dimensions)
        # Guarantees zero runtime dependency on Windows and works offline.
        return EmbeddingService._generate_local_embedding(text)

    @staticmethod
    def _generate_local_embedding(text: str, dimensions: int = 384) -> List[float]:
        """
        Deterministic, offline, normalized bag-of-words hashing vectorizer.
        Fills a vector of length `dimensions` based on hashed word frequencies.
        """
        vector = [0.0] * dimensions
        words = re_split_words = [w.lower() for w in text.split() if len(w) > 2]
        
        if not words:
            return vector

        for word in words:
            # Hash the word to determine vector index
            h = hashlib.md5(word.encode('utf-8')).hexdigest()
            index = int(h, 16) % dimensions
            # Weight is based on word length and frequency
            vector[index] += 1.0

        # L2 Normalization
        square_sum = sum(x * x for x in vector)
        magnitude = math.sqrt(square_sum)
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
            
        return vector
