from celery import Celery
from src.config import settings

def create_celery_app():
    """Create and configure Celery application"""
    
    # Create Celery app
    app = Celery(
        "mental_health_tasks",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
        include=["src.tasks.scheduled_tasks"]
    )
    
    # Configure Celery
    app.conf.update(
        # Broker settings
        broker_connection_retry_on_startup=True,
        broker_connection_max_retries=None,
        
        # Task settings
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        task_ignore_result=False,
        task_track_started=True,
        task_time_limit=30 * 60,  # 30 minutes
        task_soft_time_limit=25 * 60,  # 25 minutes
        
        # Worker settings
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=100,
        
        # Beat schedule
        beat_schedule={
            'generate-daily-summaries': {
                'task': 'src.tasks.scheduled_tasks.generate_daily_summaries',
                'schedule': 3600.0,  # Every hour
            },
            'analyze-emotional-trends': {
                'task': 'src.tasks.scheduled_tasks.analyze_emotional_trends',
                'schedule': 86400.0,  # Daily
            },
            'cleanup-old-data': {
                'task': 'src.tasks.scheduled_tasks.cleanup_old_data',
                'schedule': 604800.0,  # Weekly
            },
        },
        beat_scheduler='celery.beat:PersistentScheduler',
        
        # Timezone
        timezone='UTC',
        enable_utc=True,
    )
    
    return app

# Create celery app instance
celery_app = create_celery_app()