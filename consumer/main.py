"""
F1 Streaming Consumer — Main Entry Point (v2)
Consumes drivers, telemetry, laps, positions, and weather from Kafka.
"""
import json
import signal
import time
import threading

from kafka import KafkaConsumer

from config import (
    KAFKA_BOOTSTRAP_SERVERS, KAFKA_CONSUMER_GROUP,
    TOPIC_DRIVERS, TOPIC_TELEMETRY, TOPIC_LAPS,
    TOPIC_POSITIONS, TOPIC_WEATHER, TOPIC_MEETINGS, TOPIC_LOCATIONS,
    TOPIC_INTERVALS, TOPIC_PIT_STOPS, TOPIC_RACE_CONTROL,
    TOPIC_STINTS, TOPIC_RADIO, TOPIC_STANDINGS, MAX_RETRIES
)
from logger import get_logger
from handlers import (
    handle_driver_message, handle_telemetry_message,
    handle_lap_message, handle_position_message,
    handle_weather_message, handle_meeting_message,
    handle_location_message,
    handle_interval_message, handle_pit_stop_message,
    handle_race_control_message, handle_stint_message,
    handle_standing_message,
    flush_all_buffers, retrain_predictor
)
from dead_letter import send_to_dlq

logger = get_logger("f1-consumer.main")

running = True


def shutdown_handler(signum, frame):
    global running
    logger.info(f"Received signal {signum}. Shutting down gracefully...")
    running = False


signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)


def periodic_retrain(interval_minutes: int = 30):
    while running:
        time.sleep(interval_minutes * 60)
        if running:
            try:
                retrain_predictor()
            except Exception as e:
                logger.error(f"Error during periodic retrain: {e}")


# Topic → handler mapping
HANDLERS = {
    TOPIC_DRIVERS: handle_driver_message,
    TOPIC_TELEMETRY: handle_telemetry_message,
    TOPIC_LAPS: handle_lap_message,
    TOPIC_POSITIONS: handle_position_message,
    TOPIC_WEATHER: handle_weather_message,
    TOPIC_MEETINGS: handle_meeting_message,
    TOPIC_LOCATIONS: handle_location_message,
    TOPIC_INTERVALS: handle_interval_message,
    TOPIC_PIT_STOPS: handle_pit_stop_message,
    TOPIC_RACE_CONTROL: handle_race_control_message,
    TOPIC_STINTS: handle_stint_message,
    TOPIC_STANDINGS: handle_standing_message,
}


def main():
    all_topics = list(HANDLERS.keys())
    
    logger.info("=" * 60)
    logger.info("F1 Streaming Consumer v2 starting...")
    logger.info(f"Consumer group: {KAFKA_CONSUMER_GROUP}")
    logger.info(f"Topics: {', '.join(all_topics)}")
    logger.info("=" * 60)

    try:
        retrain_predictor()
    except Exception as e:
        logger.warning(f"Initial ML training failed (expected on first run): {e}")

    retrain_thread = threading.Thread(target=periodic_retrain, daemon=True)
    retrain_thread.start()

    consumer = KafkaConsumer(
        *all_topics,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=KAFKA_CONSUMER_GROUP,
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        key_deserializer=lambda x: x.decode('utf-8') if x else None,
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        auto_commit_interval_ms=5000,
        max_poll_records=100,
        session_timeout_ms=30000,
        heartbeat_interval_ms=10000,
    )

    logger.info("Kafka consumer connected. Waiting for messages...")

    try:
        while running:
            records = consumer.poll(timeout_ms=1000)
            for topic_partition, messages in records.items():
                for message in messages:
                    try:
                        topic = message.topic
                        handler = HANDLERS.get(topic)
                        if handler:
                            handler(message.value)
                        else:
                            logger.warning(f"Unknown topic: {topic}")
                    except Exception as e:
                        logger.error(
                            f"Error processing: topic={message.topic}, "
                            f"partition={message.partition}, offset={message.offset}, "
                            f"error={e}", exc_info=True
                        )
                        send_to_dlq(
                            topic=message.topic,
                            message_value=message.value,
                            error_message=str(e),
                            partition=message.partition,
                            offset=message.offset,
                            key=message.key,
                        )
    except Exception as e:
        logger.error(f"Fatal error in consumer: {e}", exc_info=True)
    finally:
        flush_all_buffers()
        consumer.close()
        logger.info("Consumer shutdown complete")


if __name__ == "__main__":
    main()
