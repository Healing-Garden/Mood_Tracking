from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging
from src.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db = None

mongodb = MongoDB()

async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        mongodb.client = AsyncIOMotorClient(settings.MONGODB_URI)
        mongodb.db = mongodb.client[settings.MONGODB_DB_NAME]
        
        # Test connection
        await mongodb.client.admin.command('ping')
        logger.info("Connected to MongoDB")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    if mongodb.client:
        mongodb.client.close()
        logger.info("Closed MongoDB connection")

async def get_database():
    """Get database instance"""
    if not mongodb.db:
        await connect_to_mongo()
    return mongodb.db

async def create_indexes():
    """Create necessary indexes"""
    db = await get_database()
    
    # Journal entries indexes
    await db.journal_entries.create_index([("user_id", 1), ("created_at", -1)])
    await db.journal_entries.create_index([("user_id", 1), ("deleted_at", 1)])
    await db.journal_entries.create_index([("embedding", 1)])
    
    # Mood entries indexes
    await db.mood_entries.create_index([("user_id", 1), ("created_at", -1)])
    
    # AI interactions indexes
    await db.ai_interactions.create_index([("user_id", 1), ("created_at", -1)])
    await db.ai_interactions.create_index([("type", 1)])
    
    # User vector profiles
    await db.user_vector_profiles.create_index([("user_id", 1)], unique=True)
    
    logger.info("Created MongoDB indexes")