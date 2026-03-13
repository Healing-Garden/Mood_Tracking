from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
import logging
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import random
from src.database import mongodb, redis_client
from bson import ObjectId
import json

router = APIRouter()
logger = logging.getLogger(__name__)

# -------------------- Mood Mapping --------------------
# moodLevel 1=very sad/very low, 2=sad/low, 3=neutral, 4=happy/good, 5=very happy/great
MOOD_TO_LEVEL: Dict[str, List[int]] = {
    "very sad": [1],
    "very low": [1],
    "sad": [1, 2],
    "low": [1, 2],
    "anxious": [1, 2],
    "stressed": [1, 2],
    "angry": [1, 2],
    "tired": [1, 2],
    "overwhelmed": [1, 2],
    "neutral": [2, 3, 4],
    "okay": [2, 3, 4],
    "happy": [3, 4, 5],
    "good": [3, 4, 5],
    "great": [4, 5],
    "very happy": [4, 5],
}

def get_mood_levels(mood: Optional[str]) -> Optional[List[int]]:
    if not mood:
        return None
    mood_lower = mood.lower().strip()
    return MOOD_TO_LEVEL.get(mood_lower, [1, 2, 3])

# -------------------- Models --------------------
class ActionRequest(BaseModel):
    user_id: str
    current_mood: Optional[str] = None
    energy_level: Optional[int] = None
    context: Optional[str] = None
    count: int = 3
    exclude_ids: List[str] = Field(default_factory=list)

class ActionItem(BaseModel):
    id: str
    title: str
    description: str
    type: str
    duration_seconds: int = 60
    difficulty: str = "easy"
    mood_category: List[str] = Field(default_factory=list)
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    content: Optional[str] = None


class ActionCompletionLog(BaseModel):
    user_id: str
    action_id: str
    duration_seconds: int
    mood_at_time: Optional[str] = None
    source: Optional[str] = "suggestion"
    post_mood_score: Optional[float] = None


class EligibilityRequest(BaseModel):
    user_id: str


class EligibilityResponse(BaseModel):
    eligible: bool

# -------------------- Helper Functions --------------------
async def get_user_enhanced_context(db, user_id: str) -> Dict[str, Any]:
    """Retrieve data from Onboarding and Journals to enhance analysis."""
    context = {
        "onboarding_goals": [],
        "onboarding_challenges": [],
        "recent_journal_sentiment": None,
        "recent_journal_themes": []
    }
    
    try:
        # 1. Fetch Onboarding Data
        onboarding = await db.onboardings.find_one({"user": user_id})
        if not onboarding:
            try:
                onboarding = await db.onboardings.find_one({"user": ObjectId(user_id)})
            except:
                onboarding = None
            
        if onboarding:
            context["onboarding_goals"] = onboarding.get("goals", [])
            context["onboarding_challenges"] = onboarding.get("challenges", [])
            
        # 2. Fetch Recent Journals (last 3 entries)
        journals_cursor = db.journal_entries.find({"user_id": user_id}).sort("created_at", -1).limit(3)
        recent_journals = await journals_cursor.to_list(length=3)
        
        if recent_journals:
            themes = []
            sentiments = []
            for j in recent_journals:
                if j.get("sentiment"):
                    sentiments.append(j["sentiment"])
                # Extract some keywords from content if possible (simplified for now)
                content = j.get("content", "").lower()
                if "work" in content or "job" in content: themes.append("work")
                if "family" in content: themes.append("family")
                if "sleep" in content: themes.append("sleep")
            
            context["recent_journal_themes"] = list(set(themes))
            if sentiments:
                context["recent_journal_sentiment"] = sentiments[0] 
                
    except Exception as e:
        logger.error(f"Error fetching enhanced context: {e}")
        
    return context

def convert_doc_to_action(doc: Dict[str, Any], collection_type: str) -> ActionItem:
    doc_id = str(doc["_id"])
    title = doc.get("title", "Untitled")
    doc_type = doc.get("type", collection_type)
    mood_level = doc.get("moodLevel", 3)
    description = doc.get("description") or doc.get("content") or ""

    if not description and doc.get("content"):
        description = doc["content"]

    author = doc.get("author", "")
    if doc_type == "quote" and author and description and not description.startswith(f"— {author}"):
        description = f'"{description}"\n— {author}' if description else f"— {author}"

    metadata = doc.get("metadata", {}) or {}
    duration_seconds = metadata.get("duration_seconds", 60) or 60
    difficulty = metadata.get("difficulty", "easy") or "easy"
    mood_tags = metadata.get("mood_tags", []) or []

    if not mood_tags:
        if mood_level <= 1: mood_tags = ["very sad", "very low"]
        elif mood_level <= 2: mood_tags = ["sad", "low", "anxious", "stressed"]
        elif mood_level == 3: mood_tags = ["neutral", "okay"]
        elif mood_level == 4: mood_tags = ["happy", "good"]
        else: mood_tags = ["happy", "great", "very happy"]

    return ActionItem(
        id=doc_id,
        title=title,
        description=description,
        type=doc_type,
        duration_seconds=duration_seconds,
        difficulty=difficulty,
        mood_category=mood_tags,
        thumbnail=doc.get("thumbnail"),
        video_url=doc.get("videoUrl"),
        content=doc.get("content"),
    )

