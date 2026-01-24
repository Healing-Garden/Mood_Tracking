import asyncio
from datetime import datetime, timedelta
import logging
from typing import List
from celery import shared_task

from src.database.mongodb import get_database
from src.core.summarizer import SummaryService
from src.core.sentiment import SentimentService
from src.core.embeddings import EmbeddingService

logger = logging.getLogger(__name__)

# Initialize services
summary_service = SummaryService()
sentiment_service = SentimentService()
embedding_service = EmbeddingService()

@shared_task(name="generate_daily_summaries")
def generate_daily_summaries():
    """Generate daily summaries for all active users (Celery task)"""
    try:
        # Run async function in sync context
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(_generate_daily_summaries())

async def _generate_daily_summaries():
    """Async function to generate daily summaries"""
    try:
        db = await get_database()
        
        # Get all active users
        users = await db.users.find(
            {"account_status": "active"},
            {"_id": 1}
        ).to_list(length=None)
        
        logger.info(f"Generating daily summaries for {len(users)} users")
        
        for user in users:
            user_id = str(user["_id"])
            try:
                # Generate summary for yesterday
                target_date = datetime.now() - timedelta(days=1)
                
                summary = await summary_service.generate_daily_summary(
                    user_id=user_id,
                    date=target_date
                )
                
                # Store in AI interactions
                await db.ai_interactions.insert_one({
                    "user_id": user_id,
                    "type": "daily_summary",
                    "content": {
                        "summary": summary["summary"],
                        "date": summary["date"]
                    },
                    "context": {
                        "entry_count": summary["entry_count"],
                        "mood_count": summary["mood_count"],
                        "generated_at": summary["generated_at"]
                    },
                    "created_at": datetime.now()
                })
                
                logger.info(f"Generated daily summary for user {user_id}")
                
            except Exception as e:
                logger.error(f"Failed to generate summary for user {user_id}: {e}")
                continue
        
        return {"status": "success", "users_processed": len(users)}
        
    except Exception as e:
        logger.error(f"Daily summary generation failed: {e}")
        return {"status": "error", "message": str(e)}

@shared_task(name="analyze_emotional_trends")
def analyze_emotional_trends():
    """Analyze emotional trends for all users (Celery task)"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(_analyze_emotional_trends())

async def _analyze_emotional_trends():
    """Async function to analyze emotional trends"""
    try:
        db = await get_database()
        
        # Get all active users
        users = await db.users.find(
            {"account_status": "active"},
            {"_id": 1}
        ).to_list(length=None)
        
        logger.info(f"Analyzing emotional trends for {len(users)} users")
        
        for user in users:
            user_id = str(user["_id"])
            try:
                # Analyze trends for the last 30 days
                trends = await sentiment_service.detect_emotional_trends(
                    user_id=user_id,
                    days=30
                )
                
                # Store analysis
                await db.ai_interactions.insert_one({
                    "user_id": user_id,
                    "type": "emotional_assessment",
                    "content": trends,
                    "context": {
                        "analysis_date": datetime.now(),
                        "time_period_days": 30
                    },
                    "created_at": datetime.now()
                })
                
                # Check for risk flags and alert if needed
                if trends.get("risk_flags"):
                    await _handle_risk_flags(user_id, trends["risk_flags"])
                
                logger.info(f"Analyzed emotional trends for user {user_id}")
                
            except Exception as e:
                logger.error(f"Failed to analyze trends for user {user_id}: {e}")
                continue
        
        return {"status": "success", "users_analyzed": len(users)}
        
    except Exception as e:
        logger.error(f"Emotional trend analysis failed: {e}")
        return {"status": "error", "message": str(e)}

@shared_task(name="update_user_embeddings")
def update_user_embeddings(user_id: str = None):
    """Update embeddings for users (Celery task)"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(_update_user_embeddings(user_id))

async def _update_user_embeddings(user_id: str = None):
    """Async function to update user embeddings"""
    try:
        db = await get_database()
        
        if user_id:
            users = [{"_id": user_id}]
        else:
            # Get users with recent entries but no recent embeddings
            cutoff_date = datetime.now() - timedelta(days=1)
            users = await db.users.find(
                {"account_status": "active"},
                {"_id": 1}
            ).to_list(length=None)
        
        logger.info(f"Updating embeddings for {len(users)} users")
        
        for user in users:
            user_id_str = str(user["_id"])
            try:
                # Update embedding profile
                await embedding_service.update_user_embedding_profile(user_id_str)
                logger.info(f"Updated embeddings for user {user_id_str}")
                
            except Exception as e:
                logger.error(f"Failed to update embeddings for user {user_id_str}: {e}")
                continue
        
        return {"status": "success", "users_updated": len(users)}
        
    except Exception as e:
        logger.error(f"Embedding update failed: {e}")
        return {"status": "error", "message": str(e)}

@shared_task(name="cleanup_old_data")
def cleanup_old_data():
    """Cleanup old data (Celery task)"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(_cleanup_old_data())

async def _cleanup_old_data():
    """Async function to cleanup old data"""
    try:
        db = await get_database()
        
        # Delete AI interactions older than 90 days
        cutoff_date = datetime.now() - timedelta(days=90)
        
        result = await db.ai_interactions.delete_many({
            "created_at": {"$lt": cutoff_date},
            "type": {"$ne": "emotional_assessment"}  # Keep assessments
        })
        
        logger.info(f"Cleaned up {result.deleted_count} old AI interactions")
        
        # Clean Redis cache (optional - would need pattern matching)
        # This is a placeholder for Redis cleanup logic
        
        return {
            "status": "success",
            "deleted_count": result.deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Data cleanup failed: {e}")
        return {"status": "error", "message": str(e)}

async def _handle_risk_flags(user_id: str, risk_flags: List[str]):
    """Handle risk flags detected in emotional analysis"""
    db = await get_database()
    
    # Log the risk detection
    await db.ai_interactions.insert_one({
        "user_id": user_id,
        "type": "risk_detection",
        "content": {
            "risk_flags": risk_flags,
            "action_taken": "logged",
            "timestamp": datetime.now()
        },
        "context": {
            "alert_level": "medium" if len(risk_flags) > 1 else "low",
            "requires_followup": len(risk_flags) > 2
        },
        "created_at": datetime.now()
    })
    
    # TODO: Implement actual alerting system (email, push notification, etc.)
    logger.warning(f"Risk flags detected for user {user_id}: {risk_flags}")