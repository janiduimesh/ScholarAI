import re

def clean_unicode_text(text: str) -> str:
    """
    Removes null characters, weird unicode, control blocks.
    """
    # Remove null bytes
    text = text.replace("\u0000", "")
    # Normalize whitespaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def strip_markdown(text: str) -> str:
    """
    Strips basic markdown tags.
    """
    text = re.sub(r'\*|_|`|#', '', text)
    return text.strip()
