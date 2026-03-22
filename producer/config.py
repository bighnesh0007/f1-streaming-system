"""
Producer Configuration — environment-based settings.
"""
import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Kafka
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')

# Topics
TOPIC_DRIVERS = os.getenv('TOPIC_DRIVERS', 'f1-drivers')
TOPIC_TELEMETRY = os.getenv('TOPIC_TELEMETRY', 'f1-telemetry')
TOPIC_LAPS = os.getenv('TOPIC_LAPS', 'f1-laps')
TOPIC_POSITIONS = os.getenv('TOPIC_POSITIONS', 'f1-positions')
TOPIC_WEATHER = os.getenv('TOPIC_WEATHER', 'f1-weather')
TOPIC_MEETINGS = os.getenv('TOPIC_MEETINGS', 'f1-meetings')
TOPIC_LOCATIONS = os.getenv('TOPIC_LOCATIONS', 'f1-locations')
TOPIC_INTERVALS = os.getenv('TOPIC_INTERVALS', 'f1-intervals')
TOPIC_PIT_STOPS = os.getenv('TOPIC_PIT_STOPS', 'f1-pit-stops')
TOPIC_RACE_CONTROL = os.getenv('TOPIC_RACE_CONTROL', 'f1-race-control')
TOPIC_STINTS = os.getenv('TOPIC_STINTS', 'f1-stints')
TOPIC_RADIO = os.getenv('TOPIC_RADIO', 'f1-radio-feed')
TOPIC_STANDINGS = os.getenv('TOPIC_STANDINGS', 'f1-standings')

# OpenF1 API
OPENF1_BASE_URL = os.getenv('OPENF1_BASE_URL', 'https://api.openf1.org/v1')

# Producer settings
POLL_INTERVAL_SECONDS = int(os.getenv('POLL_INTERVAL_SECONDS', '10'))

# Session configuration — use 'latest' or a specific session_key
SESSION_KEY = os.getenv('SESSION_KEY', 'latest')
F1_YEAR = os.getenv('F1_YEAR', '2024')

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

