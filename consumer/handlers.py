"""
Message Handlers — Route and process messages from Kafka topics (v2).
Now handles laps, positions, and weather in addition to drivers + telemetry.
"""
from db_operations import (
    upsert_team, upsert_session, upsert_driver, ensure_driver_exists,
    batch_insert_telemetry, batch_insert_laps, batch_insert_positions,
    batch_insert_locations, insert_weather, upsert_analytics, upsert_meeting,
    fetch_telemetry_for_analytics, fetch_historical_analytics,
    batch_insert_pit_stops, batch_insert_intervals, insert_race_control,
    batch_insert_stints, upsert_standing
)
from analytics_engine import compute_analytics
from ml_predictor import PerformancePredictor
from logger import get_logger

logger = get_logger("f1-consumer.handlers")

predictor = PerformancePredictor(min_training_samples=10)

# Buffers for batching
_telemetry_buffer = {}
_laps_buffer = {}
TELEMETRY_BATCH_THRESHOLD = 50
LAPS_BATCH_THRESHOLD = 5
INTERVALS_BATCH_THRESHOLD = 10
STINTS_BATCH_THRESHOLD = 5

_intervals_buffer = {}
_stints_buffer = {}


# ==========================================
# Driver Handler
# ==========================================
def handle_driver_message(data: dict):
    driver_number = data.get('driver_number')
    if not driver_number:
        logger.warning(f"Driver message missing driver_number: {data}")
        return

    team_name = data.get('team_name')
    team_id = upsert_team(team_name) if team_name else None

    session_key = data.get('_session_key')
    if session_key and session_key != 'latest':
        upsert_session(
            int(session_key),
            session_type=data.get('_session_type'),
            session_name=data.get('_session_name'),
            circuit_name=data.get('_circuit_name'),
            country=data.get('_country'),
            year=int(data['_year']) if data.get('_year') else None,
            meeting_key=int(data['_meeting_key']) if data.get('_meeting_key') else None,
        )

    upsert_driver(
        driver_number=driver_number,
        full_name=data.get('full_name'),
        name_acronym=data.get('name_acronym'),
        team_id=team_id,
        country_code=data.get('country_code'),
        headshot_url=data.get('headshot_url'),
    )
    logger.info(f"Processed driver #{driver_number}: {data.get('full_name')}")


# ==========================================
# Telemetry Handler
# ==========================================
def handle_telemetry_message(data: dict):
    driver_number = data.get('driver_number')
    if not driver_number:
        return
    if driver_number not in _telemetry_buffer:
        _telemetry_buffer[driver_number] = []
    _telemetry_buffer[driver_number].append(data)
    if len(_telemetry_buffer[driver_number]) >= TELEMETRY_BATCH_THRESHOLD:
        flush_telemetry_buffer(driver_number, data.get('_session_key'))


def flush_telemetry_buffer(driver_number: int, session_key=None):
    if driver_number not in _telemetry_buffer:
        return
    records = _telemetry_buffer.pop(driver_number, [])
    if not records:
        return

    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))

    ensure_driver_exists(driver_number)
    batch_insert_telemetry(records, driver_number, session_id)

    # Compute analytics
    all_telemetry = fetch_telemetry_for_analytics(driver_number, session_id)
    analytics = compute_analytics(all_telemetry)
    prediction = predictor.predict(analytics)

    upsert_analytics(
        driver_number=driver_number,
        session_id=session_id,
        avg_speed=analytics['avg_speed'],
        max_speed=analytics['max_speed'],
        min_speed=analytics['min_speed'],
        avg_throttle=analytics['avg_throttle'],
        avg_rpm=analytics['avg_rpm'],
        throttle_on_pct=analytics['throttle_on_pct'],
        brake_aggression=analytics['brake_aggression'],
        lap_consistency=analytics['lap_consistency'],
        prediction_score=prediction,
    )
    logger.info(f"Analytics updated for driver #{driver_number}")


# ==========================================
# Laps Handler
# ==========================================
def handle_lap_message(data: dict):
    driver_number = data.get('driver_number')
    if not driver_number:
        return
    if driver_number not in _laps_buffer:
        _laps_buffer[driver_number] = []
    _laps_buffer[driver_number].append(data)
    if len(_laps_buffer[driver_number]) >= LAPS_BATCH_THRESHOLD:
        flush_laps_buffer(driver_number, data.get('_session_key'))


def flush_laps_buffer(driver_number: int, session_key=None):
    if driver_number not in _laps_buffer:
        return
    records = _laps_buffer.pop(driver_number, [])
    if not records:
        return
    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))
    ensure_driver_exists(driver_number)
    batch_insert_laps(records, driver_number, session_id)
    logger.info(f"Laps flushed for driver #{driver_number}: {len(records)} records")


