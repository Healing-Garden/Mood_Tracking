import re
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

VIETNAMESE_PATTERNS = [
    r"(tôi|mình|em)\s+(không muốn sống|muốn chết|tự tử|tự sát)",
    r"buông xuôi",
    r"kết thúc cuộc đời",
    r"chết đi",
    r"không còn muốn sống",
    r"tự tử",
    r"tự sát",
]

ENGLISH_PATTERNS = [
    r"\b(kill|end|take)\s+(myself|my life|my own life)\b",
    r"\b(commit|attempt)\s+suicide\b",
    r"\bwant\s+to\s+die\b",
    r"\bbetter\s+off\s+dead\b",
    r"\bno\s+reason\s+to\s+live\b",
    r"\bharm\s+myself\b",
    r"\bsuicidal\b",
    r"\bcut(\s+myself)?\b",
    r"\bhang\s+myself\b",
    r"\boverdose\b",
]


def detect_crisis(text: str) -> Tuple[bool, int, str]:
    text_lower = text.lower()

    for pattern in VIETNAMESE_PATTERNS:
        if re.search(pattern, text_lower):
            logger.warning(f"Crisis detected (VI): '{pattern}' in '{text[:50]}...'")
            return True, 9, "vi"

    for pattern in ENGLISH_PATTERNS:
        if re.search(pattern, text_lower):
            logger.warning(f"Crisis detected (EN): '{pattern}' in '{text[:50]}...'")
            return True, 9, "en"

    return False, 0, ""


def get_crisis_response(language: str) -> str:
    if language == "vi":
        return (
            "Mình thật sự lo lắng về những gì bạn đang chia sẻ.\n\n"
            "**Hãy tìm sự hỗ trợ ngay lúc này:**\n"
            "• Cấp cứu: 115 (Việt Nam)\n"
            "• Tổng đài hỗ trợ tâm lý: 1900 6233 (VN)\n\n"
            "Bạn không hề đơn độc. Mình có thể ở đây nói chuyện cùng bạn."
        )

    return (
        "I'm really concerned about what you're sharing.\n\n"
        "**Please reach out for support right now:**\n"
        "• Emergency: 115 (VN) or your local emergency number\n"
        "• Crisis Hotline: 1900 6233 (VN)\n\n"
        "You're not alone. I'm here with you."
    )
