from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import asyncio
from pydantic import BaseModel
import numpy as np
from collections import defaultdict
from bson import ObjectId

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
    overall_trend: str  
    trend_score: float  
    volatility: float
    insights: List[str]
    risk_flags: List[str]
    stats: Dict[str, Any]

# -------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------

async def aggregate_daily_scores(mood_entries: List[dict], journal_entries: List[dict]) -> List[dict]:
    """
    Gộp mood_entries (từ dailycheckins) và journal_entries theo ngày,
    tính overall_score = weighted average (mood 0.6, sentiment 0.4)
    DailyCheckIn schema: user (ObjectId), mood (Number 1-5), energy (Number 1-10),
                         date (String YYYY-MM-DD), theme, timestamps (createdAt/updatedAt)
    """
    # Map numeric mood (1-5) to score (-1 to +1)
    # 1=very bad, 2=bad, 3=neutral, 4=good, 5=excellent
    def mood_number_to_score(mood_val) -> float:
        try:
            m = int(mood_val)
            return (m - 3) / 2.0  # maps 1->-1, 2->-0.5, 3->0, 4->0.5, 5->1
        except (TypeError, ValueError):
            return 0.0

    mood_by_date = {}
    for entry in mood_entries:
        # date is stored as 'YYYY-MM-DD' string in this model
        date_key = entry.get("date")
        if not date_key:
            # Fallback to createdAt timestamp
            raw_date = entry.get("createdAt") or entry.get("created_at")
            if raw_date is None:
                continue
            date_key = raw_date.date().isoformat() if hasattr(raw_date, 'date') else str(raw_date)[:10]
        else:
            date_key = str(date_key)[:10]  # ensure YYYY-MM-DD format

        mood_val = entry.get("mood")
        mood_score = mood_number_to_score(mood_val)
        energy = entry.get("energy")  # field name is 'energy' in this model

        if date_key in mood_by_date:
            old = mood_by_date[date_key]
            mood_by_date[date_key] = {
                "mood_score": (old["mood_score"] + mood_score) / 2,
                "energy_level": energy if energy is not None else old.get("energy_level")
            }
        else:
            mood_by_date[date_key] = {
                "mood_score": mood_score,
                "energy_level": energy
            }

    # Run sentiment analysis in thread pool to avoid blocking the event loop
    loop = asyncio.get_running_loop()
    sentiment_by_date: dict = defaultdict(list)

    def _compute_sentiments():
        results = []
        # Cap work to keep endpoint responsive
        max_entries = 200
        max_text_chars = 1200
        for i, entry in enumerate(journal_entries):
            if i >= max_entries:
                break
            raw_date = entry.get("created_at") or entry.get("date")
            if raw_date is None:
                continue
            date_key = raw_date.date().isoformat() if hasattr(raw_date, 'date') else str(raw_date)[:10]
            text = entry.get("text", "")
            if text:
                try:
                    sentiment = sentiment_analyzer.analyze_sentiment(str(text)[:max_text_chars])
                    results.append((date_key, sentiment["score"]))
                except Exception:
                    pass
        return results

    try:
        sentiment_results = await asyncio.wait_for(
            loop.run_in_executor(None, _compute_sentiments),
            timeout=10.0
        )
        for date_key, score in sentiment_results:
            sentiment_by_date[date_key].append(score)
    except asyncio.TimeoutError:
        logger.warning("Sentiment analysis timed out, proceeding with mood data only")

    # Tính sentiment trung bình theo ngày
    avg_sentiment = {date: float(np.mean(scores)) for date, scores in sentiment_by_date.items()}

    # Kết hợp
    all_dates = sorted(set(mood_by_date.keys()) | set(avg_sentiment.keys()))
    daily_scores = []
    for date in all_dates:
        mood_data = mood_by_date.get(date, {})
        mood_score = mood_data.get("mood_score")
        sentiment_score = avg_sentiment.get(date)

        if mood_score is not None and sentiment_score is not None:
            overall = mood_score * 0.6 + sentiment_score * 0.4
        elif mood_score is not None:
            overall = mood_score
        elif sentiment_score is not None:
            overall = sentiment_score
        else:
            continue  

        daily_scores.append({
            "date": date,
            "overall_score": overall,
            "mood_score": mood_score,
            "sentiment_score": sentiment_score,
            "energy_level": mood_data.get("energy_level")
        })
    return daily_scores

