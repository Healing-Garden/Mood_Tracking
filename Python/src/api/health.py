from fastapi import APIRouter, Depends
from datetime import datetime
import logging
from src.database import mongodb, redis_client, vector_store
from src.core.embeddings import embedding_service
from src.core.sentiment import sentiment_analyzer
from src.core.summarization import summarization_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB
        mongo_status = False
        try:
            await mongodb.get_db().command("ping")
            mongo_status = True
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
        
        # Test Redis
        redis_status = False
        try:
            await redis_client.client.ping()
            redis_status = True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
        
        # Test Vector Store
        vector_status = False
        try:
            # Try to list collections
            collections = vector_store.client.list_collections()
            vector_status = True
        except Exception as e:
            logger.error(f"Vector store health check failed: {e}")
        
        # Test AI Models
        ai_status = {
            "embeddings": embedding_service.model is not None,
            "sentiment": sentiment_analyzer.sentiment_pipeline is not None,
            "summarization": summarization_service.summarizer is not None
        }
        
        overall_status = (
            mongo_status and 
            redis_status and 
            all(ai_status.values())
        )
        
        return {
            "status": "healthy" if overall_status else "degraded",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "mongodb": {
                    "status": "connected" if mongo_status else "disconnected",
                    "database": mongodb.get_db().name if mongo_status else None
                },
                "redis": {
                    "status": "connected" if redis_status else "disconnected"
                },
                "vector_store": {
                    "status": "connected" if vector_status else "disconnected",
                    "type": "chromadb"
                },
                "ai_models": ai_status
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }