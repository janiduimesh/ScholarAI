import json
import re
from typing import Any, Dict, Optional

def extract_json_block(text: str) -> Optional[Dict[str, Any]]:
    """
    Finds a JSON block inside backticks (e.g. ```json ... ```) or raw JSON syntax and parses it.
    """
    # Try regex search for markdown block
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        json_content = match.group(1).strip()
    else:
        json_content = text.strip()
        
    try:
        return json.loads(json_content)
    except json.JSONDecodeError:
        # Try finding the first '{' and last '}'
        start_idx = json_content.find('{')
        end_idx = json_content.rfind('}')
        if start_idx != -1 and end_idx != -1:
            try:
                return json.loads(json_content[start_idx:end_idx+1])
            except Exception:
                pass
        return None
