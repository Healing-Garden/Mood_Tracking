import motor.motor_asyncio
from typing import Optional
import logging
from src.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    _instance: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    _db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect(cls):
        """Connect to MongoDB"""
        if cls._instance is None:
            try:
                cls._instance = motor.motor_asyncio.AsyncIOMotorClient(
                    settings.mongodb_uri,
                    maxPoolSize=100,
                    minPoolSize=10,
                    retryWrites=True,
                    connectTimeoutMS=10000,
                    serverSelectionTimeoutMS=10000
                )
                
                # Test connection
                await cls._instance.admin.command('ping')
                cls._db = cls._instance[settings.mongodb_db_name]
                
                logger.info(f"Connected to MongoDB: {settings.mongodb_db_name}")
                
                # Create indexes
                await cls._create_indexes()
                
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise
    
    @classmethod
    async def disconnect(cls):
        """Disconnect from MongoDB"""
        if cls._instance:
            cls._instance.close()
            cls._instance = None
            cls._db = None
            logger.info("Disconnected from MongoDB")
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        if cls._db is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return cls._db
    
    @classmethod
    async def _create_indexes(cls):
        """Create necessary indexes"""
        db = cls.get_db()
        
        # Journal entries indexes
        await db.journal_entries.create_index([("user_id", 1), ("created_at", -1)])
        await db.journal_entries.create_index([("user_id", 1), ("deleted_at", 1)])
        await db.journal_entries.create_index([("mood", 1)])
        
        # Mood entries indexes
        await db.mood_entries.create_index([("user_id", 1), ("created_at", -1)])
        
        # AI interactions indexes
        await db.ai_interactions.create_index([("user_id", 1), ("created_at", -1)])
        await db.ai_interactions.create_index([("type", 1)])
        
        logger.info("MongoDB indexes created")
    
    @classmethod
    async def get_collection(cls, name: str):
        """Get collection by name"""
        db = cls.get_db()
        return db[name]

# Global MongoDB instance
mongodb = MongoDB()