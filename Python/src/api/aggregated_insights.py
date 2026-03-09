import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
from scipy import stats

from src.database import mongodb
from src.database.redis_client import redis_client
from src.config import settings

router = APIRouter(tags=["Aggregated Insights"])
logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if not api_key or api_key != settings.service_api_key:
        raise HTTPException(status_code=403, detail="Invalid or missing API Key")
    return api_key

# ---- Request/Response Models ----
class SegmentFilter(BaseModel):
    age_group: Optional[str] = None  

class InsightRequest(BaseModel):
    date_range: str = "last_30_days" 
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    segments: SegmentFilter = Field(default_factory=SegmentFilter)

class ExecutiveSummary(BaseModel):
    total_active_users: int
    average_mood: Optional[float] = None
    total_interactions: int
    date_range: Dict[str, str]
    message: Optional[str] = None

class CorrelationInsight(BaseModel):
    title: str
    description: str
    correlation_coefficient: Optional[float] = None
    p_value: Optional[float] = None

class UsagePatterns(BaseModel):
    mood_distribution: Dict[str, int]              
    peak_usage_hours: Optional[Dict[int, int]] = None 
    most_used_features: List[Dict[str, Any]] = [] 

class DemographicTrends(BaseModel):
    avg_mood_by_age: Optional[Dict[str, float]] = None

class InsightResponse(BaseModel):
    executive_summary: ExecutiveSummary
    correlation_insights: List[CorrelationInsight]
    usage_patterns: UsagePatterns
    demographic_trends: DemographicTrends
    generated_at: datetime

# ---- Helper functions ----
def generate_cache_key(request: InsightRequest) -> str:
    """Tạo cache key duy nhất dựa trên request."""
    unique_str = (
        f"{request.date_range}:{request.start_date}:{request.end_date}:"
        f"{json.dumps(request.segments.dict(), sort_keys=True)}"
    )
    return f"insights:{hashlib.md5(unique_str.encode()).hexdigest()}"

async def get_cached_result(key: str) -> Optional[InsightResponse]:
    if not redis_client:
        return None

    try:
        cached = await redis_client.get(key)
        if not cached:
            return None

        if isinstance(cached, (dict, list)):
            return InsightResponse.parse_obj(cached)

        if isinstance(cached, str):
            return InsightResponse.parse_raw(cached)

        return None
    except Exception as e:
        logger.error(f"Cache read failed: {e}")
        return None

async def set_cached_result(key: str, result: InsightResponse, ttl: int = 3600):
    if not redis_client:
        return

    try:
        await redis_client.set(key, result.json(), expire=ttl)
    except Exception as e:
        logger.error(f"Cache write failed: {e}")

