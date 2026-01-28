from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Request/Response Models
class HealthCheck(BaseModel):
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)

class EmbeddingRequest(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = None

class EmbeddingResponse(BaseModel):
    vector: List[float]
    dimension: int
    model: str

class SentimentRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

class SentimentResponse(BaseModel):
    sentiment: str  # positive, negative, neutral
    score: float  # -1 to 1
    confidence: float
    emotions: Optional[Dict[str, float]] = None

class SummaryRequest(BaseModel):
    texts: List[str]
    max_length: Optional[int] = 150
    min_length: Optional[int] = 30

class SummaryResponse(BaseModel):
    summary: str
    original_length: int
    summary_length: int

class QuestionGenerationRequest(BaseModel):
    journal_entries: List[Dict[str, Any]]
    count: Optional[int] = 5

class QuestionGenerationResponse(BaseModel):
    questions: List[str]
    context: Dict[str, Any]

class EmotionalAnalysisRequest(BaseModel):
    entries: List[Dict[str, Any]]
    mood_entries: Optional[List[Dict[str, Any]]] = None
    timeframe_days: int = 30

class EmotionalAnalysisResponse(BaseModel):
    overall_sentiment: float
    dominant_emotions: List[str]
    risk_flags: List[str]
    trends: Dict[str, Any]
    recommendations: List[str]

class SemanticSearchRequest(BaseModel):
    query: str
    user_id: str
    limit: Optional[int] = 10

class SemanticSearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    query_embedding: Optional[List[float]] = None

# Data Models
class JournalEntryEmbedding(BaseModel):
    entry_id: str
    user_id: str
    text: str
    embedding: List[float]
    metadata: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.now)

class UserVectorProfile(BaseModel):
    user_id: str
    embeddings_count: int
    last_updated: datetime
    profile_vector: Optional[List[float]] = None