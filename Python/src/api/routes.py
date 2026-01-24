from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
import logging

from src.models import *
from src.core.embeddings import EmbeddingService
from src.core.sentiment import SentimentService
from src.core.summarizer import SummaryService
from src.core.question_generator import QuestionGenerator
from src.api.dependencies import get_current_user, rate_limiter

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services
embedding_service = EmbeddingService()
sentiment_service = SentimentService()
summary_service = SummaryService()
question_generator = QuestionGenerator()

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.post("/embeddings/create", response_model=EmbeddingResponse)
@rate_limiter(max_requests=60)
async def create_embedding(
    request: EmbeddingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create embedding for text"""
    try:
        result = await embedding_service.create_embedding(
            request.text,
            request.metadata
        )
        return EmbeddingResponse(**result)
    except Exception as e:
        logger.error(f"Embedding creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create embedding"
        )

@router.post("/sentiment/analyze", response_model=SentimentResponse)
@rate_limiter(max_requests=100)
async def analyze_sentiment(
    request: SentimentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze sentiment of text"""
    try:
        model_manager = ModelManager.get_instance()
        result = model_manager.analyze_sentiment(request.text)
        
        return SentimentResponse(
            sentiment=result["sentiment"],
            score=result["score"],
            confidence=result["confidence"]
        )
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze sentiment"
        )

@router.post("/summarize", response_model=SummaryResponse)
@rate_limiter(max_requests=30)
async def summarize_text(
    request: SummaryRequest,
    current_user: dict = Depends(get_current_user)
):
    """Summarize text"""
    try:
        combined_text = " ".join(request.texts)
        model_manager = ModelManager.get_instance()
        summary = model_manager.summarize_text(
            combined_text,
            max_length=request.max_length,
            min_length=request.min_length
        )
        
        return SummaryResponse(
            summary=summary,
            original_length=len(combined_text),
            summary_length=len(summary)
        )
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate summary"
        )

@router.post("/questions/generate", response_model=QuestionGenerationResponse)
@rate_limiter(max_requests=60)
async def generate_questions(
    request: QuestionGenerationRequest,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """Generate prompting questions"""
    try:
        # In a real scenario, you would use user_id from current_user
        user_id = current_user.get("user_id", "demo_user")
        
        questions = await question_generator.generate_questions(
            user_id=user_id,
            count=request.count
        )
        
        return QuestionGenerationResponse(
            questions=questions,
            context={"entry_count": len(request.journal_entries)}
        )
    except Exception as e:
        logger.error(f"Question generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate questions"
        )

@router.post("/analysis/emotional", response_model=EmotionalAnalysisResponse)
@rate_limiter(max_requests=30)
async def analyze_emotional_state(
    request: EmotionalAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze emotional state and trends"""
    try:
        # Analyze sentiment of entries
        sentiment_result = await sentiment_service.analyze_journal_entries(request.entries)
        
        # If user_id is available, analyze trends
        trends = {}
        risk_flags = []
        
        # Mock trend analysis for now
        if len(request.entries) > 5:
            # Simple trend detection
            scores = [entry.get("sentiment_score", 0) for entry in request.entries]
            avg_score = sum(scores) / len(scores)
            
            if avg_score < -0.3:
                risk_flags.append("consistently_negative")
            elif avg_score > 0.3:
                risk_flags.append("consistently_positive")
        
        return EmotionalAnalysisResponse(
            overall_sentiment=sentiment_result["overall_sentiment"],
            dominant_emotions=[sentiment_result["dominant_sentiment"]],
            risk_flags=risk_flags,
            trends=trends,
            recommendations=[
                "Consider practicing mindfulness",
                "Try journaling about positive experiences"
            ]
        )
    except Exception as e:
        logger.error(f"Emotional analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze emotional state"
        )

@router.post("/search/semantic", response_model=SemanticSearchResponse)
@rate_limiter(max_requests=60)
async def semantic_search(
    request: SemanticSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """Semantic search through journal entries"""
    try:
        results = await embedding_service.search_similar(
            query=request.query,
            user_id=request.user_id,
            limit=request.limit
        )
        
        return SemanticSearchResponse(
            results=results,
            query_embedding=None  # Optional: include if needed
        )
    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform semantic search"
        )

@router.post("/summary/daily")
@rate_limiter(max_requests=10)
async def generate_daily_summary(
    user_id: str,
    date: str = None,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """Generate daily summary (usually called by cron job)"""
    try:
        from datetime import datetime
        
        target_date = datetime.fromisoformat(date) if date else datetime.now()
        
        summary = await summary_service.generate_daily_summary(
            user_id=user_id,
            date=target_date
        )
        
        return summary
    except Exception as e:
        logger.error(f"Daily summary generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate daily summary"
        )