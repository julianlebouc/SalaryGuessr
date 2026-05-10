import logging
import os
import json
from logging.handlers import TimedRotatingFileHandler
from ..config import LOG_DIR, LOG_RETENTION_DAYS, LOG_LEVEL

class JsonFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings for easier parsing in production.
    """
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "name": record.name,
            "file": f"{record.filename}:{record.lineno}",
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, "extra_data"):
            log_record.update(record.extra_data)
            
        return json.dumps(log_record)

def create_handler(filename, is_json=True):
    """Helper to create a daily rotating file handler."""
    path = os.path.join(LOG_DIR, filename)
    handler = TimedRotatingFileHandler(
        path,
        when="midnight",
        interval=1,
        backupCount=LOG_RETENTION_DAYS,
        encoding="utf-8"
    )
    if is_json:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
    return handler

def setup_loggers():
    # Ensure log directory exists
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR, exist_ok=True)

    # 1. Main Backend Logger
    backend_logger = logging.getLogger("backend")
    backend_logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))
    if not backend_logger.handlers:
        backend_logger.addHandler(create_handler("backend.log"))
        
        console = logging.StreamHandler()
        console.setFormatter(logging.Formatter('%(levelname)s: [%(name)s] %(message)s'))
        backend_logger.addHandler(console)

    # 2. HTTP Access Logger (No console output to avoid noise)
    access_logger = logging.getLogger("access")
    access_logger.setLevel(logging.INFO)
    if not access_logger.handlers:
        access_logger.addHandler(create_handler("access.log"))

    # 3. Frontend Logger (User actions/Client errors)
    frontend_logger = logging.getLogger("frontend")
    frontend_logger.setLevel(logging.INFO)
    if not frontend_logger.handlers:
        frontend_logger.addHandler(create_handler("frontend.log"))

    return backend_logger, access_logger, frontend_logger

# Initialize loggers
logger, access_logger, frontend_logger = setup_loggers()