# ---- Data Fetching (MongoDB) ----
async def fetch_aggregated_data(start: datetime, end: datetime, segments: SegmentFilter) -> dict:
    """
    Lấy dữ liệu tổng hợp, ẩn danh từ các collection.
    Trả về dict chứa total_users, users_data (list of dict), start, end, segments.
    """
    db = mongodb.get_db()

    # 1. Lấy thông tin user: map user_id -> age_group
    pipeline_users = [
        {
            "$match": {
                "$or": [
                    {"createdAt": {"$lte": end}},
                    {"created_at": {"$lte": end}},
                    {"createdAt": {"$exists": False}, "created_at": {"$exists": False}},
                ]
            }
        },
        {
            "$project": {
                "_id": 1,
                "computed_age": {
                    "$let": {
                        "vars": {
                            "dob": {"$ifNull": ["$dateOfBirth", "$date_of_birth"]}
                        },
                        "in": {
                            "$cond": {
                                "if": {"$ifNull": ["$$dob", False]},
                                "then": {
                                    "$floor": {
                                        "$divide": [
                                            {"$subtract": [end, "$$dob"]},
                                            365 * 24 * 60 * 60 * 1000,
                                        ]
                                    }
                                },
                                "else": None,
                            }
                        },
                    }
                },
                "age": {"$ifNull": ["$age", "$computed_age"]},
            }
        },
    ]

    users_list = await db.users.aggregate(pipeline_users).to_list(length=None)
    user_age_map = {}
    for u in users_list:
        uid = str(u["_id"])
        age = u.get("age")
        if age is not None:
            if age < 18:
                age_group = "0-17"
            elif age < 25:
                age_group = "18-24"
            elif age < 35:
                age_group = "25-34"
            elif age < 50:
                age_group = "35-49"
            else:
                age_group = "50+"
        else:
            age_group = "unknown"
        user_age_map[uid] = age_group

    # 2. Journal entries: tổng hợp theo user
    pipeline_journal = [
        {"$match": {
            "created_at": {"$gte": start, "$lte": end},
            "deleted_at": None
        }},
        {"$group": {
            "_id": "$user_id",
            "journal_count": {"$sum": 1},
            "avg_mood_score": {"$avg": "$sentiment.score"},  
            "sentiments": {"$push": "$sentiment.sentiment"}
        }},
        {"$project": {
            "user_id": "$_id",
            "journal_count": 1,
            "avg_mood_score": 1,
            "sentiments": 1,
            "_id": 0
        }}
    ]
    journal_stats = await db.journal_entries.aggregate(pipeline_journal).to_list(length=None)

    # 3. Daily checkins
    pipeline_checkin = [
        {"$match": {"date": {"$gte": start, "$lte": end}}},
        {"$group": {
            "_id": "$user_id",
            "checkin_count": {"$sum": 1},
            "avg_energy": {"$avg": "$energy"},
            "moods": {"$push": "$mood"}
        }},
        {"$project": {
            "user_id": "$_id",
            "checkin_count": 1,
            "avg_energy": 1,
            "moods": 1,
            "_id": 0
        }}
    ]
    checkin_stats = await db.dailycheckins.aggregate(pipeline_checkin).to_list(length=None)

    # 4. Chat sessions
    pipeline_chat = [
        {"$match": {"start_time": {"$gte": start, "$lte": end}}},
        {"$group": {
            "_id": "$user_id",
            "chat_count": {"$sum": 1},
            "avg_risk": {"$avg": "$risk_level"}
        }},
        {"$project": {
            "user_id": "$_id",
            "chat_count": 1,
            "avg_risk": 1,
            "_id": 0
        }}
    ]
    chat_stats = await db.chat_sessions.aggregate(pipeline_chat).to_list(length=None)

    # 5. Chuyển thành DataFrame
    df_journal = pd.DataFrame(journal_stats)
    df_checkin = pd.DataFrame(checkin_stats)
    df_chat = pd.DataFrame(chat_stats)

    # Đặt tên cột chung là 'uid' để merge
    for df in (df_journal, df_checkin, df_chat):
        if not df.empty:
            df.rename(columns={"user_id": "uid"}, inplace=True)

    # Merge dần các DataFrame
    df = pd.DataFrame()
    if not df_journal.empty:
        df = df_journal
    if not df_checkin.empty:
        if df.empty:
            df = df_checkin
        else:
            df = df.merge(df_checkin, on="uid", how="outer")
    if not df_chat.empty:
        if df.empty:
            df = df_chat
        else:
            df = df.merge(df_chat, on="uid", how="outer")

    if df.empty:
        return {"total_users": 0, "users_data": []}

    df.fillna(0, inplace=True)

    # Thêm nhóm tuổi
    df["age_group"] = df["uid"].apply(lambda uid: user_age_map.get(str(uid), "unknown"))

    # Áp dụng bộ lọc segment
    if segments.age_group and segments.age_group != "all":
        df = df[df["age_group"] == segments.age_group]

    # Loại bỏ uid để ẩn danh
    users_data = df.drop(columns=["uid"]).to_dict(orient="records")

    return {
        "total_users": len(df),
        "users_data": users_data,
        "start": start,
        "end": end,
        "segments": segments.dict()
    }

