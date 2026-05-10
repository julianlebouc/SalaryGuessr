import logging
import os
from logging.handlers import TimedRotatingFileHandler
from ..config import LOG_DIR, LOG_RETENTION_DAYS, LOG_LEVEL

def setup_logger():
    """
    Configures a logger that writes to both stdout and a daily rotating file.
    Automatically handles log retention.
    """
    # Ensure log directory exists
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)
        print(f"[SYSTEM] Created log directory: {LOG_DIR}")

    logger = logging.getLogger("SalaryGuessr")
    logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

    # Avoid adding handlers if they already exist
    if logger.handlers:
        return logger

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    log_file = os.path.join(LOG_DIR, "salaryguessr.log")
    file_handler = TimedRotatingFileHandler(
        log_file,
        when="midnight",
        interval=1,
        backupCount=LOG_RETENTION_DAYS,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    logger.info(f"Logging initialized. Level: {LOG_LEVEL}, Retention: {LOG_RETENTION_DAYS} days")
    return logger

# Create a singleton-like instance
logger = setup_logger()