async def fetch_actions_from_new_tables(
    db,
    mood: Optional[str] = None,
    enhanced_context: Optional[Dict] = None,
    exclude_ids: Optional[set] = None,
    limit: int = 50,
) -> List[Dict]:
    """Fetch from healingvideos, healingarticles using multiple data points (no quotes)."""
    oid_excludes = []
    if exclude_ids:
        for eid in exclude_ids:
            try:
                if isinstance(eid, str) and len(eid) == 24: oid_excludes.append(ObjectId(eid))
            except: pass

    base_filter: Dict[str, Any] = {"is_active": True}
    if oid_excludes: base_filter["_id"] = {"$nin": oid_excludes}

    # Combine data points for filtering
    # 1. Primary filter by Mood Level
    mood_levels = get_mood_levels(mood)
    
    all_docs: List[Dict] = []
    collections = ["healingvideos", "healingpodcasts"]
    
    # Try multiple strategies to find best content
    strategies = [
        # Strategy A: Match mood level (Priority)
        {"moodLevel": {"$in": mood_levels}} if mood_levels else None,
        # Strategy B: Broaden to neutral if no results
        {"moodLevel": 3} if mood_levels and 1 in mood_levels else None,
        # Strategy C: Unfiltered fallback
        {}
    ]

    for strategy in filter(None, strategies):
        if len(all_docs) >= limit: break
        
        current_filter = {**base_filter, **strategy}
        # Avoid duplicates
        if all_docs:
            existing_ids = [d["_id"] for d in all_docs]
            if "_id" in current_filter:
                current_filter["_id"]["$nin"].extend(existing_ids)
            else:
                current_filter["_id"] = {"$nin": existing_ids + oid_excludes}

        for col_name in collections:
            try:
                cursor = db[col_name].find(current_filter).limit(10)
                docs = await cursor.to_list(length=10)
                for doc in docs: doc["_source_collection"] = col_name
                all_docs.extend(docs)
            except: pass
            
    return all_docs

