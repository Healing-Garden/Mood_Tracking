import redis.asyncio as redis
from typing import Any, Optional, Union
import json
import logging
from src.config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    """Async Redis client with connection pooling"""
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.pool: Optional[redis.ConnectionPool] = None
    
    async def connect(self):
        """Connect to Redis with connection pooling"""
        try:
            url = settings.redis_url
            
            # Auto-fix: Nếu là upstash nhưng thiếu rediss:// thì thêm vào
            if "upstash.io" in url and url.startswith("redis://"):
                url = url.replace("redis://", "rediss://", 1)
                logger.warning("Automatically upgraded Upstash URL to rediss:// for secure connection")

            # Mask password for logging
            import re
            masked_url = re.sub(r':([^:@]+)@', ':****@', url)
            logger.info(f"Connecting to Redis: {masked_url}")

            # Connection options
            kwargs = {
                "max_connections": 20,
                "decode_responses": True,
                "encoding": "utf-8"
            }
            
            # Chỉ thêm ssl_cert_reqs cho rediss://
            if url.startswith("rediss://"):
                kwargs["ssl_cert_reqs"] = "none"
                logger.info("SSL (TLS) enabled for Redis connection")
            
            # Create client directly from URL (internal pooling)
            self.client = redis.from_url(url, **kwargs)
            
            # Test connection
            await self.client.ping()
            logger.info("Connected to Redis successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.client:
            await self.client.aclose()
            self.client = None
        logger.info("Disconnected from Redis")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        try:
            value = await self.client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
            return None
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set value in Redis"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            if expire:
                return await self.client.setex(key, expire, value)
            else:
                return await self.client.set(key, value)
        except Exception as e:
            logger.error(f"Redis SET error: {e}")
            return False
    
    async def delete(self, *keys) -> int:
        """Delete keys from Redis"""
        try:
            return await self.client.delete(*keys)
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return await self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis EXISTS error: {e}")
            return False
    
    async def incr(self, key: str) -> int:
        """Increment counter"""
        try:
            return await self.client.incr(key)
        except Exception as e:
            logger.error(f"Redis INCR error: {e}")
            return 0
    
    async def hset(self, key: str, mapping: dict) -> bool:
        """Set hash field"""
        try:
            return await self.client.hset(key, mapping=mapping) > 0
        except Exception as e:
            logger.error(f"Redis HSET error: {e}")
            return False
    
    async def hget(self, key: str, field: str) -> Optional[Any]:
        """Get hash field"""
        try:
            value = await self.client.hget(key, field)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Redis HGET error: {e}")
            return None

# Global Redis client instance
redis_client = RedisClient()