from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging
from src.ml_models.model_manager import ModelManager
from src.database.mongodb import get_database

logger = logging.getLogger(__name__)

class SummaryService:
    def __init__(self):
        self.model_manager = ModelManager.get_instance()
    
    async def generate_daily_summary(self, user_id: str, date: datetime = None) -> Dict[str, Any]:
        """Generate daily summary for a user"""
        if date is None:
            date = datetime.now()
        
        start_of_day = datetime(date.year, date.month, date.day, 0, 0, 0)
        end_of_day = datetime(date.year, date.month, date.day, 23, 59, 59)
        
        db = await get_database()
        
        # Get journal entries for the day
        entries = await db.journal_entries.find({
            "user_id": user_id,
            "created_at": {
                "$gte": start_of_day,
                "$lte": end_of_day
            },
            "deleted_at": None,
            "text": {"$exists": True, "$ne": ""}
        }).sort("created_at", 1).to_list(length=None)
        
        # Get mood entries for the day
        mood_entries = await db.mood_entries.find({
            "user_id": user_id,
            "created_at": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        }).sort("created_at", 1).to_list(length=None)
        
        if not entries and not mood_entries:
            return {
                "summary": "No entries today. Every day is a new opportunity to reflect and grow.",
                "entry_count": 0,
                "mood_count": 0
            }
        
        # Prepare text for summarization
        combined_text = self._prepare_summary_text(entries, mood_entries)
        
        # Generate summary
        summary = self.model_manager.summarize_text(
            combined_text,
            max_length=200,
            min_length=50
        )
        
        # Add encouraging tone
        summary = self._add_encouraging_tone(summary, entries, mood_entries)
        
        return {
            "summary": summary,
            "entry_count": len(entries),
            "mood_count": len(mood_entries),
            "date": date.isoformat(),
            "generated_at": datetime.now().isoformat()
        }
    
    def _prepare_summary_text(self, entries: List[Dict], mood_entries: List[Dict]) -> str:
        """Prepare text for summarization"""
        text_parts = []
        
        # Add mood entries
        if mood_entries:
            mood_text = "Today's moods: "
            mood_items = []
            for mood_entry in mood_entries:
                mood = mood_entry.get("mood", "unknown")
                energy = mood_entry.get("energy_level")
                time = mood_entry.get("created_at")
                
                if time:
                    time_str = time.strftime("%H:%M")
                    item = f"{mood} at {time_str}"
                else:
                    item = mood
                
                if energy is not None:
                    item += f" (energy: {energy}/10)"
                
                mood_items.append(item)
            
            mood_text += "; ".join(mood_items)
            text_parts.append(mood_text)
        
        # Add journal entries
        for i, entry in enumerate(entries, 1):
            entry_text = entry.get("text", "").strip()
            if entry_text:
                # Add context if available
                context = []
                mood = entry.get("mood")
                if mood:
                    context.append(f"mood: {mood}")
                
                energy = entry.get("energy_level")
                if energy is not None:
                    context.append(f"energy: {energy}/10")
                
                context_str = f" ({', '.join(context)})" if context else ""
                text_parts.append(f"Entry {i}{context_str}: {entry_text}")
        
        return " ".join(text_parts)
    
    def _add_encouraging_tone(self, summary: str, entries: List[Dict], mood_entries: List[Dict]) -> str:
        """Add encouraging tone to the summary"""
        # Analyze overall sentiment
        positive_count = 0
        negative_count = 0
        
        for entry in entries:
            mood = entry.get("mood", "").lower()
            if mood in ["happy", "excited", "peaceful", "grateful"]:
                positive_count += 1
            elif mood in ["sad", "anxious", "angry", "tired"]:
                negative_count += 1
        
        for mood_entry in mood_entries:
            mood = mood_entry.get("mood", "").lower()
            if mood in ["happy", "excited", "peaceful", "grateful"]:
                positive_count += 1
            elif mood in ["sad", "anxious", "angry", "tired"]:
                negative_count += 1
        
        # Add encouraging sentence based on analysis
        encouraging_sentences = [
            "Remember to be kind to yourself.",
            "Every step forward counts, no matter how small.",
            "Your feelings are valid and important.",
            "Take a moment to appreciate your progress.",
            "Self-reflection is a sign of strength.",
            "Tomorrow is a new opportunity.",
            "You're doing better than you think.",
            "Be proud of showing up for yourself today."
        ]
        
        # Choose sentence based on sentiment
        if positive_count > negative_count * 2:
            # Mostly positive
            encouraging = "It's wonderful to see so much positivity in your day!"
        elif negative_count > positive_count * 2:
            # Mostly negative
            encouraging = "It's okay to have difficult days. Remember that feelings are temporary and you have the strength to move through them."
        else:
            # Mixed or neutral
            import random
            encouraging = random.choice(encouraging_sentences)
        
        return f"{summary} {encouraging}"