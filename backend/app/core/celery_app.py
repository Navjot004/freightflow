from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "freightflow_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.email_tasks",
        "app.tasks.document_tasks",
        "app.tasks.notification_tasks"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Optional: define Celery Beat schedule here
celery_app.conf.beat_schedule = {
    # Example periodic task (can be expanded later for compliance/invoice checks)
    # "check_compliance_daily": {
    #     "task": "app.tasks.compliance_tasks.check_daily",
    #     "schedule": 86400.0,
    # },
}
