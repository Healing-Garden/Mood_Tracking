from fastapi import Header, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from typing import Optional
import logging
from src.config import settings

logger = logging.getLogger(__name__)

# API Key security scheme
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)

async def get_api_key(api_key: Optional[str] = Security(api_key_header)):
    """Verify API key from header"""
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key is missing"
        )
    
    # In production, validate against database or environment
    valid_keys = [settings.SECRET_KEY]  # Add more keys as needed
    
    if api_key not in valid_keys:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    
    return api_key

# Rate limiting decorator
def rate_limiter(max_requests: int = 60):
    """Simple rate limiter decorator"""
    from functools import wraps
    from datetime import datetime, timedelta
    
    request_log = {}
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get client IP from request
            request = kwargs.get('request')
            if not request:
                return await func(*args, **kwargs)
            
            client_ip = request.client.host
            now = datetime.now()
            
            # Clean old entries
            cutoff = now - timedelta(minutes=1)
            if client_ip in request_log:
                request_log[client_ip] = [
                    ts for ts in request_log[client_ip] 
                    if ts > cutoff
                ]
            else:
                request_log[client_ip] = []
            
            # Check rate limit
            if len(request_log[client_ip]) >= max_requests:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Try again in a minute."
                )
            
            # Log request
            request_log[client_ip].append(now)
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Get current user (placeholder - integrate with your auth system)
async def get_current_user(api_key: str = Depends(get_api_key)):
    """Get current user from API key or token"""
    # This is a placeholder. In real implementation, you would:
    # 1. Decode JWT token
    # 2. Look up user in database
    # 3. Return user object
    
    return {
        "user_id": "demo_user_id",  # Replace with actual user ID
        "api_key": api_key,
        "permissions": ["read", "write"]
    }

# Database session dependency (if using SQL)
async def get_db():
    """Get database session"""
    from src.database.mongodb import get_database
    db = await get_database()
    try:
        yield db
    finally:
        # MongoDB connection is managed globally
        pass