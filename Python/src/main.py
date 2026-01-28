from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from src.config import settings
from src.api.routes import router as api_router
from src.utils.logger import setup_logger
from src.database.mongodb import connect_to_mongo, close_mongo_connection
from src.database.redis_client import redis_client
from src.ml_models.model_manager import ModelManager

logger = setup_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Mental Health AI Service...")
    
    # Connect to databases
    await connect_to_mongo()
    await redis_client.connect()
    
    # Load ML models
    ModelManager.get_instance().load_models()
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await close_mongo_connection()
    await redis_client.disconnect()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.DEBUG else ["your-domain.com"]
)

# Include routers
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None
    }

@app.get("/health")
async def health_check():
    from src.models import HealthCheck
    
    # Check database connections
    mongo_status = "connected"  # Implement actual check
    redis_status = "connected" if redis_client.is_connected() else "disconnected"
    
    return {
        **HealthCheck().dict(),
        "services": {
            "mongodb": mongo_status,
            "redis": redis_status,
            "ml_models": ModelManager.get_instance().get_model_status()
        }
    }