import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import Counter
import logging
from src.ml_models.model_manager import ModelManager
from src.database.mongodb import get_database

logger = logging.getLogger(__name__)

class SentimentService:
    def __init__(self):
        self.model_manager = ModelManager.get_instance()
    
    async def analyze_journal_entries(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze sentiment of multiple journal entries"""
        sentiments = []
        scores = []
        
        for entry in entries:
            text = entry.get("text", "")
            if not text:
                continue
            
            sentiment_result = self.model_manager.analyze_sentiment(text)
            sentiments.append(sentiment_result["sentiment"])
            scores.append(sentiment_result["score"])
            
            # Update entry with sentiment if needed
            entry["sentiment_score"] = sentiment_result["score"]
            entry["sentiment"] = sentiment_result["sentiment"]
        
        if not scores:
            return {
                "overall_sentiment": 0,
                "dominant_sentiment": "neutral",
                "score_distribution": {"positive": 0, "neutral": 0, "negative": 0}
            }
        
        # Calculate overall sentiment
        overall_score = np.mean(scores)
        
        # Count sentiment distribution
        sentiment_counts = Counter(sentiments)
        total = sum(sentiment_counts.values())
        distribution = {
            sentiment: count / total
            for sentiment, count in sentiment_counts.items()
        }
        
        # Determine dominant sentiment
        dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get)
        
        return {
            "overall_sentiment": float(overall_score),
            "dominant_sentiment": dominant_sentiment,
            "score_distribution": distribution,
            "entry_count": len(entries)
        }
    
    async def detect_emotional_trends(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Detect emotional trends over time"""
        db = await get_database()
        
        # Get entries for the time period
        start_date = datetime.now() - timedelta(days=days)
        
        entries = await db.journal_entries.find({
            "user_id": user_id,
            "created_at": {"$gte": start_date},
            "deleted_at": None,
            "text": {"$exists": True, "$ne": ""}
        }).sort("created_at", 1).to_list(length=None)
        
        if not entries:
            return {"error": "No entries found", "trend": "insufficient_data"}
        
        # Analyze sentiment for each entry
        daily_scores = {}
        weekly_scores = {}
        
        for entry in entries:
            created_at = entry.get("created_at")
            if not created_at:
                continue
            
            date_key = created_at.date()
            week_key = f"{created_at.year}-W{created_at.isocalendar()[1]}"
            
            text = entry.get("text", "")
            sentiment = self.model_manager.analyze_sentiment(text)
            score = sentiment["score"]
            
            # Aggregate daily
            if date_key not in daily_scores:
                daily_scores[date_key] = []
            daily_scores[date_key].append(score)
            
            # Aggregate weekly
            if week_key not in weekly_scores:
                weekly_scores[week_key] = []
            weekly_scores[week_key].append(score)
        
        # Calculate averages
        daily_avg = {
            str(date): np.mean(scores)
            for date, scores in daily_scores.items()
        }
        
        weekly_avg = {
            week: np.mean(scores)
            for week, scores in weekly_scores.items()
        }
        
        # Detect trends
        trend_analysis = self._analyze_trend_pattern(list(daily_avg.values()))
        
        # Check for risk patterns
        risk_flags = self._detect_risk_patterns(daily_avg)
        
        return {
            "daily_scores": daily_avg,
            "weekly_scores": weekly_avg,
            "trend_analysis": trend_analysis,
            "risk_flags": risk_flags,
            "total_entries": len(entries),
            "time_period_days": days
        }
    
    def _analyze_trend_pattern(self, scores: List[float]) -> Dict[str, Any]:
        """Analyze trend pattern from scores"""
        if len(scores) < 2:
            return {"trend": "insufficient_data", "slope": 0}
        
        # Simple linear regression
        x = np.arange(len(scores))
        y = np.array(scores)
        
        # Calculate slope
        if len(scores) > 1:
            slope = np.polyfit(x, y, 1)[0]
        else:
            slope = 0
        
        # Determine trend
        if slope > 0.01:
            trend = "improving"
        elif slope < -0.01:
            trend = "declining"
        else:
            trend = "stable"
        
        # Check volatility
        if len(scores) > 2:
            volatility = np.std(scores)
        else:
            volatility = 0
        
        return {
            "trend": trend,
            "slope": float(slope),
            "volatility": float(volatility),
            "min_score": float(np.min(y)),
            "max_score": float(np.max(y)),
            "avg_score": float(np.mean(y))
        }
    
    def _detect_risk_patterns(self, daily_scores: Dict) -> List[str]:
        """Detect potential risk patterns"""
        risk_flags = []
        
        if not daily_scores:
            return risk_flags
        
        scores = list(daily_scores.values())
        
        # Check for prolonged negative scores
        negative_days = sum(1 for score in scores if score < -0.3)
        total_days = len(scores)
        
        if total_days >= 7 and negative_days / total_days > 0.7:
            risk_flags.append("prolonged_negative_sentiment")
        
        # Check for rapid decline
        if len(scores) >= 3:
            recent_scores = scores[-3:]
            if recent_scores[0] - recent_scores[-1] > 0.5:
                risk_flags.append("rapid_mood_decline")
        
        # Check for extreme volatility
        if len(scores) >= 5:
            volatility = np.std(scores[-5:])
            if volatility > 0.5:
                risk_flags.append("high_emotional_volatility")
        
        return risk_flags