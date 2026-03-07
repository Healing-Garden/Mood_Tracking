import logging
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
from src.database import mongodb
from src.core.llm import call_llm 

logger = logging.getLogger(__name__)

async def build_user_context(user_id: str):
    db = mongodb.get_db()
    try:
        user_obj_id = ObjectId(user_id)
    except:
        user_obj_id = user_id

    user = await db.users.find_one({"_id": user_obj_id})
    if not user:
        return None

    # Lấy journal gần nhất
    last_journal = await db.journal_entries.find_one(
        {"user_id": user_obj_id}, sort=[("created_at", -1)]
    )
    # Lấy mood check gần nhất
    # Note: BE model uses 'user' for field and 'createdAt' for timestamp
    last_mood = await db.dailycheckins.find_one(
        {"user": user_obj_id}, sort=[("createdAt", -1)]
    )

    return {
        "user_id": str(user_id),
        "name": user.get("fullName", user.get("name", "bạn")),
        "recent_mood": last_mood.get("mood") if last_mood else None,
        "recent_energy": last_mood.get("energy") if last_mood else None,
        "last_journal_snippet": last_journal.get("text", "")[:100] if last_journal else None,
    }

async def generate_notification_content(user_context: dict, category: str, time_of_day: str) -> dict:
    """Gọi LLM để sinh tiêu đề và nội dung thông báo."""
    prompts = {
        "mood_check": (
            f"You are a mental health assistant. Create a reminder notification for {user_context['name']} "
            f"to check their mood. Their recent mood is '{user_context.get('recent_mood', 'unknown')}'. "
            f"The current time of day is {time_of_day}. Write a short message (max 2 sentences), warm and encouraging. "
            "Return as JSON: {\"title\": \"title\", \"content\": \"content\"}"
        ),
        "journal_reminder": (
            f"Remind {user_context['name']} to write a journal entry. They recently wrote: '{user_context.get('last_journal_snippet', 'nothing yet')}'. "
            "Create a short message suggesting a gentle topic to write about. Return as JSON."
        ),
        "hydration": (
            f"Remind {user_context['name']} to drink water. Create a cheerful reminder, possibly including benefits of hydration. Return as JSON."
        ),
        "meditation": (
            f"Remind {user_context['name']} to meditate. Suggest a short breathing exercise or meditation theme suitable for {time_of_day}. Return as JSON."
        ),
         "weekly_insights": (
            f"Create a weekly summary for {user_context['name']} with a gentle, encouraging title and content based on the past week's data. Return as JSON."
        )
    }

    prompt = prompts.get(category, prompts["mood_check"])
    try:
        # Fixed typo: call_lll -> call_llm
        response = await call_llm([{"role": "user", "content": prompt}], temperature=0.7, max_tokens=250)
        text = response["text"]
        text = text.strip().replace("```json", "").replace("```", "")
        import json
        data = json.loads(text)

        title = str(data.get("title", "Reminder")).strip()
        content = str(data.get("content", "")).strip()

        if not content:
            content = "It's time to take a small moment for yourself."

        # Nếu model trả title và content giống hệt nhau, làm nội dung chi tiết hơn
        if title.lower() == content.lower():
            content = f"{content} Take a moment to check in with yourself and practice a bit of self-care."

        return {
            "title": title or "Reminder",
            "content": content
        }
    except Exception as e:
        logger.error(f"Failed to generate content: {e}")
        return {
            "title": "Gentle Reminder",
            "content": "It's time to check in with yourself and practice self-care."
        }

async def suggest_smart_times(user_id: str, category: str, days: int = 30) -> List[str]:
    """Phân tích lịch sử tương tác để đề xuất khung giờ tối ưu."""
    db = mongodb.get_db()
    since = datetime.utcnow() - timedelta(days=days)

    try:
        user_obj_id = ObjectId(user_id)
    except:
        user_obj_id = user_id

    if category == "mood_check":
        cursor = db.dailycheckins.find({
            "user": user_obj_id,
            "createdAt": {"$gte": since}
        }).sort("createdAt", 1)
        time_field = "createdAt"
    elif category == "journal_reminder":
        cursor = db.journal_entries.find({
            "user_id": user_obj_id,
            "created_at": {"$gte": since}
        }).sort("created_at", 1)
        time_field = "created_at"
    else:
        return ["09:00", "20:00"]

    hours = []
    async for doc in cursor:
        dt = doc.get(time_field)
        if dt and isinstance(dt, datetime):
            hours.append(dt.hour)

    if not hours:
        return ["09:00", "20:00"]

    from collections import Counter
    counter = Counter(hours)
    most_common = counter.most_common(2)
    suggested = [f"{h:02d}:00" for h, _ in sorted(most_common)]
    return suggested
