import logging
from pythonjsonlogger import jsonlogger
from app.core.config import settings
import sys

def setup_logging():
    logger = logging.getLogger()
    
    # Do not reset existing loggers if uvicorn has set them up, just add our handler
    # Actually, to standardize, we'll replace the root handlers
    logger.handlers = []
    
    logHandler = logging.StreamHandler(sys.stdout)
    
    # Define a standard JSON formatter
    # Including specific fields like correlation_id if it's in the log record
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(levelname)s %(name)s %(message)s'
    )
    
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)
    logger.setLevel(settings.LOG_LEVEL)

    # Prevent uvicorn from duplicating logs if we configure root
    # For POC, this ensures structured logging without breaking existing prints
    
    return logger

# Initialize logging when imported
logger = setup_logging()
