import re

def is_valid_email(email: str) -> bool:
    """
    Check if the string is structured as an email address.
    """
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def is_strong_password(password: str) -> bool:
    """
    Validates password strength (at least 6 characters).
    """
    return len(password) >= 6
