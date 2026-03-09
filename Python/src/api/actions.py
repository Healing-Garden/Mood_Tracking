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

# -------------------- Pydantic Models --------------------
class ActionRequest(BaseModel):
    user_id: str
    current_mood: Optional[str] = None
    energy_level: Optional[int] = None
    context: Optional[str] = None
    count: int = 3
    exclude_ids: List[str] = Field(default_factory=list)  # for "show more"

class ActionItem(BaseModel):
    id: str
    title: str
    description: str
    type: str  # "quote", "video", "article", "exercise", "breathing", "meditation", "activity"
    duration_min: int
    difficulty: str = "easy"
    mood_category: List[str] = Field(default_factory=list)

class ActionResponse(BaseModel):
    actions: List[ActionItem]
    context: Dict[str, Any]
    suggested_at: datetime

class CompletionLog(BaseModel):
    user_id: str
    action_id: str
    duration_seconds: int
    mood_at_time: Optional[str] = None
    source: str = "suggestion"  # or "explore"

class SkipLog(BaseModel):
    user_id: str
    mood: Optional[str] = None
    shown_actions: List[str]  # IDs of actions that were shown
    reason: Optional[str] = None

# -------------------- Helper Functions --------------------
def convert_healing_content_to_action(content: Dict[str, Any]) -> ActionItem:
    """Convert a healing_contents document to ActionItem."""
    # Extract metadata safely
    metadata = content.get("metadata", {})
    return ActionItem(
        id=str(content["_id"]),
        title=content["title"],
        description=content.get("description") or content.get("content", ""),
        type=content.get("type", "unknown"),
        duration_min=metadata.get("duration_min", 1),
        difficulty=metadata.get("difficulty", "easy"),
        mood_category=metadata.get("mood_tags", [])
    )

async def get_recently_suggested_ids(db, user_id: str, hours: int = 24) -> set:
    """Get IDs of actions suggested to user in last N hours."""
    pipeline = [
        {"$match": {"user_id": user_id, "type": "action_suggestion", 
                    "created_at": {"$gte": datetime.now() - timedelta(hours=hours)}}},
        {"$unwind": "$content.actions"},
        {"$group": {"_id": "$content.actions.id"}}
    ]
    cursor = db.ai_interactions.aggregate(pipeline)
    results = await cursor.to_list(length=1000)
    return {r["_id"] for r in results if r["_id"]}

async def get_popular_action_ids(db, user_id: str, limit: int = 10) -> List[str]:
    """Get IDs of actions most frequently completed by user."""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$action_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    cursor = db.action_completions.aggregate(pipeline)
    results = await cursor.to_list(length=limit)
    return [str(r["_id"]) for r in results if r["_id"]]

async def fetch_actions_from_db(
    db, 
    mood: Optional[str] = None, 
    exclude_ids: Optional[set] = None,
    limit: int = 50,
    include_general: bool = True
) -> List[Dict]:
    """
    Fetch active actions from healingcontents.
    """
    # Fix collection name: Mongoose model 'HealingContent' defaults to 'healingcontents'
    collection_name = "healingcontents"
    
    base_filter = {
        "is_active": True
    }
    
    # Optional duration filter - make it more lenient (10 min instead of 5)
    # base_filter["metadata.duration_min"] = {"$lte": 15}

    # Better filtering of exclude_ids
    if exclude_ids:
        from bson import ObjectId
        oid_excludes = []
        for eid in exclude_ids:
            try:
                if isinstance(eid, str) and len(eid) == 24:
                    oid_excludes.append(ObjectId(eid))
            except:
                pass
        if oid_excludes:
            base_filter["_id"] = {"$nin": oid_excludes}
    
    actions = []
    
    # 1. Actions matching mood (if mood provided)
    if mood:
        mood_filter = base_filter.copy()
        mood_filter["metadata.mood_tags"] = mood
        cursor = db[collection_name].find(mood_filter).limit(limit)
        mood_actions = await cursor.to_list(length=limit)
        actions.extend(mood_actions)
    
    # 2. If include_general or no mood, add general actions
    if include_general or not mood:
        general_filter = base_filter.copy()
        # Exclude those with specifically different mood tags if needed, 
        # or just fetch general items (empty mood_tags)
        general_filter["$or"] = [
            {"metadata.mood_tags": {"$exists": False}},
            {"metadata.mood_tags": []},
            {"metadata.mood_tags": {"$size": 0}}
        ]
        
        # Exclude already fetched IDs
        if actions:
            fetched_ids = [a["_id"] for a in actions]
            if "_id" in general_filter and "$nin" in general_filter["_id"]:
                general_filter["_id"]["$nin"].extend(fetched_ids)
            else:
                general_filter["_id"] = {"$nin": fetched_ids}
                
        cursor = db[collection_name].find(general_filter).limit(limit)
        general_actions = await cursor.to_list(length=limit)
        actions.extend(general_actions)
    
    return actions