def insufficient_data_response(data_points: int) -> TrendResponse:
    """Trả về response khi không đủ dữ liệu"""
    days_remaining = max(1, 7 - data_points)
    return TrendResponse(
        mood_points=[],
        overall_trend="insufficient_data",
        trend_score=0.0,
        volatility=0.0,
        insights=[f"Please continue logging for {days_remaining} more day(s) to enable AI trend analysis."],
        risk_flags=[],
        stats={"data_points": data_points, "days_remaining": days_remaining}
    )

def convert_to_mood_points(daily_scores: List[dict]) -> List[MoodPoint]:
    """Chuyển daily_scores thành list MoodPoint để response"""
    return [
        MoodPoint(
            date=item["date"],
            mood_score=item["mood_score"],
            sentiment_score=item["sentiment_score"],
            energy_level=item["energy_level"]
        )
        for item in daily_scores
    ]

async def detect_weekday_patterns(user_id: str, daily_scores: List[dict]) -> List[dict]:
    """
    Phát hiện ngày trong tuần có mood trung bình cao nhất / thấp nhất.
    DailyCheckIn uses field 'user' (ObjectId) and 'mood' (Number 1-5).
    """
    db = mongodb.get_db()
    # Try both ObjectId and string for the 'user' field
    query_ids = [user_id]
    try:
        query_ids.append(ObjectId(user_id))
    except Exception:
        pass
    cursor = db.dailycheckins.find(
        {"user": {"$in": query_ids}},
        {"date": 1, "createdAt": 1, "created_at": 1, "mood": 1}
    )

    def mood_number_to_score(mood_val) -> float:
        try:
            m = int(mood_val)
            return (m - 3) / 2.0
        except (TypeError, ValueError):
            return 0.0

    weekday_scores = defaultdict(list)
    async for doc in cursor:
        # date is a 'YYYY-MM-DD' string in DailyCheckIn
        date_str = doc.get("date")
        if not date_str:
            raw_date = doc.get("createdAt") or doc.get("created_at")
            if raw_date is None:
                continue
            try:
                weekday = raw_date.strftime("%A")
            except AttributeError:
                continue
        else:
            try:
                from datetime import date as date_cls
                d = date_cls.fromisoformat(str(date_str)[:10])
                weekday = d.strftime("%A")
            except Exception:
                continue

        score = mood_number_to_score(doc.get("mood"))
        weekday_scores[weekday].append(score)

    avg_by_weekday = {day: np.mean(scores) for day, scores in weekday_scores.items() if scores}
    if len(avg_by_weekday) < 2:
        return []

    best_day = max(avg_by_weekday, key=avg_by_weekday.get)
    worst_day = min(avg_by_weekday, key=avg_by_weekday.get)
    return [{
        "type": "weekly_pattern",
        "description": f"You tend to feel best on {best_day}s and more challenged on {worst_day}s",
        "confidence": 0.7
    }]

def generate_enhanced_insights(trend: str, slope: float, volatility: float,
                                patterns: List[dict], daily_scores: List[dict]) -> List[str]:
    """Tạo insights từ trend, volatility và patterns"""
    insights = []

    if trend == "improving":
        insights.append("Your mood has been improving. Keep up the good habits!")
    elif trend == "declining":
        insights.append("We've noticed a downward trend. Consider reaching out for support.")
    elif trend == "volatile":
        insights.append("Your mood fluctuates a lot. Consistent routines may help stabilize.")
    else:
        insights.append("Your mood is stable – a sign of good emotional regulation.")

    if volatility > 0.4:
        insights.append("High emotional volatility detected. Mindfulness exercises could help.")

    for p in patterns:
        insights.append(p["description"])

    # Insight từ 7 ngày gần nhất
    recent = daily_scores[-7:]
    recent_avg = np.mean([s["overall_score"] for s in recent])
    if recent_avg < -0.2:
        insights.append("Your mood has been below average lately. Small self-care acts might help.")

    return insights[:5]  # giới hạn 5 insights

