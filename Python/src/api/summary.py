from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel
from src.database import mongodb
from src.core.summarization import summarization_service
from src.core.daily_summary_generator import DailySummaryGenerator
from bson import ObjectId

router = APIRouter()
logger = logging.getLogger(__name__)

class DailySummaryRequest(BaseModel):
    user_id: str
    date: Optional[str] = None  
    force_regenerate: bool = False  

class DailySummaryResponse(BaseModel):
    summary: str
    metadata: dict
    generated_at: datetime
    type: str

@router.post("/daily", response_model=DailySummaryResponse)
async def generate_daily_summary(request: DailySummaryRequest):
    try:
        if request.date:
            target_date = datetime.strptime(request.date, "%Y-%m-%d")
        else:
            target_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        start_of_day = target_date
        end_of_day = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

        db = mongodb.get_db()

        # Parse user_id -> ObjectId when possible (dailycheckins uses ObjectId)
        user_object_id = None
        try:
            user_object_id = ObjectId(request.user_id)
        except Exception:
            user_object_id = None

        if not request.force_regenerate:
            existing_query_ids = [request.user_id]
            if user_object_id is not None:
                existing_query_ids.insert(0, user_object_id)

            existing = await db.daily_summaries.find_one({
                "user_id": {"$in": existing_query_ids},
                "date": target_date
            })
            if existing:
                return DailySummaryResponse(
                    summary=existing["summary"],
                    metadata=existing["metadata"],
                    generated_at=existing["generated_at"],
                    type="cached"
                )
        
        # Get journal entries for the day (support ObjectId + string, and deleted_at missing/empty)
        journal_user_ids = [request.user_id]
        if user_object_id is not None:
            journal_user_ids.insert(0, user_object_id)

        entries = await db.journal_entries.find({
            "user_id": {"$in": journal_user_ids},
            "created_at": {"$gte": start_of_day, "$lte": end_of_day},
            "deleted_at": {"$in": [None, ""]}
        }).to_list(length=None)

        if not entries:
            entries = await db.journal_entries.find({
                "user_id": {"$in": journal_user_ids},
                "created_at": {"$gte": start_of_day, "$lte": end_of_day},
                "deleted_at": {"$exists": False}
            }).to_list(length=None)
        
        # Get mood entries for the day (DailyCheckIn schema: user(ObjectId), date(YYYY-MM-DD), energy)
        target_date_str = target_date.strftime("%Y-%m-%d")
        moods = []
        if user_object_id is not None:
            moods = await db.dailycheckins.find(
                {"user": user_object_id, "date": target_date_str},
                {"date": 1, "createdAt": 1, "created_at": 1, "mood": 1, "energy": 1, "user": 1}
            ).to_list(length=None)

        if not moods:
            moods = await db.dailycheckins.find(
                {"user": request.user_id, "date": target_date_str},
                {"date": 1, "createdAt": 1, "created_at": 1, "mood": 1, "energy": 1, "user": 1}
            ).to_list(length=None)
        
        # Generate summary
        generator = DailySummaryGenerator()
        result = await generator.generate(request.user_id, request.date, entries, moods)

        if result["type"] == "empty_day":
            # Không lưu vào daily_summaries, chỉ trả về
            return DailySummaryResponse(
                summary=result["summary"],
                metadata=result["metadata"],
                generated_at=datetime.now(),
                type="empty_day"
            )
        
        now = datetime.now()
        summary_doc = {
            "user_id": user_object_id if user_object_id is not None else request.user_id,
            "date": target_date,
            "summary": result["summary"],
            "metadata": result["metadata"],
            "generated_at": now,
            "updated_at": now
        }

        await db.daily_summaries.update_one(
            {"user_id": summary_doc["user_id"], "date": target_date},
            {"$set": {"summary": summary_doc["summary"], "metadata": summary_doc["metadata"], "generated_at": summary_doc["generated_at"], "updated_at": summary_doc["updated_at"]}, "$setOnInsert": {"created_at": now}},
            upsert=True
        )
        
        # Store the interaction
        await db.ai_interactions.insert_one({
            "user_id": request.user_id,
            "type": "daily_summary",
            "content": {
                "summary": result["summary"],
                "date": target_date.isoformat(),
                "entry_count": result["metadata"]["entry_count"],
                "mood_count": result["metadata"]["mood_count"]
            },
            "created_at": now
        })
        
        return DailySummaryResponse(
            summary=result["summary"],
            metadata=result["metadata"],
            generated_at=now,
            type=result["type"]
        )

    except Exception as e:
        logger.error(f"Failed to generate daily summary: {e}")
        # Fallback: dùng summarization_service cũ (exception 2-EF)
        try:
            # Gọi summarization_service.generate_daily_summary (vẫn giữ)
            fallback_result = await summarization_service.generate_daily_summary(entries, moods)
            summary = fallback_result["summary"]
            f_type = fallback_result["type"]
        except:
            # Nếu cả AI cũ cũng lỗi, dùng cứng
            summary = f"Today you recorded {len(entries)} journal entries and {len(moods)} mood check-ins. Keep up the good work!"
            f_type = "fallback"

        return DailySummaryResponse(
            summary=summary,
            metadata={"fallback": True, "error": str(e)},
            generated_at=datetime.now(),
            type=f_type
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