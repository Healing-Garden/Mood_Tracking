from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel
from src.database import mongodb
from src.core.embeddings import embedding_service
from src.database.vector_store import vector_store
import openai
from src.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# OpenAI setup
if settings.openai_api_key:
    openai.api_key = settings.openai_api_key

class QuestionRequest(BaseModel):
    user_id: str
    recent_mood: Optional[str] = None
    context: Optional[str] = None
    count: int = 3

class QuestionResponse(BaseModel):
    questions: List[str]
    context: dict
    generated_at: datetime

@router.post("/suggest", response_model=QuestionResponse)
async def suggest_questions(request: QuestionRequest):
    try:
        # Get user's recent journal entries
        db = mongodb.get_db()
        
        # Get entries from last 7 days
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        recent_entries = await db.journal_entries.find({
            "user_id": request.user_id,
            "created_at": {"$gte": seven_days_ago},
            "deleted_at": None
        }).sort("created_at", -1).limit(10).to_list(length=10)
        
        # Get recent moods
        recent_moods = await db.mood_entries.find({
            "user_id": request.user_id,
            "created_at": {"$gte": seven_days_ago}
        }).sort("created_at", -1).limit(5).to_list(length=5)
        
        # Prepare context
        context_texts = []
        
        # Add recent journal entries context
        for entry in recent_entries[:3]:  # Use 3 most recent entries
            if entry.get('text'):
                context_texts.append(f"Journal: {entry['text'][:200]}...")
        
        # Add mood context
        mood_summary = []
        for mood in recent_moods[:3]:
            if mood.get('mood'):
                mood_summary.append(mood['mood'])
        
        if mood_summary:
            context_texts.append(f"Recent moods: {', '.join(mood_summary)}")
        
        # Get questions asked in last 48 hours (to avoid repetition)
        forty_eight_hours_ago = datetime.now() - timedelta(hours=48)
        
        recent_questions = await db.ai_interactions.find({
            "user_id": request.user_id,
            "type": "suggested_question",
            "created_at": {"$gte": forty_eight_hours_ago}
        }).sort("created_at", -1).limit(10).to_list(length=10)
        
        # Extract recently asked questions
        asked_questions = []
        for interaction in recent_questions:
            if 'questions' in interaction.get('content', {}):
                asked_questions.extend(interaction['content']['questions'])
        
        # Generate questions using OpenAI
        questions = await _generate_questions_with_openai(
            context_texts=context_texts,
            recent_mood=request.recent_mood,
            count=request.count,
            avoid_questions=asked_questions[:5]  # Avoid last 5 asked questions
        )
        
        # Store the interaction
        await db.ai_interactions.insert_one({
            "user_id": request.user_id,
            "type": "suggested_question",
            "content": {
                "questions": questions,
                "context": {
                    "recent_mood": request.recent_mood,
                    "entry_count": len(recent_entries),
                    "mood_count": len(recent_moods)
                }
            },
            "created_at": datetime.now()
        })
        
        return QuestionResponse(
            questions=questions,
            context={
                "entry_count": len(recent_entries),
                "mood_count": len(recent_moods),
                "recent_mood": request.recent_mood
            },
            generated_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Failed to generate questions: {e}")
        # Fallback to predefined questions
        fallback_questions = _get_fallback_questions(request.recent_mood, request.count)
        
        return QuestionResponse(
            questions=fallback_questions,
            context={"fallback": True, "error": str(e)},
            generated_at=datetime.now()
        )

async def _generate_questions_with_openai(
    context_texts: List[str],
    recent_mood: Optional[str] = None,
    count: int = 3,
    avoid_questions: List[str] = None
) -> List[str]:
    """Generate questions using OpenAI"""
    
    if not settings.openai_api_key:
        return _get_fallback_questions(recent_mood, count)
    
    # Prepare context
    context = "\n".join(context_texts) if context_texts else "No recent context available."
    
    # Prepare avoidance instructions
    avoid_text = ""
    if avoid_questions:
        avoid_text = f"\nAvoid these recently asked questions: {', '.join(avoid_questions[:3])}"
    
    # Create prompt
    prompt = f"""
    As a mental health assistant, generate {count} open-ended, empathetic journaling questions.
    
    Context about the user:
    {context}
    
    Recent mood: {recent_mood or 'Not specified'}
    
    Requirements:
    1. Questions should be positive, encouraging, and non-judgmental
    2. Avoid yes/no questions - make them open-ended
    3. Focus on self-reflection and growth
    4. Relate to the user's current context and mood if available
    5. Each question should be 1-2 sentences max
    {avoid_text}
    
    Return exactly {count} questions as a JSON array of strings.
    Example: ["What brought you joy today?", "What challenge did you overcome?", "What are you grateful for?"]
    """
    
    try:
        response = await openai.ChatCompletion.acreate(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a compassionate mental health assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        # Parse response
        content = response.choices[0].message.content
        
        # Try to extract JSON array
        import json
        import re
        
        # Find JSON array in response
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            questions = json.loads(json_match.group())
        else:
            # If no JSON found, split by lines and clean
            questions = [
                q.strip() for q in content.split('\n') 
                if q.strip() and not q.strip().startswith('[') and not q.strip().startswith(']')
            ]
        
        # Ensure we have the right number of questions
        if len(questions) > count:
            questions = questions[:count]
        elif len(questions) < count:
            # Add fallback questions if needed
            fallback = _get_fallback_questions(recent_mood, count - len(questions))
            questions.extend(fallback)
        
        return questions
        
    except Exception as e:
        logger.error(f"OpenAI question generation failed: {e}")
        return _get_fallback_questions(recent_mood, count)

def _get_fallback_questions(recent_mood: Optional[str] = None, count: int = 3) -> List[str]:
    """Get fallback questions based on mood"""
    
    # Mood-specific question banks
    question_banks = {
        "happy": [
            "What specifically made you feel happy today?",
            "How can you carry this positive energy forward?",
            "Who contributed to your happiness today?",
            "What does this happiness tell you about what matters to you?"
        ],
        "sad": [
            "What comforted you during difficult moments?",
            "What support would be helpful right now?",
            "What's one small thing that could bring you comfort?",
            "How can you be gentle with yourself today?"
        ],
        "anxious": [
            "What's within your control right now?",
            "What evidence challenges your worries?",
            "What grounding techniques might help?",
            "What would you tell a friend who felt this way?"
        ],
        "angry": [
            "What boundary might need attention?",
            "What's the underlying need behind this feeling?",
            "How can you channel this energy constructively?",
            "What would help you feel heard or respected?"
        ],
        "tired": [
            "What would genuine rest look like for you?",
            "What's draining your energy that you could release?",
            "How can you prioritize restoration?",
            "What small adjustment could make tomorrow easier?"
        ]
    }
    
    # Default questions
    default_questions = [
        "What made you smile today?",
        "What challenged you today?",
        "What are you grateful for today?",
        "How did you take care of yourself today?",
        "What did you learn about yourself today?",
        "Who made a positive impact on your day?",
        "What would you like to do differently tomorrow?",
        "What are you looking forward to?"
    ]
    
    # Get mood-specific questions if available
    if recent_mood and recent_mood.lower() in question_banks:
        mood_questions = question_banks[recent_mood.lower()]
        # Mix mood-specific and default questions
        import random
        questions = []
        
        # Add 1-2 mood-specific questions
        num_mood_questions = min(2, len(mood_questions))
        questions.extend(random.sample(mood_questions, num_mood_questions))
        
        # Add default questions to reach count
        remaining = count - len(questions)
        if remaining > 0:
            questions.extend(random.sample(default_questions, min(remaining, len(default_questions))))
        
        return questions[:count]
    
    # Return random default questions
    import random
    return random.sample(default_questions, min(count, len(default_questions)))