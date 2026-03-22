"""
Database Connection — Connection pooling with env-based config.
"""
import mysql.connector
from mysql.connector import pooling
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_POOL_SIZE
from logger import get_logger

logger = get_logger("f1-consumer.db")

# Connection pool (singleton)
_pool = None


def get_pool():
    """Get or create the MySQL connection pool."""
    global _pool
    if _pool is None:
        try:
            _pool = pooling.MySQLConnectionPool(
                pool_name="f1_pool",
                pool_size=DB_POOL_SIZE,
                pool_reset_session=True,
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                autocommit=False,
            )
            logger.info(f"MySQL connection pool created (size={DB_POOL_SIZE})")
        except Exception as e:
            logger.error(f"Failed to create connection pool: {e}", exc_info=True)
            raise
    return _pool


def get_connection():
    """Get a connection from the pool."""
    pool = get_pool()
    return pool.get_connection()