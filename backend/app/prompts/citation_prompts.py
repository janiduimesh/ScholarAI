CITATION_CHECK_PROMPT = """
You are the Citation Agent. Verify if the research assertion matches the citation source claim.

Assertion in Draft: "{assertion}"
Source Citation: "{citation_title}"
Source text chunk: "{source_text}"

Evaluate and output a JSON object:
{{
  "supported": true/false,
  "explanation": "Brief explanation of whether the claim is fully supported, partially supported, or unsupported by the citation text."
}}
"""
