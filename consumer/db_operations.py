"""
Database Operations — Batch inserts, upserts, and query helpers (v2).
Now includes laps, positions, weather, and richer analytics queries.
"""
from db import get_connection
from logger import get_logger

logger = get_logger("f1-consumer.db_ops")


# ==========================================
# Teams
# ==========================================
def upsert_team(team_name: str) -> int | None:
    if not team_name:
        return None
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO teams (name) VALUES (%s) ON DUPLICATE KEY UPDATE name=name",
            (team_name,)
        )
        conn.commit()
        cursor.execute("SELECT id FROM teams WHERE name = %s", (team_name,))
        row = cursor.fetchone()
        return row[0] if row else None
    except Exception as e:
        conn.rollback()
        logger.error(f"Error upserting team '{team_name}': {e}")
        return None
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Sessions
# ==========================================
def upsert_session(session_key: int, session_type: str | None = None,
                   session_name: str | None = None,
                   circuit_name: str | None = None, country: str | None = None,
                   year: int | None = None, meeting_key: int | None = None) -> int | None:
    if not session_key:
        return None
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sessions (session_key, session_type, session_name, circuit_name, country, year, meeting_key)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                session_type = COALESCE(VALUES(session_type), session_type),
                session_name = COALESCE(VALUES(session_name), session_name),
                circuit_name = COALESCE(VALUES(circuit_name), circuit_name),
                country = COALESCE(VALUES(country), country),
                year = COALESCE(VALUES(year), year),
                meeting_key = COALESCE(VALUES(meeting_key), meeting_key)
        """, (session_key, session_type, session_name, circuit_name, country, year, meeting_key))
        conn.commit()
        cursor.execute("SELECT id FROM sessions WHERE session_key = %s", (session_key,))
        row = cursor.fetchone()
        return row[0] if row else None
    except Exception as e:
        conn.rollback()
        logger.error(f"Error upserting session {session_key}: {e}")
        return None
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Drivers
# ==========================================
def upsert_driver(driver_number: int, full_name: str, name_acronym: str,
                  team_id: int | None = None, country_code: str | None = None,
                  headshot_url: str | None = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO drivers (driver_number, full_name, name_acronym, team_id, country_code, headshot_url)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                full_name = VALUES(full_name),
                name_acronym = VALUES(name_acronym),
                team_id = COALESCE(VALUES(team_id), team_id),
                country_code = COALESCE(VALUES(country_code), country_code),
                headshot_url = COALESCE(VALUES(headshot_url), headshot_url)
        """, (driver_number, full_name, name_acronym, team_id, country_code, headshot_url))
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error upserting driver #{driver_number}: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def ensure_driver_exists(driver_number: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT IGNORE INTO drivers (driver_number, full_name, name_acronym)
            VALUES (%s, %s, %s)
        """, (driver_number, f"Driver {driver_number}", "TBD"))
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error ensuring driver #{driver_number} exists: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Telemetry
# ==========================================
def batch_insert_telemetry(records: list, driver_number: int, session_id: int = None):
    if not records:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()
        values = []
        for r in records:
            values.append((
                driver_number, session_id,
                r.get('speed'), r.get('throttle'),
                1 if r.get('brake', 0) > 0 else 0,
                r.get('rpm'), r.get('n_gear'), r.get('drs'),
                r.get('date'),
            ))
        cursor.executemany("""
            INSERT INTO telemetry 
                (driver_number, session_id, speed, throttle, brake, rpm, gear, drs, recorded_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, values)
        conn.commit()
        logger.info(f"Batch inserted {len(values)} telemetry for driver #{driver_number}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error batch inserting telemetry for driver #{driver_number}: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Laps
# ==========================================
def batch_insert_laps(records: list, driver_number: int, session_id: int = None):
    if not records:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()
        values = []
        for r in records:
            values.append((
                driver_number, session_id,
                r.get('lap_number'), r.get('lap_duration'),
                r.get('duration_sector_1'), r.get('duration_sector_2'), r.get('duration_sector_3'),
                1 if r.get('is_pit_out_lap') else 0,
                r.get('date_start'),
            ))
        cursor.executemany("""
            INSERT INTO laps 
                (driver_number, session_id, lap_number, lap_duration, sector_1, sector_2, sector_3, is_personal_best, recorded_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                lap_duration = VALUES(lap_duration),
                sector_1 = VALUES(sector_1),
                sector_2 = VALUES(sector_2),
                sector_3 = VALUES(sector_3)
        """, values)
        conn.commit()
        logger.info(f"Batch inserted {len(values)} laps for driver #{driver_number}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error batch inserting laps: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Positions
# ==========================================
def batch_insert_positions(records: list, driver_number: int, session_id: int = None):
    if not records:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()
        values = [(driver_number, session_id, r.get('position'), r.get('date'))
                  for r in records]
        cursor.executemany("""
            INSERT INTO positions (driver_number, session_id, position, recorded_at)
            VALUES (%s, %s, %s, %s)
        """, values)
        conn.commit()
        logger.info(f"Batch inserted {len(values)} positions for driver #{driver_number}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error batch inserting positions: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Locations (X, Y, Z)
# ==========================================
def batch_insert_locations(records: list, driver_number: int, session_id: int = None):
    if not records:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()
        values = [(driver_number, session_id, r.get('date'), r.get('x'), r.get('y'), r.get('z'))
                  for r in records]
        cursor.executemany("""
            INSERT INTO locations (driver_number, session_id, date, x, y, z)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, values)
        conn.commit()
        logger.info(f"Batch inserted {len(values)} locations for driver #{driver_number}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error batch inserting locations: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Weather
# ==========================================
def insert_weather(data: dict, session_id: int = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO weather 
                (session_id, air_temperature, track_temperature, humidity, pressure, 
                 rainfall, wind_direction, wind_speed, recorded_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            session_id,
            data.get('air_temperature'), data.get('track_temperature'),
            data.get('humidity'), data.get('pressure'),
            1 if data.get('rainfall') else 0,
            data.get('wind_direction'), data.get('wind_speed'),
            data.get('date'),
        ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error inserting weather: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Analytics
# ==========================================
def upsert_analytics(driver_number: int, session_id: int = None,
                     avg_speed: float = None, max_speed: float = None,
                     min_speed: float = None, avg_throttle: float = None,
                     avg_rpm: float = None, throttle_on_pct: float = None,
                     brake_aggression: float = None, lap_consistency: float = None,
                     prediction_score: float = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO analytics 
                (driver_number, session_id, avg_speed, max_speed, min_speed,
                 avg_throttle, avg_rpm, throttle_on_pct, brake_aggression,
                 lap_consistency, prediction_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                avg_speed = VALUES(avg_speed),
                max_speed = VALUES(max_speed),
                min_speed = VALUES(min_speed),
                avg_throttle = VALUES(avg_throttle),
                avg_rpm = VALUES(avg_rpm),
                throttle_on_pct = VALUES(throttle_on_pct),
                brake_aggression = VALUES(brake_aggression),
                lap_consistency = VALUES(lap_consistency),
                prediction_score = VALUES(prediction_score)
        """, (driver_number, session_id, avg_speed, max_speed, min_speed,
              avg_throttle, avg_rpm, throttle_on_pct, brake_aggression,
              lap_consistency, prediction_score))
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error upserting analytics for driver #{driver_number}: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Query Helpers
# ==========================================
def fetch_telemetry_for_analytics(driver_number: int, session_id: int = None) -> list:
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT speed, throttle, brake, rpm, gear FROM telemetry WHERE driver_number = %s"
        params = [driver_number]
        if session_id:
            query += " AND session_id = %s"
            params.append(session_id)
        cursor.execute(query, params)
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error fetching telemetry for analytics: {e}")
        return []
    finally:
        cursor.close()
        conn.close()


def fetch_historical_analytics() -> list:
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT avg_speed, max_speed, min_speed, avg_throttle, avg_rpm,
                   throttle_on_pct, brake_aggression, lap_consistency, prediction_score
            FROM analytics
            WHERE prediction_score IS NOT NULL
        """)
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error fetching historical analytics: {e}")
        return []
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Meetings
# ==========================================
def upsert_meeting(meeting_key: int, meeting_name: str, meeting_official_name: str = None,
                   location: str = None, country_name: str = None,
                   circuit_key: int = None, circuit_short_name: str = None,
                   date_start: str = None, year: int = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO meetings 
                (meeting_key, meeting_name, meeting_official_name, location, country_name,
                 circuit_key, circuit_short_name, date_start, year)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                meeting_name = VALUES(meeting_name),
                meeting_official_name = VALUES(meeting_official_name),
                location = VALUES(location),
                country_name = VALUES(country_name),
                circuit_key = VALUES(circuit_key),
                circuit_short_name = VALUES(circuit_short_name),
                date_start = VALUES(date_start),
                year = VALUES(year)
        """, (meeting_key, meeting_name, meeting_official_name, location, country_name,
              circuit_key, circuit_short_name, date_start, year))
        conn.commit()
    except Exception as e:
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error upserting meeting {meeting_key}: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Pit Stops (NEW)
# ==========================================
def batch_insert_pit_stops(records: list, driver_number: int, session_id: int = None):
    if not records:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()
        values = [(driver_number, session_id, r.get('lap_number'), r.get('stop_number'), r.get('duration'), r.get('date'))
                  for r in records]
        cursor.executemany("""
            INSERT INTO pit_stops (driver_number, session_id, lap_number, stop_number, duration, recorded_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, values)
        conn.commit()
        logger.info(f"Batch inserted {len(values)} pit stops for driver #{driver_number}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error batch inserting pit stops: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Intervals (NEW)
# ==========================================
def batch_insert_intervals(records: list, driver_number: int, session_id: int = None):
    if not records:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()
        values = [(driver_number, session_id, r.get('gap_to_leader'), r.get('interval_to_ahead'), r.get('date'))
                  for r in records]
        cursor.executemany("""
            INSERT INTO intervals (driver_number, session_id, gap_to_leader, interval_to_ahead, recorded_at)
            VALUES (%s, %s, %s, %s, %s)
        """, values)
        conn.commit()
        logger.info(f"Batch inserted {len(values)} intervals for driver #{driver_number}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error batch inserting intervals: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Race Control (NEW)
# ==========================================
def insert_race_control(data: dict, session_id: int = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO race_control (session_id, message, category, flag, recorded_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (session_id, data.get('message'), data.get('category'), data.get('flag'), data.get('date')))
        conn.commit()
        logger.info(f"Race control message inserted for session {session_id}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error inserting race control message: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Stints (NEW)
# ==========================================
def batch_insert_stints(records: list, driver_number: int, session_id: int = None):
    if not records:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()
        values = [(driver_number, session_id, r.get('stint_number'), r.get('compound'), r.get('lap_start'), r.get('lap_end'))
                  for r in records]
        cursor.executemany("""
            INSERT INTO stints (driver_number, session_id, stint_number, compound, lap_start, lap_end)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, values)
        conn.commit()
        logger.info(f"Batch inserted {len(values)} stints for driver #{driver_number}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error batch inserting stints: {e}")
    finally:
        cursor.close()
        conn.close()


# ==========================================
# Standings (NEW)
# ==========================================
def upsert_standing(entity_type: str, entity_id: int, points: float, position: int, year: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO standings (entity_type, entity_id, points, position, year)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                points = VALUES(points),
                position = VALUES(position)
        """, (entity_type, entity_id, points, position, year))
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error upserting standing: {e}")
    finally:
        cursor.close()
        conn.close()
