import os
import re

def is_allowed_file(filename: str, allowed_extensions={"pdf", "txt"}) -> bool:
    """
    Check if the file extension is allowed.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def secure_filename(filename: str) -> str:
    """
    Returns a secure version of a filename, removing path traversals and invalid chars.
    """
    name = os.path.basename(filename)
    # Remove non-alphanumeric, dots, dashes, underscores
    name = re.sub(r'[^a-zA-Z0-9_\.\-]', '', name)
    return name
