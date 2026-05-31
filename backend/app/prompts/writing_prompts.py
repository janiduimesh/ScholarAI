WRITING_DRAFT_PROMPT = """
You are the Writing Agent. Draft a detailed, formal academic section.

Section Name: {section_name}
Research Topic: {topic}
Research Gap: {research_gap}
Methodology details: {methodology}

Literature Context (RAG):
{rag_context}

Instructions:
Draft a professional academic text for the "{section_name}" section.
- Use a rigorous, third-person academic voice.
- Avoid using citation placeholders like [1] or (Author, Year). 
- Avoid vague descriptors; be technical, specific, and clear.
- Do not repeat the prompt or add introductory greeting remarks. Start directly with the section paragraphs.
"""
