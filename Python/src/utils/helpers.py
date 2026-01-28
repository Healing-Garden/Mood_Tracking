import re
import json
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
import numpy as np

def clean_text(text: str) -> str:
    """
    Clean text by removing extra whitespace and special characters
    
    Args:
        text: Input text
    
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?\'"-]', '', text)
    
    # Remove extra spaces around punctuation
    text = re.sub(r'\s+([.,!?])', r'\1', text)
    
    return text.strip()

def truncate_text(text: str, max_length: int = 500) -> str:
    """
    Truncate text to maximum length
    
    Args:
        text: Input text
        max_length: Maximum length
    
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    
    # Try to truncate at sentence boundary
    sentences = re.split(r'([.!?]+)', text)
    
    truncated = ""
    for i in range(0, len(sentences), 2):
        if i + 1 < len(sentences):
            sentence = sentences[i] + sentences[i + 1]
        else:
            sentence = sentences[i]
        
        if len(truncated + sentence) > max_length:
            break
        
        truncated += sentence
    
    # If no sentence fits, truncate at word boundary
    if not truncated:
        words = text.split()
        truncated = ""
        for word in words:
            if len(truncated + " " + word) > max_length:
                break
            truncated += (" " if truncated else "") + word
    
    return truncated.strip() + "..."

def generate_id_from_text(text: str, prefix: str = "") -> str:
    """
    Generate a deterministic ID from text
    
    Args:
        text: Input text
        prefix: Optional prefix
    
    Returns:
        Generated ID
    """
    # Create hash
    hash_obj = hashlib.md5(text.encode())
    hash_hex = hash_obj.hexdigest()[:12]
    
    return f"{prefix}_{hash_hex}" if prefix else hash_hex

def normalize_scores(scores: List[float]) -> List[float]:
    """
    Normalize scores to range [0, 1]
    
    Args:
        scores: List of scores
    
    Returns:
        Normalized scores
    """
    if not scores:
        return []
    
    min_score = min(scores)
    max_score = max(scores)
    
    if max_score == min_score:
        return [0.5] * len(scores)
    
    return [(score - min_score) / (max_score - min_score) for score in scores]

def calculate_moving_average(values: List[float], window: int = 7) -> List[float]:
    """
    Calculate moving average
    
    Args:
        values: List of values
        window: Window size
    
    Returns:
        Moving averages
    """
    if len(values) < window:
        return values
    
    moving_averages = []
    for i in range(len(values)):
        if i < window - 1:
            moving_averages.append(sum(values[:i + 1]) / (i + 1))
        else:
            moving_averages.append(sum(values[i - window + 1:i + 1]) / window)
    
    return moving_averages

def detect_anomalies(values: List[float], threshold: float = 2.0) -> List[bool]:
    """
    Detect anomalies in time series data
    
    Args:
        values: List of values
        threshold: Z-score threshold
    
    Returns:
        List of booleans indicating anomalies
    """
    if len(values) < 3:
        return [False] * len(values)
    
    mean = np.mean(values)
    std = np.std(values)
    
    if std == 0:
        return [False] * len(values)
    
    z_scores = [(x - mean) / std for x in values]
    return [abs(z) > threshold for z in z_scores]

def format_date_range(start_date: datetime, end_date: datetime) -> str:
    """
    Format date range for display
    
    Args:
        start_date: Start date
        end_date: End date
    
    Returns:
        Formatted date range string
    """
    if start_date.date() == end_date.date():
        return start_date.strftime("%B %d, %Y")
    
    if start_date.year == end_date.year:
        if start_date.month == end_date.month:
            return f"{start_date.strftime('%B %d')} - {end_date.strftime('%d, %Y')}"
        return f"{start_date.strftime('%B %d')} - {end_date.strftime('%B %d, %Y')}"
    
    return f"{start_date.strftime('%B %d, %Y')} - {end_date.strftime('%B %d, %Y')}"

def safe_json_serialize(obj: Any) -> Any:
    """
    Safely serialize object to JSON
    
    Args:
        obj: Object to serialize
    
    Returns:
        JSON-serializable object
    """
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, timedelta):
        return str(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif hasattr(obj, "__dict__"):
        return obj.__dict__
    else:
        return str(obj)

def parse_date_string(date_str: str, formats: List[str] = None) -> Optional[datetime]:
    """
    Parse date string with multiple format attempts
    
    Args:
        date_str: Date string
        formats: List of format strings
    
    Returns:
        Parsed datetime or None
    """
    if formats is None:
        formats = [
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%m/%d/%Y"
        ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    return None

def batch_process(items: List[Any], batch_size: int = 100):
    """
    Process items in batches
    
    Args:
        items: List of items
        batch_size: Batch size
    
    Yields:
        Batches of items
    """
    for i in range(0, len(items), batch_size):
        yield items[i:i + batch_size]

def calculate_percent_change(old_value: float, new_value: float) -> float:
    """
    Calculate percentage change
    
    Args:
        old_value: Old value
        new_value: New value
    
    Returns:
        Percentage change
    """
    if old_value == 0:
        return 0 if new_value == 0 else 100
    
    return ((new_value - old_value) / abs(old_value)) * 100