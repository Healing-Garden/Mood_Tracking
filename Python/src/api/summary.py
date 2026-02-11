from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel
from src.database import mongodb
from src.core.summarization import summarization_service

router = APIRouter()
logger = logging.getLogger(__name__)

class DailySummaryRequest(BaseModel):
    user_id: str
    date: Optional[str] = None # Format: YYYY-MM-DD

class DailySummaryResponse(BaseModel):
    summary: str
    metadata: dict
    generated_at: datetime
    type: str

@router.post("/daily", response_model=DailySummaryResponse)
async def generate_daily_summary(request: DailySummaryRequest):
    try:
        # Parse date or use today
        if request.date:
            target_date = datetime.strptime(request.date, "%Y-%m-%d")
        else:
            target_date = datetime.now()
        
        # Calculate date range (00:00:00 to 23:59:59)
        start_of_day = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
        end_of_day = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)
        
        db = mongodb.get_db()
        
        # Get journal entries for the day
        entries = await db.journal_entries.find({
            "user_id": request.user_id,
            "created_at": {"$gte": start_of_day, "$lte": end_of_day},
            "deleted_at": None
        }).to_list(length=None)
        
        # Get mood entries for the day
        moods = await db.mood_entries.find({
            "user_id": request.user_id,
            "created_at": {"$gte": start_of_day, "$lte": end_of_day}
        }).to_list(length=None)
        
        # Generate summary
        summary_result = await summarization_service.generate_daily_summary(entries, moods)
        
        # Store the interaction
        await db.ai_interactions.insert_one({
            "user_id": request.user_id,
            "type": "daily_summary",
            "content": {
                "summary": summary_result["summary"],
                "date": target_date.isoformat(),
                "entry_count": len(entries),
                "mood_count": len(moods)
            },
            "created_at": datetime.now()
        })
        
        return DailySummaryResponse(
            summary=summary_result["summary"],
            metadata={
                "entry_count": len(entries),
                "mood_count": len(moods),
                "date": target_date.isoformat(),
                "summary_type": summary_result["type"]
            },
            generated_at=datetime.now(),
            type=summary_result["type"]
        )
        
    except Exception as e:
        logger.error(f"Failed to generate daily summary: {e}")
        
        # Fallback response
        return DailySummaryResponse(
            summary="Today was a day of experiences. Every moment is an opportunity for growth and learning.",
            metadata={"fallback": True, "error": str(e)},
            generated_at=datetime.now(),
            type="fallback"
        )

@router.post("/weekly")
async def generate_weekly_summary(user_id: str):
    """Generate weekly summary (aggregate of 7 days)"""
    try:
        # Get date range (last 7 days)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        db = mongodb.get_db()
        
        # Get journal entries for the week
        entries = await db.journal_entries.find({
            "user_id": user_id,
            "created_at": {"$gte": start_date, "$lte": end_date},
            "deleted_at": None
        }).to_list(length=None)
        
        # Get mood entries for the week
        moods = await db.mood_entries.find({
            "user_id": user_id,
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(length=None)
        
        # Analyze weekly patterns
        from collections import Counter
        mood_counts = Counter([m.get('mood', 'unknown') for m in moods])
        
        # Generate weekly summary
        summary = f"Weekly Review: You recorded {len(entries)} journal entries and {len(moods)} mood check-ins. "
        
        if mood_counts:
            most_common_mood, count = mood_counts.most_common(1)[0]
            summary += f"Your most common mood was '{most_common_mood}' ({count} times). "
        
        if entries:
            summary += "Reflecting on your journal entries shows consistent engagement with your thoughts and feelings. "
        
        summary += "Keep up the good work in your self-care journey!"
        
        return {
            "summary": summary,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "stats": {
                "entry_count": len(entries),
                "mood_count": len(moods),
                "mood_distribution": dict(mood_counts)
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to generate weekly summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))