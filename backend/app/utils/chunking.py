from typing import List

def sliding_window_chunker(text: str, chunk_size_words: int = 150, overlap_words: int = 30) -> List[str]:
    """
    Splits text into chunks using word-based count and overlap.
    """
    words = text.split()
    chunks = []
    
    if len(words) <= chunk_size_words:
        return [" ".join(words)]

    step = chunk_size_words - overlap_words
    if step <= 0:
        step = chunk_size_words

    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size_words]
        chunk_text = " ".join(chunk_words)
        if len(chunk_text.strip()) > 30:
            chunks.append(chunk_text)
            
    return chunks
