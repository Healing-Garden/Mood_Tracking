import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
from src.config import settings
from src.api.router import router as api_router
from src.database import mongodb, redis_client, vector_store
from src.core.embeddings import embedding_service
from src.core.sentiment import sentiment_analyzer
from src.core.summarization import summarization_service

os.makedirs(settings.logs_dir, exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"{settings.logs_dir}/app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Mental Health AI Service...")
    
    try:
        # Connect to databases
        await mongodb.connect()
        await redis_client.connect()
        await vector_store.connect()
        
        # Initialize AI services
        await embedding_service.initialize()
        await sentiment_analyzer.initialize()
        await summarization_service.initialize()
        
        logger.info("All services initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    finally:
        logger.info("Shutting down...")
        await mongodb.disconnect()
        # await redis_client.disconnect()
        await vector_store.disconnect()
        logger.info("Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI Service for Mental Health Tracking & Analytics",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else [
        "localhost",
        "127.0.0.1",
        # Add production domains here
    ]
)

@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    public_paths = [
        "/",
        "/info",
        f"{settings.api_prefix}/health",  
        "/docs",
        "/redoc",
        "/openapi.json"
    ]
    
    if request.url.path in public_paths:
        return await call_next(request)
    
    api_key = request.headers.get(settings.api_key_header)
    
    if not api_key:
        logger.warning(f"Missing API key for {request.url.path}")
        raise HTTPException(status_code=401, detail="API key required")
    
    if api_key != settings.service_api_key:
        logger.warning(f"Invalid API key for {request.url.path}")
        raise HTTPException(status_code=403, detail="Invalid API key")
    
    return await call_next(request)

# Include API routes
app.include_router(api_router, prefix=settings.api_prefix)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": "1.0.0",
        "docs": "/docs" if settings.debug else None,
        "environment": settings.environment
    }

@app.get("/info")
async def info():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "environment": settings.environment,
        "debug": settings.debug,
        "models": {
            "embedding": settings.embedding_model,
            "sentiment": settings.sentiment_model,
            "summarization": settings.summarization_model
        },
        "databases": {
            "mongodb": settings.mongodb_db_name,
            "redis": "connected" if redis_client.client else "disconnected",
            "vector_store": settings.vector_store_type
        }
    }