LITERATURE_SEARCH_PROMPT = """
You are the Literature Search Agent. Analyze the current research topic and objectives, and synthesize key findings from the uploaded papers.

Research Topic: {topic}
Uploaded Papers Summary:
{papers_summary}

Please provide:
1. A categorized synthesis of key themes and findings from these papers.
2. An outline of what researchers have established.
3. Relevant citations in IEEE/APA format based on the uploaded titles.

Format your output in clean Markdown. Start directly with the Markdown sections.
"""
