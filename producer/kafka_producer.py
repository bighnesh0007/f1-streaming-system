"""
Kafka Producer Wrapper — partition-aware producer with delivery callbacks.
"""
import json
from kafka import KafkaProducer as KP
from logger import get_logger
from config import KAFKA_BOOTSTRAP_SERVERS

logger = get_logger("f1-producer.kafka")


class F1KafkaProducer:
    """Kafka producer with driver_number-based partitioning and delivery callbacks."""

    def __init__(self):
        self.producer = KP(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: str(k).encode('utf-8') if k else None,
            acks='all',                  # Wait for all replicas
            retries=3,                   # Retry on transient failures
            batch_size=16384,            # 16 KB batch size
            linger_ms=100,               # Wait up to 100ms to batch messages
            buffer_memory=33554432,      # 32 MB buffer
            max_in_flight_requests_per_connection=5,
        )
        logger.info(f"Kafka producer initialized ({KAFKA_BOOTSTRAP_SERVERS})")

    def send(self, topic: str, value: dict, key: str = None):
        """
        Send a message to Kafka topic.
        Key is used for partition assignment (e.g., driver_number).
        """
        try:
            future = self.producer.send(
                topic,
                value=value,
                key=key
            )
            # Non-blocking — add callback for logging
            future.add_callback(self._on_success, topic=topic, key=key)
            future.add_errback(self._on_error, topic=topic, key=key)
        except Exception as e:
            logger.error(f"Failed to send message to {topic}: {e}", exc_info=True)

    def send_batch(self, topic: str, messages: list, key_field: str = None):
        """Send a batch of messages to a topic."""
        for msg in messages:
            key = str(msg.get(key_field)) if key_field and key_field in msg else None
            self.send(topic, value=msg, key=key)

    def flush(self):
        """Flush pending messages."""
        self.producer.flush()
        logger.info("Producer flushed all pending messages")

    def close(self):
        """Gracefully close the producer."""
        self.producer.flush()
        self.producer.close()
        logger.info("Producer closed gracefully")

    @staticmethod
    def _on_success(metadata, topic=None, key=None):
        logger.info(
            f"Message delivered: topic={topic}, partition={metadata.partition}, "
            f"offset={metadata.offset}, key={key}"
        )

    @staticmethod
    def _on_error(exception, topic=None, key=None):
        logger.error(f"Message delivery failed: topic={topic}, key={key}, error={exception}")
