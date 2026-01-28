import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict
from src.config import settings

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_object = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_object["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "extra"):
            log_object.update(record.extra)
        
        return json.dumps(log_object)

def setup_logger(name: str = "mental_health_ai") -> logging.Logger:
    """
    Setup logger with appropriate configuration
    
    Args:
        name: Logger name
    
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(name)
    
    # Set log level based on environment
    if settings.DEBUG:
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(logging.INFO)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    # Set formatter based on environment
    if settings.ENVIRONMENT == "production":
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        )
    
    # Add handler to logger
    logger.addHandler(console_handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger

def log_extra(extra: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add extra fields to log record
    
    Args:
        extra: Extra fields to add
    
    Returns:
        Dictionary with extra fields
    """
    return {"extra": extra}

# Create default logger
logger = setup_logger()

# Convenience functions
def log_request(request_info: Dict[str, Any]):
    """Log HTTP request information"""
    logger.info(
        "HTTP Request",
        extra=log_extra({
            "type": "http_request",
            **request_info
        })
    )

def log_ai_interaction(interaction_info: Dict[str, Any]):
    """Log AI interaction"""
    logger.info(
        "AI Interaction",
        extra=log_extra({
            "type": "ai_interaction",
            **interaction_info
        })
    )

def log_model_usage(model_info: Dict[str, Any]):
    """Log model usage for monitoring"""
    logger.debug(
        "Model Usage",
        extra=log_extra({
            "type": "model_usage",
            **model_info
        })
    )