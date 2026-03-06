from fastapi import APIRouter

router = APIRouter()

from .health import router as health_router
from .questions import router as questions_router
from .summary import router as summary_router
from .search import router as search_router
from .trends import router as trends_router
from .actions import router as actions_router
from .sentiment import router as sentiment_router
from .chat import router as chat_router
from .notifications import router as notifications_router

router.include_router(health_router, tags=["health"])
router.include_router(questions_router, prefix="/questions", tags=["questions"])
router.include_router(summary_router, prefix="/summary", tags=["summary"])
router.include_router(search_router, prefix="/search", tags=["search"])
router.include_router(trends_router, prefix="/trends", tags=["trends"])
router.include_router(actions_router, prefix="/actions", tags=["actions"])
router.include_router(sentiment_router, prefix="/sentiment", tags=["sentiment"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
