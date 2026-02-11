from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel
import numpy as np
from src.database import mongodb
from src.core.sentiment import sentiment_analyzer

router = APIRouter()
logger = logging.getLogger(__name__)

class TrendAnalysisRequest(BaseModel):
    user_id: str
    days: int = 30

class MoodPoint(BaseModel):
    date: str
    mood_score: Optional[float] = None
    sentiment_score: Optional[float] = None
    energy_level: Optional[int] = None

class TrendResponse(BaseModel):
    mood_points: List[MoodPoint]
    overall_trend: str  # "improving", "declining", "stable", "volatile"
    trend_score: float  # -1 to 1
    volatility: float
    insights: List[str]
    risk_flags: List[str]
    stats: Dict[str, Any]

@router.post("/analyze", response_model=TrendResponse)
async def analyze_trends(request: TrendAnalysisRequest):
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=request.days)
        
        db = mongodb.get_db()
        
        # Get mood entries
        mood_entries = await db.mood_entries.find({
            "user_id": request.user_id,
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).sort("created_at", 1).to_list(length=None)
        
        # Get journal entries for sentiment analysis
        journal_entries = await db.journal_entries.find({
            "user_id": request.user_id,
            "created_at": {"$gte": start_date, "$lte": end_date},
            "deleted_at": None
        }).sort("created_at", 1).to_list(length=None)
        
        # Check if we have enough data
        if len(mood_entries) + len(journal_entries) < 7:
            return TrendResponse(
                mood_points=[],
                overall_trend="insufficient_data",
                trend_score=0.0,
                volatility=0.0,
                insights=["Need more data for trend analysis. Please continue logging for better insights."],
                risk_flags=[],
                stats={"data_points": len(mood_entries) + len(journal_entries)}
            )
        
        # Process mood entries
        mood_by_date = {}
        for entry in mood_entries:
            date_key = entry["created_at"].date().isoformat()
            
            # Convert mood to score (simplified mapping)
            mood_scores = {
                "happy": 1.0, "excited": 1.0, "peaceful": 0.8, "grateful": 0.9,
                "neutral": 0.0,
                "sad": -0.7, "anxious": -0.6, "angry": -0.8, "tired": -0.3, "stressed": -0.5
            }
            
            mood = entry.get("mood", "neutral").lower()
            mood_score = mood_scores.get(mood, 0.0)
            
            # Average if multiple entries on same day
            if date_key in mood_by_date:
                existing = mood_by_date[date_key]
                mood_by_date[date_key] = {
                    "mood_score": (existing["mood_score"] + mood_score) / 2,
                    "energy_level": existing["energy_level"] if "energy_level" in existing else entry.get("energy_level")
                }
            else:
                mood_by_date[date_key] = {
                    "mood_score": mood_score,
                    "energy_level": entry.get("energy_level")
                }
        
        # Process journal entries for sentiment
        sentiment_by_date = {}
        for entry in journal_entries:
            date_key = entry["created_at"].date().isoformat()
            text = entry.get("text", "")
            
            if text:
                sentiment = sentiment_analyzer.analyze_sentiment(text)
                sentiment_score = sentiment["score"]
                
                if date_key in sentiment_by_date:
                    # Average sentiment for the day
                    sentiment_by_date[date_key].append(sentiment_score)
                else:
                    sentiment_by_date[date_key] = [sentiment_score]
        
        # Average sentiment per day
        for date_key, scores in sentiment_by_date.items():
            sentiment_by_date[date_key] = np.mean(scores)
        
        # Combine mood and sentiment data
        mood_points = []
        all_dates = sorted(set(list(mood_by_date.keys()) + list(sentiment_by_date.keys())))
        
        for date_key in all_dates:
            mood_data = mood_by_date.get(date_key, {})
            sentiment_score = sentiment_by_date.get(date_key)
            
            # Calculate overall score (weighted average)
            mood_score = mood_data.get("mood_score")
            
            if mood_score is not None and sentiment_score is not None:
                overall_score = (mood_score * 0.6) + (sentiment_score * 0.4)
            elif mood_score is not None:
                overall_score = mood_score
            elif sentiment_score is not None:
                overall_score = sentiment_score
            else:
                continue  # Skip days with no data
            
            mood_points.append(MoodPoint(
                date=date_key,
                mood_score=float(mood_score) if mood_score is not None else None,
                sentiment_score=float(sentiment_score) if sentiment_score is not None else None,
                energy_level=mood_data.get("energy_level"),
                # overall_score is implied by trend analysis
            ))
        
        # Analyze trends
        if len(mood_points) >= 3:
            # Extract scores for analysis
            scores = []
            for point in mood_points:
                # Use mood_score if available, otherwise use None
                if point.mood_score is not None:
                    scores.append(point.mood_score)
                elif point.sentiment_score is not None:
                    scores.append(point.sentiment_score)
            
            if len(scores) >= 3:
                # Calculate trend (linear regression slope)
                x = np.arange(len(scores))
                y = np.array(scores)
                
                # Simple linear regression
                if len(scores) > 1:
                    slope = np.polyfit(x, y, 1)[0]
                else:
                    slope = 0
                
                # Calculate volatility (standard deviation)
                volatility = float(np.std(scores)) if len(scores) > 1 else 0.0
                
                # Determine overall trend
                if slope > 0.05:
                    trend = "improving"
                elif slope < -0.05:
                    trend = "declining"
                elif volatility > 0.3:
                    trend = "volatile"
                else:
                    trend = "stable"
                
                # Generate insights
                insights = generate_insights(trend, slope, volatility, mood_points)
                
                # Check for risk flags (BR-22-01)
                risk_flags = check_risk_flags(scores, mood_points)
                
                # Calculate statistics
                stats = {
                    "data_points": len(mood_points),
                    "average_mood": float(np.mean(scores)) if scores else 0.0,
                    "min_mood": float(np.min(scores)) if scores else 0.0,
                    "max_mood": float(np.max(scores)) if scores else 0.0,
                    "trend_slope": float(slope),
                    "volatility": volatility,
                    "analysis_period_days": request.days
                }
                
                return TrendResponse(
                    mood_points=mood_points,
                    overall_trend=trend,
                    trend_score=float(slope),
                    volatility=volatility,
                    insights=insights,
                    risk_flags=risk_flags,
                    stats=stats
                )
        
        # If we get here, there wasn't enough data for proper analysis
        return TrendResponse(
            mood_points=mood_points,
            overall_trend="insufficient_data",
            trend_score=0.0,
            volatility=0.0,
            insights=["We need more consistent data for detailed trend analysis."],
            risk_flags=[],
            stats={"data_points": len(mood_points)}
        )
        
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_insights(trend: str, slope: float, volatility: float, mood_points: List[MoodPoint]) -> List[str]:
    """Generate insights based on trend analysis"""
    insights = []
    
    if trend == "improving":
        insights.append("Your mood has been improving over time. Keep up the positive momentum!")
        if slope > 0.1:
            insights.append("You're showing significant positive progress. Celebrate your growth!")
    elif trend == "declining":
        insights.append("We've noticed a downward trend in your mood. Consider reaching out for support.")
        insights.append("It's okay to have difficult periods. Remember that feelings are temporary.")
    elif trend == "volatile":
        insights.append("Your mood has been fluctuating significantly. This might indicate stress or uncertainty.")
        insights.append("Consistency in self-care routines can help stabilize emotional swings.")
    else:  # stable
        insights.append("Your mood has been relatively stable, which can indicate good emotional regulation.")
    
    # Add energy level insight if available
    energy_levels = [p.energy_level for p in mood_points if p.energy_level is not None]
    if energy_levels:
        avg_energy = np.mean(energy_levels)
        if avg_energy < 5:
            insights.append("Your energy levels have been lower than average. Consider checking your sleep and nutrition.")
        elif avg_energy > 7:
            insights.append("You've maintained good energy levels. This can positively impact your mood.")
    
    # Add day-of-week pattern if we have enough data
    if len(mood_points) > 14:  # At least 2 weeks
        # Simple day pattern detection (could be enhanced)
        insights.append("Continue tracking to identify patterns in your weekly routine.")
    
    return insights

def check_risk_flags(scores: List[float], mood_points: List[MoodPoint]) -> List[str]:
    """Check for risk flags (BR-22-01)"""
    risk_flags = []
    
    if len(scores) < 7:
        return risk_flags  # Not enough data
    
    # Check for prolonged negative trend (7 consecutive days)
    recent_scores = scores[-7:]  # Last 7 days
    if len(recent_scores) == 7:
        # Count negative days
        negative_days = sum(1 for score in recent_scores if score < -0.3)
        if negative_days >= 5:  # 5+ negative days in last week
            risk_flags.append("prolonged_negative_trend")
    
    # Check for rapid decline
    if len(scores) >= 3:
        recent_change = scores[-1] - scores[-3]  # Change over last 3 days
        if recent_change < -0.5:  # Significant drop
            risk_flags.append("rapid_mood_decline")
    
    # Check for extreme volatility
    if len(scores) >= 5:
        recent_volatility = np.std(scores[-5:])
        if recent_volatility > 0.5:
            risk_flags.append("high_emotional_volatility")
    
    return risk_flags

@router.get("/patterns/{user_id}")
async def detect_patterns(user_id: str, days: int = 90):
    """Detect recurring patterns in mood and behavior"""
    try:
        # Similar to trend analysis but looking for patterns
        # This is a simplified version
        
        db = mongodb.get_db()
        
        # Get data for pattern detection
        mood_entries = await db.mood_entries.find({
            "user_id": user_id,
            "created_at": {"$gte": datetime.now() - timedelta(days=days)}
        }).to_list(length=None)
        
        if not mood_entries:
            return {"patterns": [], "message": "Insufficient data for pattern detection"}
        
        # Simple pattern detection by day of week
        from collections import defaultdict
        mood_by_weekday = defaultdict(list)
        
        for entry in mood_entries:
            weekday = entry["created_at"].strftime("%A")
            mood = entry.get("mood", "neutral").lower()
            
            # Convert mood to score
            mood_scores = {
                "happy": 1, "excited": 1, "peaceful": 0.8, "grateful": 0.9,
                "neutral": 0,
                "sad": -1, "anxious": -0.8, "angry": -0.9, "tired": -0.5
            }
            
            score = mood_scores.get(mood, 0)
            mood_by_weekday[weekday].append(score)
        
        # Calculate average mood by weekday
        weekday_patterns = []
        for weekday, scores in mood_by_weekday.items():
            if scores:
                avg_score = np.mean(scores)
                weekday_patterns.append({
                    "weekday": weekday,
                    "average_mood": float(avg_score),
                    "count": len(scores)
                })
        
        # Sort by worst to best mood
        weekday_patterns.sort(key=lambda x: x["average_mood"])
        
        # Generate pattern insights
        patterns = []
        if weekday_patterns:
            worst_day = weekday_patterns[0]
            best_day = weekday_patterns[-1]
            
            patterns.append({
                "type": "weekly_pattern",
                "description": f"You tend to feel best on {best_day['weekday']}s and worst on {worst_day['weekday']}s",
                "confidence": min(best_day['count'], worst_day['count']) / days * 7
            })
        
        return {
            "patterns": patterns,
            "analysis_period_days": days,
            "total_data_points": len(mood_entries)
        }
        
    except Exception as e:
        logger.error(f"Pattern detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))