# ---- Analysis Functions ----
async def perform_analysis(data: dict) -> InsightResponse:
    """Thực hiện phân tích dữ liệu đã được tổng hợp."""
    df = pd.DataFrame(data["users_data"])
    total_users = data["total_users"]

    def safe_sum(column: str) -> int:
        if column not in df.columns:
            return 0
        try:
            return int(pd.to_numeric(df[column], errors="coerce").fillna(0).sum())
        except Exception:
            return int(df[column].fillna(0).sum())

    # 1. Executive Summary
    avg_mood = None
    if "avg_mood_score" in df.columns and not df["avg_mood_score"].isna().all():
        avg_mood = df["avg_mood_score"].mean()

    total_interactions = int(
        safe_sum("journal_count") +
        safe_sum("checkin_count") +
        safe_sum("chat_count")
    )

    exec_summary = ExecutiveSummary(
        total_active_users=total_users,
        average_mood=round(avg_mood, 3) if avg_mood else None,
        total_interactions=total_interactions,
        date_range={
            "start": data["start"].isoformat(),
            "end": data["end"].isoformat()
        }
    )

    # 2. Correlation Insights
    correlation_insights = []
    if "journal_count" in df.columns and "avg_mood_score" in df.columns:
        sub = df[["journal_count", "avg_mood_score"]].dropna()
        if len(sub) >= 10:  # BR-41-04
            corr, p_value = stats.pearsonr(sub["journal_count"], sub["avg_mood_score"])
            if p_value < 0.05 and abs(corr) > 0.2:  # Ngưỡng thống kê
                direction = "tích cực" if corr > 0 else "tiêu cực"
                correlation_insights.append(CorrelationInsight(
                    title="Tương quan giữa số lần journal và mood",
                    description=(
                        f"Người dùng journal nhiều có xu hướng mood {direction} hơn. "
                        f"(r={corr:.2f}, p={p_value:.3f})"
                    ),
                    correlation_coefficient=round(corr, 3),
                    p_value=round(p_value, 4)
                ))

    # 3. Usage Patterns
    mood_dist = {}
    # Từ sentiments trong journal
    if "sentiments" in df.columns:
        all_sentiments = []
        for s_list in df["sentiments"].dropna():
            all_sentiments.extend(s_list)
        if all_sentiments:
            mood_dist = pd.Series(all_sentiments).value_counts().to_dict()
    # Fallback: từ moods trong checkin
    if not mood_dist and "moods" in df.columns:
        all_moods = []
        for m_list in df["moods"].dropna():
            all_moods.extend(m_list)
        if all_moods:
            mood_dist = pd.Series(all_moods).value_counts().to_dict()

    # Tính peak_usage_hours và most_used_features có thể bổ sung sau nếu có log chi tiết
    usage_patterns = UsagePatterns(
        mood_distribution=mood_dist,
        peak_usage_hours=None,
        most_used_features=[]
    )

    # 4. Demographic Trends
    demo_trends = DemographicTrends()
    if "age_group" in df.columns and "avg_mood_score" in df.columns:
        grouped = df.groupby("age_group")["avg_mood_score"].mean().dropna()
        demo_trends.avg_mood_by_age = grouped.round(3).to_dict()

    return InsightResponse(
        executive_summary=exec_summary,
        correlation_insights=correlation_insights,
        usage_patterns=usage_patterns,
        demographic_trends=demo_trends,
        generated_at=datetime.utcnow()
    )

def generate_insufficient_data_response(user_count: int, start: datetime, end: datetime) -> InsightResponse:
    """Trả về response khi không đủ dữ liệu (dưới 10 user)."""
    return InsightResponse(
        executive_summary=ExecutiveSummary(
            total_active_users=user_count,
            average_mood=None,
            total_interactions=0,
            date_range={"start": start.isoformat(), "end": end.isoformat()},
            message=(
                f"Insufficient user data for in-depth analysis. "
                f"Currently there are {user_count} users in this segment (minimum required: 10)."
            )
        ),
        correlation_insights=[],
        usage_patterns=UsagePatterns(mood_distribution={}, peak_usage_hours=None, most_used_features=[]),
        demographic_trends=DemographicTrends(),
        generated_at=datetime.utcnow()
    )

# ---- API Endpoint ----
@router.post("/analyze", response_model=InsightResponse)
async def analyze_aggregated_insights(
    request: InsightRequest,
    api_key: str = Depends(verify_api_key)   # xác thực từ settings
):
    """
    Phân tích dữ liệu tổng hợp ẩn danh cho admin.
    - Yêu cầu API key trong header X-API-Key (khớp với SERVICE_API_KEY trong .env)
    - Trả về insights tổng hợp, đảm bảo ẩn danh và tối thiểu 10 users mỗi segment.
    """
    try:
        # Xác định khoảng thời gian
        end = request.end_date or datetime.utcnow()
        if request.date_range == "last_7_days":
            start = end - timedelta(days=7)
        elif request.date_range == "last_30_days":
            start = end - timedelta(days=30)
        elif request.date_range == "last_90_days":
            start = end - timedelta(days=90)
        elif request.date_range == "custom" and request.start_date:
            start = request.start_date
        else:
            start = end - timedelta(days=30)  # mặc định

        # Kiểm tra cache
        cache_key = generate_cache_key(request)
        cached = await get_cached_result(cache_key)
        if cached:
            logger.info(f"Cache hit for {cache_key}")
            return cached

        # Lấy dữ liệu
        data = await fetch_aggregated_data(start, end, request.segments)

        # Kiểm tra đủ dữ liệu (BR-41-04)
        if data["total_users"] < 10:
            response = generate_insufficient_data_response(data["total_users"], start, end)
        else:
            response = await perform_analysis(data)

        # Lưu cache (TTL 1 giờ)
        await set_cached_result(cache_key, response)

        return response

    except Exception as e:
        logger.error(f"Error in aggregated insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")