from typing import List, Dict, Any
import random
import logging
from src.ml_models.model_manager import ModelManager
from src.database.mongodb import get_database

logger = logging.getLogger(__name__)

class QuestionGenerator:
    def __init__(self):
        self.model_manager = ModelManager.get_instance()
        
        # Question banks
        self.base_questions = [
            "What made you smile today?",
            "What challenged you today?",
            "What are you grateful for today?",
            "How did you take care of yourself today?",
            "What did you learn about yourself today?",
            "Who made a positive impact on your day?",
            "What would you like to do differently tomorrow?",
            "What are you looking forward to?",
            "How did you handle stress today?",
            "What made you feel proud today?",
            "What self-care activity did you practice?",
            "What boundaries did you set or maintain?",
            "How did you show yourself compassion?",
            "What small win can you celebrate?",
            "What emotions did you notice throughout the day?"
        ]
        
        self.mood_specific_questions = {
            "happy": [
                "What specifically contributed to your happiness today?",
                "How can you carry this positive energy forward?",
                "Who shared in your happiness today?",
                "What does this feeling teach you about what matters to you?"
            ],
            "sad": [
                "What comforted you during difficult moments?",
                "What support do you need right now?",
                "What's one small thing that could bring you comfort?",
                "How can you be gentle with yourself today?"
            ],
            "anxious": [
                "What's within your control right now?",
                "What evidence do you have that challenges your worries?",
                "What grounding techniques helped you today?",
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
                "What's draining your energy that you could let go of?",
                "How can you prioritize restoration?",
                "What small adjustment could make tomorrow easier?"
            ],
            "neutral": [
                "What subtle feelings did you notice today?",
                "How does this steadiness serve you?",
                "What maintained your balance today?",
                "What small thing brought you quiet satisfaction?"
            ]
        }
        
        self.follow_up_questions = [
            "Can you tell me more about that?",
            "How did that make you feel?",
            "What was going through your mind during that?",
            "What did you learn from that experience?",
            "How might you apply this insight moving forward?"
        ]
    
    async def generate_questions(self, user_id: str, count: int = 5) -> List[str]:
        """Generate personalized questions for a user"""
        db = await get_database()
        
        # Get recent journal entries
        recent_entries = await db.journal_entries.find({
            "user_id": user_id,
            "deleted_at": None,
            "text": {"$exists": True, "$ne": ""}
        }).sort("created_at", -1).limit(10).to_list(length=10)
        
        # Get recent mood
        recent_mood_entry = await db.mood_entries.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        
        recent_mood = recent_mood_entry.get("mood").lower() if recent_mood_entry else None
        
        # Analyze recent entries for themes
        themes = await self._extract_themes(recent_entries)
        
        # Generate questions based on mood and themes
        questions = self._select_questions(recent_mood, themes, count)
        
        # Log the interaction
        await db.ai_interactions.insert_one({
            "user_id": user_id,
            "type": "suggested_question",
            "content": {"questions": questions},
            "context": {
                "mood": recent_mood,
                "themes": themes,
                "entry_count": len(recent_entries)
            },
            "created_at": datetime.now()
        })
        
        return questions
    
    async def _extract_themes(self, entries: List[Dict]) -> List[str]:
        """Extract common themes from journal entries"""
        if not entries:
            return []
        
        # Common themes based on keywords
        theme_keywords = {
            "work": ["work", "job", "career", "office", "meeting", "project"],
            "relationships": ["friend", "family", "partner", "relationship", "love"],
            "health": ["health", "exercise", "sleep", "diet", "doctor", "pain"],
            "personal_growth": ["learn", "grow", "improve", "goal", "achievement"],
            "stress": ["stress", "anxious", "overwhelmed", "pressure", "deadline"],
            "gratitude": ["thankful", "grateful", "appreciate", "blessed"],
            "self_care": ["rest", "relax", "meditate", "bath", "massage", "treat"],
            "creativity": ["create", "write", "draw", "paint", "music", "art"]
        }
        
        all_text = " ".join([entry.get("text", "").lower() for entry in entries])
        
        themes = []
        for theme, keywords in theme_keywords.items():
            if any(keyword in all_text for keyword in keywords):
                themes.append(theme)
        
        return themes[:3]  # Return top 3 themes
    
    def _select_questions(self, mood: str, themes: List[str], count: int) -> List[str]:
        """Select questions based on mood and themes"""
        selected = set()
        
        # Add mood-specific questions
        if mood and mood in self.mood_specific_questions:
            mood_questions = self.mood_specific_questions[mood]
            selected.update(random.sample(mood_questions, min(2, len(mood_questions))))
        
        # Add theme-related questions
        theme_questions = []
        for theme in themes:
            if theme == "work":
                theme_questions.extend([
                    "What was rewarding about your work today?",
                    "What work challenge are you navigating?",
                    "How do you maintain work-life balance?"
                ])
            elif theme == "relationships":
                theme_questions.extend([
                    "Who enriched your life today?",
                    "How did you nurture your relationships today?",
                    "What relationship are you grateful for?"
                ])
            elif theme == "health":
                theme_questions.extend([
                    "How did you honor your body today?",
                    "What health choice are you proud of?",
                    "How can you better listen to your body's needs?"
                ])
        
        if theme_questions:
            selected.update(random.sample(theme_questions, min(2, len(theme_questions))))
        
        # Fill remaining with base questions
        remaining = count - len(selected)
        if remaining > 0:
            available_base = [q for q in self.base_questions if q not in selected]
            if available_base:
                selected.update(random.sample(available_base, min(remaining, len(available_base))))
        
        # Convert to list and shuffle
        question_list = list(selected)[:count]
        random.shuffle(question_list)
        
        return question_list