async def save_analysis_to_db(user_id: str, trend: str, slope: float, volatility: float,
                               insights: List[str], risk_flags: List[str], stats: Dict[str, Any]):
    """Lưu kết quả phân tích vào collection ai_interactions"""
    db = mongodb.get_db()
    await db.ai_interactions.insert_one({
        "user_id": ObjectId(user_id),
        "type": "emotional_assessment",
        "content": {
            "trend": trend,
            "trend_score": slope,
            "volatility": volatility,
            "insights": insights,
            "risk_flags": risk_flags,
            "stats": stats
        },
        "context": {
            "period_days": stats.get("analysis_period_days", 30),
            "timestamp": datetime.utcnow()
        },
        "created_at": datetime.utcnow()
    })

# -------------------------------------------------------------------
# Endpoint chính
# -------------------------------------------------------------------

@router.post("/analyze", response_model=TrendResponse)
async def analyze_trends(request: TrendAnalysisRequest):
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=request.days)

        db = mongodb.get_db()

        # Convert user_id string -> ObjectId for correct MongoDB query
        try:
            user_object_id = ObjectId(request.user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id format")

        # DailyCheckIn uses field 'user' (ObjectId), 'date' as 'YYYY-MM-DD' string
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")

        # Query dailycheckins using ObjectId 'user' field and string 'date' range
        mood_entries = await db.dailycheckins.find({
            "user": user_object_id,
            "date": {"$gte": start_date_str, "$lte": end_date_str}
        }, {"date": 1, "createdAt": 1, "created_at": 1, "mood": 1, "energy": 1}).sort("date", 1).to_list(length=None)

        # fallback with string user_id
        if not mood_entries:
            mood_entries = await db.dailycheckins.find({
                "user": request.user_id,
                "date": {"$gte": start_date_str, "$lte": end_date_str}
            }, {"date": 1, "createdAt": 1, "created_at": 1, "mood": 1, "energy": 1}).sort("date", 1).to_list(length=None)

        # Lấy journal entries - match docs where deleted_at is null, empty, or field doesn't exist
        journal_entries = await db.journal_entries.find({
            "user_id": user_object_id,
            "created_at": {"$gte": start_date, "$lte": end_date},
            "deleted_at": {"$in": [None, ""]}
        }, {"created_at": 1, "date": 1, "text": 1, "deleted_at": 1}).sort("created_at", 1).limit(500).to_list(length=500)

        # Also try: include docs where deleted_at field doesn't exist at all
        if not journal_entries:
            journal_entries = await db.journal_entries.find({
                "user_id": user_object_id,
                "created_at": {"$gte": start_date, "$lte": end_date},
                "deleted_at": {"$exists": False}
            }, {"created_at": 1, "date": 1, "text": 1, "deleted_at": 1}).sort("created_at", 1).limit(500).to_list(length=500)

        # Also try string user_id if ObjectId query returned nothing
        if not journal_entries:
            journal_entries = await db.journal_entries.find({
                "user_id": request.user_id,
                "created_at": {"$gte": start_date, "$lte": end_date},
                "deleted_at": {"$in": [None, ""]}
            }, {"created_at": 1, "date": 1, "text": 1, "deleted_at": 1}).sort("created_at", 1).limit(500).to_list(length=500)

        logger.info(f"Found {len(mood_entries)} mood entries and {len(journal_entries)} journal entries for user {request.user_id}")

        # Tổng hợp dữ liệu theo ngày (now async)
        daily_scores = await aggregate_daily_scores(mood_entries, journal_entries)

        # Kiểm tra đủ dữ liệu (tối thiểu 7 ngày)
        if len(daily_scores) < 7:
            return insufficient_data_response(len(daily_scores))

        # Mảng các overall_score
        y = np.array([d["overall_score"] for d in daily_scores])
        x = np.arange(len(y))

        # Tính trend (linear regression)
        slope, intercept = np.polyfit(x, y, 1)

        # Tính volatility (std deviation)
        volatility = float(np.std(y))

        # Xác định trend type
        if slope > 0.05:
            trend = "improving"
        elif slope < -0.05:
            trend = "declining"
        elif volatility > 0.3:
            trend = "volatile"
        else:
            trend = "stable"

        # Kiểm tra risk flags (BR-22-01)
        risk_flag_set = set()
        if len(y) >= 7:
            recent_scores = y[-7:]
            # Cách 1: tất cả 7 ngày gần nhất đều âm (dưới -0.3)
            if all(score < -0.3 for score in recent_scores):
                risk_flag_set.add("prolonged_negative_trend")
            # Cách 2: độ dốc 7 ngày gần nhất âm rõ rệt
            recent_slope = np.polyfit(np.arange(7), recent_scores, 1)[0]
            if recent_slope < -0.1:
                risk_flag_set.add("prolonged_negative_trend")
        if len(y) >= 3:
            recent_change = y[-1] - y[-3]
            if recent_change < -0.5:
                risk_flag_set.add("rapid_mood_decline")
        if len(y) >= 5:
            recent_volatility = np.std(y[-5:])
            if recent_volatility > 0.5:
                risk_flag_set.add("high_emotional_volatility")
        risk_flags = list(risk_flag_set)

        # Phát hiện patterns theo ngày trong tuần
        patterns = await detect_weekday_patterns(request.user_id, daily_scores)

        # Tạo insights
        insights = generate_enhanced_insights(trend, slope, volatility, patterns, daily_scores)

        # Thống kê
        stats = {
            "data_points": len(daily_scores),
            "average_mood": float(np.mean(y)),
            "min_mood": float(np.min(y)),
            "max_mood": float(np.max(y)),
            "trend_slope": float(slope),
            "volatility": volatility,
            "analysis_period_days": request.days
        }

        # Lưu vào ai_interactions (tuỳ chọn, có thể bỏ qua nếu muốn)
        try:
            await save_analysis_to_db(
                request.user_id, trend, slope, volatility,
                insights, risk_flags, stats
            )
        except Exception as e:
            logger.warning(f"Failed to save analysis to ai_interactions: {e}")

        # Trả về response
        return TrendResponse(
            mood_points=convert_to_mood_points(daily_scores),
            overall_trend=trend,
            trend_score=float(slope),
            volatility=volatility,
            insights=insights,
            risk_flags=risk_flags,
            stats=stats
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patterns/{user_id}")
async def detect_patterns(user_id: str, days: int = 90):
    """
    Endpoint cũ giữ lại để tương thích, nhưng có thể dùng detect_weekday_patterns
    """
    try:
        db = mongodb.get_db()
        mood_entries = await db.dailycheckins.find({
            "user_id": user_id,
            "created_at": {"$gte": datetime.now() - timedelta(days=days)}
        }).to_list(length=None)

        if not mood_entries:
            return {"patterns": [], "message": "Insufficient data for pattern detection"}

        mood_scores_map = {
            "happy": 1, "excited": 1, "peaceful": 0.8, "grateful": 0.9,
            "neutral": 0,
            "sad": -1, "anxious": -0.8, "angry": -0.9, "tired": -0.5
        }
        mood_by_weekday = defaultdict(list)
        for entry in mood_entries:
            weekday = entry["created_at"].strftime("%A")
            mood_str = entry.get("mood", "neutral").lower()
            score = mood_scores_map.get(mood_str, 0)
            mood_by_weekday[weekday].append(score)

        weekday_patterns = []
        for weekday, scores in mood_by_weekday.items():
            if scores:
                avg_score = np.mean(scores)
                weekday_patterns.append({
                    "weekday": weekday,
                    "average_mood": float(avg_score),
                    "count": len(scores)
                })

        weekday_patterns.sort(key=lambda x: x["average_mood"])
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