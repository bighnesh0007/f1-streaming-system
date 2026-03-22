"""
Structured JSON logger for the Consumer service.
"""
import logging
import json
import sys
from datetime import datetime, timezone
from config import LOG_LEVEL


class JSONFormatter(logging.Formatter):
    """Formats log records as JSON lines."""

    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "f1-consumer",
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        if hasattr(record, 'extra_data'):
            log_entry["data"] = record.extra_data
        return json.dumps(log_entry)


def get_logger(name: str = "f1-consumer") -> logging.Logger:
    """Create and return a configured JSON logger."""
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))

    return logger
