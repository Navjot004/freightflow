import logging
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.domain.freight.loads.models import Load
from app.domain.freight.shipments.models import Shipment
from app.domain.notifications.service import create_notification
from app.domain.notifications.models import NotificationType
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def check_appointments():
    db = SessionLocal()
    try:
        now = datetime.now()
        # Find active shipments that are not completed or cancelled
        shipments = db.query(Shipment).filter(Shipment.status.in_([
            "DRIVER_ASSIGNED", "DRIVER_ACCEPTED", "PICKUP_STARTED", "IN_TRANSIT"
        ])).all()
        
        for shipment in shipments:
            load = shipment.load
            if not load:
                continue
                
            # Check pickup appointment
            if shipment.status in ["DRIVER_ASSIGNED", "DRIVER_ACCEPTED", "PICKUP_STARTED"] and load.pickup_appointment_date and load.pickup_appointment_time:
                try:
                    time_parts = load.pickup_appointment_time.split(":")
                    if len(time_parts) >= 2:
                        hour = int(time_parts[0])
                        minute = int(time_parts[1])
                        
                        apt_datetime = load.pickup_appointment_date.replace(hour=hour, minute=minute)
                        time_diff = apt_datetime - now
                        
                        # We send notifications to the carrier company, for driver role
                        company_id = shipment.carrier_id or load.shipper_id
                        
                        # 1 hour warning (between 55 and 65 mins away)
                        if timedelta(minutes=55) <= time_diff <= timedelta(minutes=65):
                            create_notification(db, company_id, "Upcoming Pickup", f"Pickup appointment is in 1 hour for Load {load.id}", type=NotificationType.WARNING, target_role="DRIVER")
                            create_notification(db, company_id, "Upcoming Pickup", f"Pickup appointment is in 1 hour for Driver on Load {load.id}", type=NotificationType.WARNING, target_role="DISPATCHER")
                                
                        # 30 min warning (between 25 and 35 mins away)
                        elif timedelta(minutes=25) <= time_diff <= timedelta(minutes=35):
                            create_notification(db, company_id, "Upcoming Pickup", f"Pickup appointment is in 30 minutes for Load {load.id}", type=NotificationType.WARNING, target_role="DRIVER")
                            create_notification(db, company_id, "Upcoming Pickup", f"Pickup appointment is in 30 minutes for Driver on Load {load.id}", type=NotificationType.WARNING, target_role="DISPATCHER")
                            
                        # Missed warning (between -5 and -15 mins)
                        elif timedelta(minutes=-15) <= time_diff <= timedelta(minutes=-5):
                            create_notification(db, company_id, "Missed Pickup", f"Pickup appointment time has passed for Load {load.id}", type=NotificationType.ERROR, target_role="DRIVER")
                            create_notification(db, company_id, "Missed Pickup", f"Pickup appointment time has passed for Driver on Load {load.id}", type=NotificationType.ERROR, target_role="DISPATCHER")
                            
                except Exception as e:
                    logger.error(f"Error parsing pickup time: {e}")
                    
            # Check delivery appointment
            if shipment.status == "IN_TRANSIT" and load.delivery_appointment_date and load.delivery_appointment_time:
                try:
                    time_parts = load.delivery_appointment_time.split(":")
                    if len(time_parts) >= 2:
                        hour = int(time_parts[0])
                        minute = int(time_parts[1])
                        
                        apt_datetime = load.delivery_appointment_date.replace(hour=hour, minute=minute)
                        time_diff = apt_datetime - now
                        
                        company_id = shipment.carrier_id or load.shipper_id
                        
                        # 1 hour warning
                        if timedelta(minutes=55) <= time_diff <= timedelta(minutes=65):
                            create_notification(db, company_id, "Upcoming Delivery", f"Delivery appointment is in 1 hour for Load {load.id}", type=NotificationType.WARNING, target_role="DRIVER")
                            create_notification(db, company_id, "Upcoming Delivery", f"Delivery appointment is in 1 hour for Driver on Load {load.id}", type=NotificationType.WARNING, target_role="DISPATCHER")
                                
                        # 30 min warning
                        elif timedelta(minutes=25) <= time_diff <= timedelta(minutes=35):
                            create_notification(db, company_id, "Upcoming Delivery", f"Delivery appointment is in 30 minutes for Load {load.id}", type=NotificationType.WARNING, target_role="DRIVER")
                            create_notification(db, company_id, "Upcoming Delivery", f"Delivery appointment is in 30 minutes for Driver on Load {load.id}", type=NotificationType.WARNING, target_role="DISPATCHER")
                            
                        # Missed warning
                        elif timedelta(minutes=-15) <= time_diff <= timedelta(minutes=-5):
                            create_notification(db, company_id, "Missed Delivery", f"Delivery appointment time has passed for Load {load.id}", type=NotificationType.ERROR, target_role="DRIVER")
                            create_notification(db, company_id, "Missed Delivery", f"Delivery appointment time has passed for Driver on Load {load.id}", type=NotificationType.ERROR, target_role="DISPATCHER")
                except Exception as e:
                    logger.error(f"Error parsing delivery time: {e}")
    except Exception as e:
        logger.error(f"Error in check_appointments task: {e}")
    finally:
        db.close()

# Run every 10 minutes
scheduler.add_job(check_appointments, 'interval', minutes=10)
