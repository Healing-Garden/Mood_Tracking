from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
from pydantic import BaseModel
from datetime import datetime
import random
from src.database import mongodb

router = APIRouter()
logger = logging.getLogger(__name__)

class ActionRequest(BaseModel):
    user_id: str
    current_mood: Optional[str] = None
    energy_level: Optional[int] = None
    context: Optional[str] = None
    count: int = 3

class ActionItem(BaseModel):
    id: str
    title: str
    description: str
    type: str  # "breathing", "exercise", "meditation", "activity", "quote"
    duration_min: int
    difficulty: str  # "easy", "medium", "hard"
    mood_category: List[str]  # Moods this action is good for

class ActionResponse(BaseModel):
    actions: List[ActionItem]
    context: dict
    suggested_at: datetime

# Predefined actions database (in production, this would be in MongoDB)
ACTIONS_DATABASE = [
    # Breathing exercises
    {
        "id": "breathing_1",
        "title": "Box Breathing",
        "description": "Inhale for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat 5 times.",
        "type": "breathing",
        "duration_min": 3,
        "difficulty": "easy",
        "mood_category": ["anxious", "stressed", "overwhelmed"]
    },
    {
        "id": "breathing_2",
        "title": "4-7-8 Breathing",
        "description": "Inhale for 4 seconds, hold for 7, exhale for 8. Calms the nervous system.",
        "type": "breathing",
        "duration_min": 2,
        "difficulty": "easy",
        "mood_category": ["anxious", "angry", "stressed"]
    },
    
    # Quick exercises
    {
        "id": "exercise_1",
        "title": "5-Minute Stretch",
        "description": "Gentle full-body stretching to release tension.",
        "type": "exercise",
        "duration_min": 5,
        "difficulty": "easy",
        "mood_category": ["tired", "stressed", "anxious"]
    },
    {
        "id": "exercise_2",
        "title": "Energy Boosting Jumping Jacks",
        "description": "30 seconds of jumping jacks to boost energy and mood.",
        "type": "exercise",
        "duration_min": 1,
        "difficulty": "medium",
        "mood_category": ["tired", "sad", "neutral"]
    },
    
    # Mindfulness/Meditation
    {
        "id": "meditation_1",
        "title": "Body Scan Meditation",
        "description": "Focus attention on each part of your body from head to toe.",
        "type": "meditation",
        "duration_min": 5,
        "difficulty": "easy",
        "mood_category": ["anxious", "stressed", "overwhelmed"]
    },
    {
        "id": "meditation_2",
        "title": "Gratitude Moment",
        "description": "List 3 things you're grateful for right now.",
        "type": "meditation",
        "duration_min": 2,
        "difficulty": "easy",
        "mood_category": ["sad", "anxious", "neutral", "tired"]
    },
    
    # Activities
    {
        "id": "activity_1",
        "title": "Nature Connection",
        "description": "Step outside for 5 minutes. Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
        "type": "activity",
        "duration_min": 5,
        "difficulty": "easy",
        "mood_category": ["anxious", "stressed", "tired", "sad"]
    },
    {
        "id": "activity_2",
        "title": "Quick Journal Prompt",
        "description": "Write for 3 minutes: 'What do I need right now?'",
        "type": "activity",
        "duration_min": 3,
        "difficulty": "easy",
        "mood_category": ["confused", "anxious", "overwhelmed"]
    },
    
    # Quotes (for inspiration)
    {
        "id": "quote_1",
        "title": "Mindfulness Reminder",
        "description": "\"You can't stop the waves, but you can learn to surf.\" - Jon Kabat-Zinn",
        "type": "quote",
        "duration_min": 1,
        "difficulty": "easy",
        "mood_category": ["anxious", "overwhelmed"]
    },
    {
        "id": "quote_2",
        "title": "Self-Compassion",
        "description": "\"Talk to yourself like you would to someone you love.\" - Brené Brown",
        "type": "quote",
        "duration_min": 1,
        "difficulty": "easy",
        "mood_category": ["sad", "angry", "anxious"]
    },
    {
        "id": "quote_3",
        "title": "Resilience",
        "description": "\"The oak fought the wind and was broken, the willow bent when it must and survived.\" - Robert Jordan",
        "type": "quote",
        "duration_min": 1,
        "difficulty": "easy",
        "mood_category": ["stressed", "overwhelmed", "tired"]
    }
]

# Mood to action type mapping
MOOD_TO_ACTION_TYPES = {
    "anxious": ["breathing", "meditation", "nature"],
    "stressed": ["breathing", "exercise", "meditation"],
    "sad": ["exercise", "activity", "quote"],
    "angry": ["breathing", "exercise"],
    "tired": ["exercise", "activity", "breathing"],
    "overwhelmed": ["breathing", "meditation", "quote"],
    "neutral": ["activity", "exercise", "quote"],
    "happy": ["activity", "exercise"],  # To maintain positive momentum
    "excited": ["activity", "exercise"],
    "peaceful": ["meditation", "activity"]
}