# ==========================================
# Position Handler
# ==========================================
def handle_position_message(data: dict):
    driver_number = data.get('driver_number')
    if not driver_number:
        return
    session_key = data.get('_session_key')
    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))
    ensure_driver_exists(driver_number)
    batch_insert_positions([data], driver_number, session_id)


# ==========================================
# Location Handler (X, Y, Z)
# ==========================================
def handle_location_message(data: dict):
    driver_number = data.get('driver_number')
    if not driver_number:
        return
    session_key = data.get('_session_key')
    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))
    ensure_driver_exists(driver_number)
    batch_insert_locations([data], driver_number, session_id)


# ==========================================
# Weather Handler
# ==========================================
def handle_weather_message(data: dict):
    session_key = data.get('_session_key')
    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))
    insert_weather(data, session_id)
    logger.info(f"Weather data recorded: {data.get('air_temperature')}°C air")


# ==========================================
# Meeting Handler
# ==========================================
def handle_meeting_message(data: dict):
    upsert_meeting(
        meeting_key=int(data['meeting_key']),
        meeting_name=data.get('meeting_name'),
        meeting_official_name=data.get('meeting_official_name'),
        location=data.get('location'),
        country_name=data.get('country_name'),
        circuit_key=data.get('circuit_key'),
        circuit_short_name=data.get('circuit_short_name'),
        date_start=data.get('date_start'),
        year=data.get('year')
    )
    logger.info(f"Meeting record updated: {data.get('meeting_name')}")


# ==========================================
# Interval Handler (NEW)
# ==========================================
def handle_interval_message(data: dict):
    driver_number = data.get('driver_number')
    if not driver_number:
        return
    if driver_number not in _intervals_buffer:
        _intervals_buffer[driver_number] = []
    _intervals_buffer[driver_number].append(data)
    if len(_intervals_buffer[driver_number]) >= INTERVALS_BATCH_THRESHOLD:
        flush_intervals_buffer(driver_number, data.get('_session_key'))


def flush_intervals_buffer(driver_number: int, session_key=None):
    if driver_number not in _intervals_buffer:
        return
    records = _intervals_buffer.pop(driver_number, [])
    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))
    batch_insert_intervals(records, driver_number, session_id)


# ==========================================
# Pit Stop Handler (NEW)
# ==========================================
def handle_pit_stop_message(data: dict):
    driver_number = data.get('driver_number')
    if not driver_number:
        return
    session_key = data.get('_session_key')
    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))
    batch_insert_pit_stops([data], driver_number, session_id)


# ==========================================
# Race Control Handler (NEW)
# ==========================================
def handle_race_control_message(data: dict):
    session_key = data.get('_session_key')
    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))
    insert_race_control(data, session_id)


# ==========================================
# Stint Handler (NEW)
# ==========================================
def handle_stint_message(data: dict):
    driver_number = data.get('driver_number')
    if not driver_number:
        return
    if driver_number not in _stints_buffer:
        _stints_buffer[driver_number] = []
    _stints_buffer[driver_number].append(data)
    if len(_stints_buffer[driver_number]) >= STINTS_BATCH_THRESHOLD:
        flush_stints_buffer(driver_number, data.get('_session_key'))


def flush_stints_buffer(driver_number: int, session_key=None):
    if driver_number not in _stints_buffer:
        return
    records = _stints_buffer.pop(driver_number, [])
    session_id = None
    if session_key and session_key != 'latest':
        session_id = upsert_session(int(session_key))
    batch_insert_stints(records, driver_number, session_id)


# ==========================================
# Standings Handler (NEW)
# ==========================================
def handle_standing_message(data: dict):
    year = data.get('_year', 2024)
    # Handle drivers
    for d in data.get('drivers', []):
        upsert_standing('driver', d.get('driver_number'), d.get('points'), d.get('position'), year)
    # Handle teams
    for t in data.get('teams', []):
        upsert_standing('team', t.get('team_id'), t.get('points'), t.get('position'), year)


# ==========================================
# Utilities
# ==========================================
def flush_all_buffers():
    for driver_number in list(_telemetry_buffer.keys()):
        flush_telemetry_buffer(driver_number)
    for driver_number in list(_laps_buffer.keys()):
        flush_laps_buffer(driver_number)
    for driver_number in list(_intervals_buffer.keys()):
        flush_intervals_buffer(driver_number)
    for driver_number in list(_stints_buffer.keys()):
        flush_stints_buffer(driver_number)
    logger.info("All buffers flushed")


def retrain_predictor():
    historical = fetch_historical_analytics()
    if historical:
        predictor.train(historical)
        logger.info(f"ML predictor retrained with {len(historical)} records")