async def get_cached_actions_by_mood(mood: Optional[str]) -> Optional[List[Dict]]:
    """Try to get actions from Redis cache."""
    if not mood:
        key = "actions:general"
    else:
        key = f"actions:mood:{mood}"
    cached = await redis_client.get(key)
    if cached:
        return json.loads(cached)
    return None

async def cache_actions_by_mood(mood: Optional[str], actions: List[Dict], ttl: int = 3600):
    """Cache actions in Redis."""
    if not mood:
        key = "actions:general"
    else:
        key = f"actions:mood:{mood}"
    # Convert ObjectId to string for JSON serialization
    serializable = []
    for a in actions:
        a_copy = a.copy()
        a_copy["_id"] = str(a_copy["_id"])
        serializable.append(a_copy)
    await redis_client.set(key, json.dumps(serializable), expire=ttl)

# -------------------- Endpoints --------------------
@router.post("/suggest") # Removed response_model for debugging
async def suggest_actions(request: ActionRequest):
    """
    Suggest practical actions based on user's mood and history.
    Implements UC-23 with personalization and fallback.
    """
    logger.info(f"Action suggestion request for user {request.user_id}, mood={request.current_mood}")
    try:
        db = mongodb.get_db()
        user_id = request.user_id
        mood = request.current_mood.lower() if request.current_mood else None
        count = request.count
        exclude_ids = set(request.exclude_ids)
        
        # 1. Try cache first (optional, can be skipped for real-time personalization)
        # cached = await get_cached_actions_by_mood(mood)
        # if cached:
        #     actions_docs = cached
        # else:
        #     actions_docs = await fetch_actions_from_db(db, mood, exclude_ids, limit=100, include_general=True)
        #     await cache_actions_by_mood(mood, actions_docs)
        
        # For better personalization, we fetch fresh data
        actions_docs = await fetch_actions_from_db(db, mood, exclude_ids, limit=100, include_general=True)
        
        if not actions_docs:
            # Fallback: use hardcoded actions if DB empty
            logger.warning(f"No actions found in DB for mood {mood}, using fallback")
            fallback = get_fallback_actions(count)
            return {
                "actions": [a.dict() for a in fallback],
                "context": {"fallback": True, "reason": "empty_library"},
                "suggested_at": datetime.now().isoformat()
            }
        
        # Convert to ActionItem
        all_actions = []
        for doc in actions_docs:
            try:
                all_actions.append(convert_healing_content_to_action(doc))
            except Exception as e:
                logger.error(f"Error converting doc {doc.get('_id')} to ActionItem: {e}")

        # If conversion resulted in no actions
        if not all_actions:
             logger.warning("All fetched documents failed conversion. Using fallback.")
             fallback = get_fallback_actions(count)
             return {
                "actions": [a.dict() for a in fallback],
                "context": {"fallback": True, "reason": "conversion_failed"},
                "suggested_at": datetime.now().isoformat()
            }

        # 4. Filter out exclude_ids again just in case (already done in query but safety first)
        final_actions = [a.dict() for a in all_actions[:count]]
        
        return {
            "actions": final_actions,
            "context": {"fallback": False, "mood": mood},
            "suggested_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in suggest_actions: {e}", exc_info=True)
        # Final safety fallback
        try:
            fallback = get_fallback_actions(request.count)
            return {
                "actions": [a.dict() for a in fallback],
                "context": {"fallback": True, "error": str(e)},
                "suggested_at": datetime.now().isoformat()
            }
        except:
             raise HTTPException(status_code=500, detail=f"Critical error: {str(e)}")
        
        # 3. If too few available, we may need to include some recently suggested but with lower priority?
        # According to use case, we should avoid repetition, but if library is small, we might repeat after some time.
        # Here we prioritize fresh, but if less than count, we'll use some from recent (but not exclude_ids).
        if len(available) < count:
            # Add back actions that were recently suggested but not in exclude_ids, with lower priority
            recent_but_not_excluded = [a for a in all_actions if a.id in recent_ids and a.id not in exclude_ids]
            # Shuffle them to avoid always suggesting the same
            random.shuffle(recent_but_not_excluded)
            available.extend(recent_but_not_excluded)
        
        # 4. Personalize: sort by popularity (frequently completed)
        popular_ids = await get_popular_action_ids(db, user_id)
        
        def sort_key(action: ActionItem):
            # Popular actions first, then random
            return (action.id in popular_ids, random.random())
        
        available.sort(key=sort_key, reverse=True)
        
        # 5. Select top 'count'
        selected = available[:count]
        
        # 6. If still not enough, pad with general fallback (should not happen but safe)
        if len(selected) < count:
            needed = count - len(selected)
            fallback = get_fallback_actions(needed)
            selected.extend(fallback)
        
        # 7. Log suggestion to ai_interactions
        await db.ai_interactions.insert_one({
            "user_id": user_id,
            "type": "action_suggestion",
            "content": {
                "actions": [a.dict() for a in selected],
                "context": {
                    "current_mood": mood,
                    "energy_level": request.energy_level,
                    "user_context": request.context,
                    "exclude_ids": list(exclude_ids) if exclude_ids else None
                }
            },
            "created_at": datetime.now()
        })
        
        return ActionResponse(
            actions=selected,
            context={
                "current_mood": mood,
                "energy_level": request.energy_level,
                "filtered_by_duration": True,
                "personalized": True,
                "total_candidates": len(all_actions),
                "recent_excluded": len(recent_ids)
            },
            suggested_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Failed to suggest actions: {e}", exc_info=True)
        # Fallback: return generic actions
        fallback = get_fallback_actions(request.count)
        return ActionResponse(
            actions=fallback,
            context={"fallback": True, "error": str(e)},
            suggested_at=datetime.now()
        )

@router.post("/log_completion")
async def log_action_completion(log: CompletionLog):
    """Log when a user completes an action."""
    try:
        db = mongodb.get_db()
        
        # Validate that action exists (optional)
        action = await db.healing_contents.find_one({"_id": ObjectId(log.action_id)})
        if not action:
            logger.warning(f"Action {log.action_id} not found, but logging anyway")
            title = "Unknown"
        else:
            title = action.get("title", "Unknown")
        
        await db.action_completions.insert_one({
            "user_id": log.user_id,
            "action_id": log.action_id,
            "action_title": title,
            "duration_seconds": log.duration_seconds,
            "completed_at": datetime.now(),
            "metadata": {
                "mood_at_time": log.mood_at_time,
                "source": log.source
            }
        })
        
        return {"success": True, "message": "Action completion logged"}
        
    except Exception as e:
        logger.error(f"Failed to log action completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/skip")
async def log_skip(skip: SkipLog):
    """Log when user skips suggestions."""
    try:
        db = mongodb.get_db()
        
        await db.ai_interactions.insert_one({
            "user_id": skip.user_id,
            "type": "action_skip",
            "content": {
                "mood": skip.mood,
                "shown_actions": skip.shown_actions,
                "reason": skip.reason
            },
            "created_at": datetime.now()
        })
        
        return {"success": True, "message": "Skip logged"}
        
    except Exception as e:
        logger.error(f"Failed to log skip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{user_id}")
async def get_action_history(user_id: str, days: int = 7):
    """Get user's action completion history."""
    try:
        db = mongodb.get_db()
        since_date = datetime.now() - timedelta(days=days)
        
        completions = await db.action_completions.find({
            "user_id": user_id,
            "completed_at": {"$gte": since_date}
        }).sort("completed_at", -1).to_list(length=1000)
        
        # Enhance with action details (optional)
        for c in completions:
            c["_id"] = str(c["_id"])
            c["action_id"] = str(c["action_id"])
            c["completed_at"] = c["completed_at"].isoformat()
        
        # Compute stats
        total = len(completions)
        by_type = {}
        for c in completions:
            atype = c.get("action_type", "unknown")  # not stored directly, could fetch from healing_contents
            by_type[atype] = by_type.get(atype, 0) + 1
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_completions": total,
            "completions": completions,
            "stats": {
                "by_type": by_type,
                "daily_average": total / days if days > 0 else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get action history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- Fallback Actions --------------------
def get_fallback_actions(count: int = 3) -> List[ActionItem]:
    """Return hardcoded fallback actions when DB unavailable."""
    fallbacks = [
        ActionItem(
            id="fallback_breathing",
            title="Deep Breathing",
            description="Take 5 deep breaths, inhaling for 4 seconds and exhaling for 6.",
            type="breathing",
            duration_min=2,
            difficulty="easy",
            mood_category=["anxious", "stressed", "tired"]
        ),
        ActionItem(
            id="fallback_stretch",
            title="Quick Stretch",
            description="Stand up and stretch your arms overhead for 30 seconds.",
            type="exercise",
            duration_min=1,
            difficulty="easy",
            mood_category=["tired", "stressed"]
        ),
        ActionItem(
            id="fallback_gratitude",
            title="Gratitude Moment",
            description="Write down 3 things you're grateful for.",
            type="activity",
            duration_min=2,
            difficulty="easy",
            mood_category=["sad", "anxious", "neutral"]
        ),
        ActionItem(
            id="fallback_mindful",
            title="Mindful Moment",
            description="Notice 3 things you can see, 2 you can hear, and 1 you can feel.",
            type="meditation",
            duration_min=1,
            difficulty="easy",
            mood_category=["anxious", "overwhelmed", "neutral"]
        )
    ]
    # Return random selection of 'count'
    return random.sample(fallbacks, min(count, len(fallbacks)))