import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from email_validator import validate_email, EmailNotValidError

def validate_email_address(email: str) -> Tuple[bool, str]:
    """
    Validate email address
    
    Args:
        email: Email address to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        validate_email(email)
        return True, ""
    except EmailNotValidError as e:
        return False, str(e)

def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    
    Args:
        password: Password to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    return True, ""

def validate_date(date_str: str, date_format: str = "%Y-%m-%d") -> Tuple[bool, str]:
    """
    Validate date string
    
    Args:
        date_str: Date string to validate
        date_format: Expected date format
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        datetime.strptime(date_str, date_format)
        return True, ""
    except ValueError:
        return False, f"Date must be in format {date_format}"

def validate_mood_value(mood: str) -> Tuple[bool, str]:
    """
    Validate mood value
    
    Args:
        mood: Mood value to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    valid_moods = [
        "happy", "sad", "anxious", "angry", "tired", "neutral",
        "excited", "peaceful", "grateful", "stressed", "energetic",
        "focused", "relaxed", "overwhelmed", "calm"
    ]
    
    mood_lower = mood.lower()
    
    if mood_lower not in valid_moods:
        return False, f"Mood must be one of: {', '.join(valid_moods)}"
    
    return True, ""

def validate_energy_level(energy: int) -> Tuple[bool, str]:
    """
    Validate energy level (1-10)
    
    Args:
        energy: Energy level to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(energy, int):
        return False, "Energy level must be an integer"
    
    if energy < 1 or energy > 10:
        return False, "Energy level must be between 1 and 10"
    
    return True, ""

def validate_journal_entry(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate journal entry data
    
    Args:
        data: Journal entry data
    
    Returns:
        Tuple of (is_valid, error_messages)
    """
    errors = []
    
    # Check required fields
    required_fields = ["user_id", "text"]
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")
    
    # Validate text
    if "text" in data:
        text = data["text"]
        if not isinstance(text, str):
            errors.append("Text must be a string")
        elif len(text.strip()) == 0:
            errors.append("Text cannot be empty")
        elif len(text) > 10000:
            errors.append("Text is too long (max 10000 characters)")
    
    # Validate mood if present
    if "mood" in data and data["mood"]:
        is_valid, error = validate_mood_value(data["mood"])
        if not is_valid:
            errors.append(error)
    
    # Validate energy level if present
    if "energy_level" in data and data["energy_level"] is not None:
        is_valid, error = validate_energy_level(data["energy_level"])
        if not is_valid:
            errors.append(error)
    
    # Validate trigger tags if present
    if "trigger_tags" in data:
        trigger_tags = data["trigger_tags"]
        if not isinstance(trigger_tags, list):
            errors.append("Trigger tags must be a list")
        else:
            for tag in trigger_tags:
                if not isinstance(tag, str):
                    errors.append("All trigger tags must be strings")
                elif len(tag) > 50:
                    errors.append(f"Trigger tag too long: {tag}")
    
    return len(errors) == 0, errors

def validate_user_data(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate user data
    
    Args:
        data: User data
    
    Returns:
        Tuple of (is_valid, error_messages)
    """
    errors = []
    
    # Validate email if present
    if "email" in data and data["email"]:
        is_valid, error = validate_email_address(data["email"])
        if not is_valid:
            errors.append(f"Invalid email: {error}")
    
    # Validate name if present
    if "name" in data and data["name"]:
        name = data["name"]
        if not isinstance(name, str):
            errors.append("Name must be a string")
        elif len(name.strip()) == 0:
            errors.append("Name cannot be empty")
        elif len(name) > 100:
            errors.append("Name is too long (max 100 characters)")
    
    # Validate date of birth if present
    if "date_of_birth" in data and data["date_of_birth"]:
        # Check if it's a string or datetime
        if isinstance(data["date_of_birth"], str):
            is_valid, error = validate_date(data["date_of_birth"])
            if not is_valid:
                errors.append(f"Invalid date of birth: {error}")
        elif not isinstance(data["date_of_birth"], datetime):
            errors.append("Date of birth must be a string or datetime")
    
    # Validate height if present
    if "height_cm" in data and data["height_cm"] is not None:
        height = data["height_cm"]
        if not isinstance(height, (int, float)):
            errors.append("Height must be a number")
        elif height < 50 or height > 300:
            errors.append("Height must be between 50 and 300 cm")
    
    # Validate weight if present
    if "weight_kg" in data and data["weight_kg"] is not None:
        weight = data["weight_kg"]
        if not isinstance(weight, (int, float)):
            errors.append("Weight must be a number")
        elif weight < 20 or weight > 300:
            errors.append("Weight must be between 20 and 300 kg")
    
    return len(errors) == 0, errors

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent injection attacks
    
    Args:
        text: Input text
    
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Remove potentially dangerous characters
    text = re.sub(r'[<>"\'\\]', '', text)
    
    # Remove script tags and content
    text = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', text, flags=re.IGNORECASE)
    
    # Remove other dangerous HTML tags
    dangerous_tags = ['iframe', 'object', 'embed', 'frame', 'frameset']
    for tag in dangerous_tags:
        pattern = rf'<{tag}\b[^>]*>.*?</{tag}>'
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
    return text.strip()

def validate_api_key(api_key: str) -> bool:
    """
    Validate API key format
    
    Args:
        api_key: API key to validate
    
    Returns:
        True if valid
    """
    if not api_key:
        return False
    
    # Basic format validation (adjust based on your API key format)
    if len(api_key) < 20 or len(api_key) > 100:
        return False
    
    # Should contain only valid characters
    if not re.match(r'^[a-zA-Z0-9._-]+$', api_key):
        return False
    
    return True

def validate_pagination_params(page: int, limit: int) -> Tuple[bool, str]:
    """
    Validate pagination parameters
    
    Args:
        page: Page number
        limit: Items per page
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if page < 1:
        return False, "Page must be 1 or greater"
    
    if limit < 1 or limit > 100:
        return False, "Limit must be between 1 and 100"
    
    return True, ""