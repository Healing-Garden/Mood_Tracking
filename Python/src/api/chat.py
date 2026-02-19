from fastapi import APIRouter, HTTPException
from src.models import ChatMessageRequest, SentimentRequest, ChatMessageResponse
from src.core.cbt_agent import cbt_agent
from src.core.sentiment import sentiment_analyzer
import logging

router = APIRouter(tags=["CBT Chat"])

@router.post("/process_message", response_model=ChatMessageResponse)
async def process_message(request: ChatMessageRequest):
    try:
        result = await cbt_agent.process_message(
            user_input=request.text,
            session_state=request.session_state,
            user_context=request.user_context,
            conversation_history=request.recent_messages
        )
        return ChatMessageResponse(**result)
    except Exception as e:
        logging.error(f"Chat processing error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")

@router.post("/analyze_sentiment")
async def analyze_sentiment(request: SentimentRequest):
    try:
        import asyncio
        result = await asyncio.to_thread(sentiment_analyzer.analyze_journal_entry, request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health():
    return {"status": "ok"}