@router.post("/suggest", response_model=ActionResponse)
async def suggest_actions(request: ActionRequest):
    """Suggest practical actions based on current state (UC-23)"""
    try:
        # Apply BR-23-01: Filter actions under 5 minutes
        short_actions = [a for a in ACTIONS_DATABASE if a["duration_min"] <= 5]
        
        # Filter by mood if provided
        if request.current_mood:
            mood = request.current_mood.lower()
            
            # Get action types suitable for this mood
            suitable_types = MOOD_TO_ACTION_TYPES.get(mood, ["breathing", "activity", "quote"])
            
            # Filter actions by type and mood category
            suitable_actions = []
            for action in short_actions:
                if (action["type"] in suitable_types or 
                    mood in action["mood_category"]):
                    suitable_actions.append(action)
            
            # If we have enough suitable actions, use them
            if len(suitable_actions) >= request.count:
                actions = random.sample(suitable_actions, min(request.count, len(suitable_actions)))
            else:
                # Mix suitable actions with general short actions
                actions = suitable_actions.copy()
                other_actions = [a for a in short_actions if a not in suitable_actions]
                needed = request.count - len(actions)
                if needed > 0 and other_actions:
                    actions.extend(random.sample(other_actions, min(needed, len(other_actions))))
        else:
            # No mood specified, use general short actions
            actions = random.sample(short_actions, min(request.count, len(short_actions)))
        
        # Convert to ActionItem objects
        action_items = []
        for action in actions:
            action_items.append(ActionItem(
                id=action["id"],
                title=action["title"],
                description=action["description"],
                type=action["type"],
                duration_min=action["duration_min"],
                difficulty=action["difficulty"],
                mood_category=action["mood_category"]
            ))
        
        # Get user's recent action history to avoid repetition
        db = mongodb.get_db()
        recent_actions = await db.ai_interactions.find({
            "user_id": request.user_id,
            "type": "action_suggestion",
            "created_at": {"$gte": datetime.now() - timedelta(hours=24)}
        }).sort("created_at", -1).limit(10).to_list(length=10)
        
        # Extract recently suggested action IDs
        recent_action_ids = []
        for interaction in recent_actions:
            if "actions" in interaction.get("content", {}):
                for action in interaction["content"]["actions"]:
                    if isinstance(action, dict) and "id" in action:
                        recent_action_ids.append(action["id"])
        
        # Try to avoid recently suggested actions
        if recent_action_ids and len(action_items) > 1:
            filtered_items = [a for a in action_items if a.id not in recent_action_ids]
            if filtered_items:  # If we have some non-recent actions, use them
                action_items = filtered_items[:request.count]
        
        # Store the suggestion
        await db.ai_interactions.insert_one({
            "user_id": request.user_id,
            "type": "action_suggestion",
            "content": {
                "actions": [a.dict() for a in action_items],
                "context": {
                    "current_mood": request.current_mood,
                    "energy_level": request.energy_level,
                    "user_context": request.context
                }
            },
            "created_at": datetime.now()
        })
        
        return ActionResponse(
            actions=action_items,
            context={
                "current_mood": request.current_mood,
                "energy_level": request.energy_level,
                "filtered_by_duration": True,  # BR-23-01
                "total_actions_considered": len(short_actions)
            },
            suggested_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Failed to suggest actions: {e}")
        
        # Fallback: return some default actions
        fallback_actions = [
            ActionItem(
                id="fallback_1",
                title="Deep Breathing",
                description="Take 5 deep breaths, focusing on slow exhales.",
                type="breathing",
                duration_min=2,
                difficulty="easy",
                mood_category=["anxious", "stressed", "tired"]
            ),
            ActionItem(
                id="fallback_2",
                title="Quick Stretch",
                description="Stand up and stretch your arms overhead for 30 seconds.",
                type="exercise",
                duration_min=1,
                difficulty="easy",
                mood_category=["tired", "stressed"]
            ),
            ActionItem(
                id="fallback_3",
                title="Mindful Moment",
                description="Notice 3 things you can see, 2 you can hear, and 1 you can feel.",
                type="meditation",
                duration_min=1,
                difficulty="easy",
                mood_category=["anxious", "overwhelmed", "neutral"]
            )
        ]
        
        return ActionResponse(
            actions=fallback_actions[:request.count],
            context={"fallback": True, "error": str(e)},
            suggested_at=datetime.now()
        )

@router.post("/log_completion")
async def log_action_completion(user_id: str, action_id: str, duration_seconds: int):
    """Log when a user completes an action"""
    try:
        db = mongodb.get_db()
        
        await db.action_completions.insert_one({
            "user_id": user_id,
            "action_id": action_id,
            "duration_seconds": duration_seconds,
            "completed_at": datetime.now()
        })
        
        return {"success": True, "message": "Action completion logged"}
        
    except Exception as e:
        logger.error(f"Failed to log action completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{user_id}")
async def get_action_history(user_id: str, days: int = 7):
    """Get user's action completion history"""
    try:
        db = mongodb.get_db()
        
        since_date = datetime.now() - timedelta(days=days)
        
        completions = await db.action_completions.find({
            "user_id": user_id,
            "completed_at": {"$gte": since_date}
        }).sort("completed_at", -1).to_list(length=None)
        
        # Get action details for each completion
        actions_with_details = []
        for completion in completions:
            action_id = completion["action_id"]
            
            # Find action in our database
            action_details = next(
                (a for a in ACTIONS_DATABASE if a["id"] == action_id),
                {"title": "Unknown Action", "type": "unknown"}
            )
            
            actions_with_details.append({
                "action_id": action_id,
                "title": action_details["title"],
                "type": action_details["type"],
                "completed_at": completion["completed_at"].isoformat(),
                "duration_seconds": completion.get("duration_seconds", 0)
            })
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_completions": len(completions),
            "completions": actions_with_details,
            "stats": {
                "by_type": count_by_type(actions_with_details),
                "daily_average": len(completions) / days if days > 0 else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get action history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def count_by_type(actions: List[dict]) -> dict:
    """Count actions by type"""
    counts = {}
    for action in actions:
        action_type = action.get("type", "unknown")
        counts[action_type] = counts.get(action_type, 0) + 1
    return counts