# -------------------- Endpoints --------------------
@router.post("/suggest")
async def suggest_actions(request: ActionRequest):
    logger.info(f"Enhanced suggestion request for {request.user_id}, mood={request.current_mood}")
    try:
        db = mongodb.get_db()
        
        # 1. ANALYZE SYSTEM: Combine 3 Data Sources
        # Source 1: Quick Check-in (Mood/Energy)
        current_mood = request.current_mood.lower().strip() if request.current_mood else None
        
        # Source 2 & 3: Onboarding & Journals
        enhanced_context = await get_user_enhanced_context(db, request.user_id)
        
        # 2. FETCH: Only from 3 healing tables (No healingcontents)
        actions_docs = await fetch_actions_from_new_tables(
            db, 
            mood=current_mood, 
            enhanced_context=enhanced_context,
            exclude_ids=set(request.exclude_ids)
        )

        if not actions_docs:
            fallback = get_fallback_actions(request.count)
            return {
                "actions": [a.dict() for a in fallback],
                "context": {"fallback": True, "reason": "empty_library", "enhanced": True},
                "suggested_at": datetime.now().isoformat()
            }

        # 3. SCORE & RE-RANK based on Onboarding Goals and Journal Themes
        all_actions = []
        for doc in actions_docs:
            # Derive type from collection; default to 'video'
            col_type = doc.get("_source_collection", "healingvideos").replace("healing", "").rstrip("s")
            action = convert_doc_to_action(doc, col_type)
            
            # Simple Scoring Logic
            score = 0
            # Boost if action title matches user goals
            for goal in enhanced_context.get("onboarding_goals", []):
                if goal.lower() in action.title.lower() or goal.lower() in action.description.lower():
                    score += 2
                    
            # Boost if matches journal themes
            for theme in enhanced_context.get("recent_journal_themes", []):
                if theme in action.description.lower():
                    score += 1
            
            all_actions.append((score, action))

        # Sort by score DESC, then random
        all_actions.sort(key=lambda x: (x[0], random.random()), reverse=True)
        selected = [item[1] for item in all_actions[:request.count]]

        # Pad with fallback if needed
        if len(selected) < request.count:
            selected.extend(get_fallback_actions(request.count - len(selected)))

        final_actions = [a.dict() for a in selected]

        # Log Interaction
        await db.ai_interactions.insert_one({
            "user_id": request.user_id,
            "type": "action_suggestion",
            "content": {
                "actions": final_actions,
                "context": {
                    "mood": current_mood,
                    "enhanced": enhanced_context
                }
            },
            "created_at": datetime.now()
        })

        return {
            "actions": final_actions,
            "context": {
                "mood": current_mood,
                "analysis_sources": ["dailycheckins", "onboardings", "journal_entries"],
                "personalized_scores": True
            },
            "suggested_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        fallback = get_fallback_actions(request.count)
        return {"actions": [a.dict() for a in fallback], "context": {"error": str(e)}, "suggested_at": datetime.now().isoformat()}

@router.post("/log_completion")
async def log_action_completion(log: ActionCompletionLog):
    """
    Ghi nhận completion của một action:
    - duration_seconds: thời gian thực hiện
    - mood_at_time: mood lúc bắt đầu (từ quickcheckin)
    - post_mood_score: mood sau khi hoàn thành (thang 1–10)
    """
    try:
        db = mongodb.get_db()
        now = datetime.now()
        await db.ai_interactions.insert_one({
            "user_id": log.user_id,
            "type": "action_completed",
            "content": {
                "action_id": log.action_id,
                "duration_seconds": log.duration_seconds,
                "mood_at_time": log.mood_at_time,
                "post_mood_score": log.post_mood_score,
                "source": log.source,
            },
            "created_at": now
        })
        return {"success": True, "message": "Action completion logged"}
    except Exception as e:
        logger.error(f"Failed to log action completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/eligibility", response_model=EligibilityResponse)
async def check_suggest_actions_eligibility(request: EligibilityRequest):
    """
    Điều kiện hiển thị suggest actions:
    - PHẢI có ít nhất 1 journal gần đây với tâm trạng tệ.
    - Quickcheckin chỉ là điều kiện bổ sung hoặc đã hoàn thành.
    """
    try:
        db = mongodb.get_db()
        try:
            user_obj_id = ObjectId(request.user_id)
        except Exception:
            user_obj_id = request.user_id

        now = datetime.now()
        since_journal = now - timedelta(days=7)

        # BẮT BUỘC: Có ít nhất 1 nhật ký tâm trạng tệ trong 7 ngày qua
        negative_moods = {"very sad", "very low", "sad", "low", "anxious", "stressed", "angry", "tired", "overwhelmed"}
        user_ids = [request.user_id]
        if user_obj_id is not None:
            user_ids.insert(0, user_obj_id)
        bad_journals = await db.journal_entries.find(
            {
                "user_id": {"$in": user_ids},
                "created_at": {"$gte": since_journal},
                "deleted_at": None
            },
            {
                "mood": 1,
                "sentiment": 1
            }
        ).to_list(length=50)

        is_mood_bad = False
        for j in bad_journals:
            mood = str(j.get("mood", "")).lower()
            if mood in negative_moods:
                is_mood_bad = True
                break
            sent = j.get("sentiment") or {}
            if isinstance(sent, dict) and sent.get("sentiment") == "negative":
                is_mood_bad = True
                break

        if not is_mood_bad:
            return EligibilityResponse(eligible=False)

        # Kiểm tra thêm nếu user đã hoàn thành Quick Check-in hôm nay
        # Handle timezone: check both createdAt (Date) and date (String)
        # We look for ANY check-in from today (VN time today or server time today)
        today_str = now.strftime("%Y-%m-%d")
        
        recent_checkin = await db.dailycheckins.find_one(
            {
                "user": user_obj_id,
                "$or": [
                    {"date": today_str},
                    {"createdAt": {"$gte": now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(hours=7)}} # Look back a bit for TZ
                ]
            }
        )
        
        # User đủ điều kiện khi có tâm trạng tệ trong journal VÀ đã check-in hôm nay
        return EligibilityResponse(eligible=True if recent_checkin else False)

    except Exception as e:
        logger.error(f"Eligibility check failed: {e}")
        return EligibilityResponse(eligible=False)

# -------------------- Fallbacks --------------------
def get_fallback_actions(count: int = 3) -> List[ActionItem]:
    fallbacks = [
        ActionItem(id="f_1", title="Deep Breathing", description="Focus on your breath for 2 minutes.", type="article", duration_seconds=120),
        ActionItem(id="f_2", title="Gratitude", description="List 3 things you are grateful for.", type="article", duration_seconds=180),
        ActionItem(id="f_3", title="Short Walk", description="Fresh air helps clear the mind.", type="article", duration_seconds=600),
    ]
    return random.sample(fallbacks, min(count, len(fallbacks)))