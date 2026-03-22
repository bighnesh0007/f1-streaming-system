"""
Dead-Letter Queue — Stores failed Kafka messages for later reprocessing.
"""
import json
from db import get_connection
from logger import get_logger

logger = get_logger("f1-consumer.dlq")


def send_to_dlq(topic: str, message_value: dict, error_message: str,
                partition: int = None, offset: int = None, key: str = None):
    """
    Store a failed message in the dead-letter queue table.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO dead_letter_queue 
                (topic, partition_num, offset_num, message_key, message_value, error_message)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            topic,
            partition,
            offset,
            key,
            json.dumps(message_value) if message_value else None,
            str(error_message)[:5000],  # Truncate long error messages
        ))
        conn.commit()
        logger.warning(
            f"Message sent to DLQ: topic={topic}, partition={partition}, "
            f"offset={offset}, error={str(error_message)[:200]}"
        )
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to write to DLQ: {e}", exc_info=True)
    finally:
        cursor.close()
        conn.close()


def get_pending_dlq_messages(limit: int = 100) -> list:
    """Fetch pending DLQ messages for reprocessing."""
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, topic, message_key, message_value, retry_count
            FROM dead_letter_queue
            WHERE status = 'pending' AND retry_count < 3
            ORDER BY created_at ASC
            LIMIT %s
        """, (limit,))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error fetching DLQ messages: {e}")
        return []
    finally:
        cursor.close()
        conn.close()


def mark_dlq_retried(dlq_id: int, success: bool = True):
    """Mark a DLQ message as retried or permanently failed."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if success:
            cursor.execute(
                "UPDATE dead_letter_queue SET status='retried', retry_count=retry_count+1 WHERE id=%s",
                (dlq_id,)
            )
        else:
            cursor.execute("""
                UPDATE dead_letter_queue 
                SET retry_count = retry_count + 1,
                    status = CASE WHEN retry_count >= 2 THEN 'failed' ELSE 'pending' END
                WHERE id = %s
            """, (dlq_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error updating DLQ message {dlq_id}: {e}")
    finally:
        cursor.close()
        conn.close()
