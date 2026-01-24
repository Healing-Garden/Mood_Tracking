import redis.asyncio as redis
from typing import Any, Optional, Union
import json
import logging
from src.config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    """Async Redis client wrapper"""
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self.client = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.client.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.client:
            await self.client.close()
            logger.info("Disconnected from Redis")
    
    async def get(self, key: str) -> Any:
        """Get value from Redis"""
        if not self.client:
            raise ConnectionError("Redis client not connected")
        
        try:
            value = await self.client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set value in Redis"""
        if not self.client:
            raise ConnectionError("Redis client not connected")
        
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            if expire:
                await self.client.setex(key, expire, value)
            else:
                await self.client.set(key, value)
            
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        if not self.client:
            raise ConnectionError("Redis client not connected")
        
        try:
            result = await self.client.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.client:
            raise ConnectionError("Redis client not connected")
        
        try:
            result = await self.client.exists(key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return False
    
    async def increment(self, key: str) -> int:
        """Increment counter"""
        if not self.client:
            raise ConnectionError("Redis client not connected")
        
        try:
            return await self.client.incr(key)
        except Exception as e:
            logger.error(f"Redis increment error: {e}")
            return 0
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration for key"""
        if not self.client:
            raise ConnectionError("Redis client not connected")
        
        try:
            return await self.client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis expire error: {e}")
            return False
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        return self.client is not None

# Global Redis client instance
redis_client = RedisClient()