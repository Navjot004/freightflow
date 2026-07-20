import asyncio
import json
from app.core.celery_app import celery_app
from app.db.database import SessionLocal
from app.domain.notifications.models import Notification, NotificationType

@celery_app.task
def create_notification_task(
    company_id: str, 
    title: str, 
    message: str, 
    type_str: str, 
    entity_type: str = None, 
    entity_id: str = None, 
    action_url: str = None,
    target_role: str = None
):
    db = SessionLocal()
    try:
        # 1. Create in DB
        notification = Notification(
            company_id=company_id,
            title=title,
            message=message,
            type=NotificationType(type_str),
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=action_url,
            target_role=target_role
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # 2. Publish to Redis (for WebSockets)
        channel = f"company:{company_id}"
        
        payload = {
            "event": "NEW_NOTIFICATION",
            "data": {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.type.value,
                "company_id": notification.company_id,
                "action_url": notification.action_url
            }
        }
        
        # Since celery is sync, we use a sync redis client to publish
        import redis
        from app.core.config import settings
        sync_redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        sync_redis.publish(channel, json.dumps(payload))
        
    except Exception as e:
        print(f"Failed to create notification asynchronously: {e}")
        db.rollback()
    finally:
        db.close()
