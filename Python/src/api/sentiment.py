from fastapi import APIRouter
from pydantic import BaseModel
import logging
from src.core.sentiment import sentiment_analyzer

router = APIRouter()
logger = logging.getLogger(__name__)

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: str
    score: float
    confidence: float
    emotions: list = None

@router.post("/analyze")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of text"""
    try:
        result = sentiment_analyzer.analyze_sentiment(request.text)
        
        return SentimentResponse(
            sentiment=result["sentiment"],
            score=result["score"],
            confidence=result["confidence"]
        )
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        return SentimentResponse(
            sentiment="neutral",
            score=0.0,
            confidence=0.0
        )