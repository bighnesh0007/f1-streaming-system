"""
F1 Streaming Producer — Main Entry Point (v2)
==========================================
Fetches drivers, telemetry, laps, positions, and weather from OpenF1 API
and streams to Kafka topics.
"""
import signal
import sys
import time

from config import (
    POLL_INTERVAL_SECONDS, SESSION_KEY, F1_YEAR,
    TOPIC_DRIVERS, TOPIC_TELEMETRY, TOPIC_LAPS,
    TOPIC_POSITIONS, TOPIC_WEATHER, TOPIC_MEETINGS, TOPIC_LOCATIONS,
    TOPIC_INTERVALS, TOPIC_PIT_STOPS, TOPIC_RACE_CONTROL,
    TOPIC_STINTS, TOPIC_RADIO, TOPIC_STANDINGS
)
from logger import get_logger
from api_client import OpenF1Client
from kafka_producer import F1KafkaProducer

logger = get_logger("f1-producer.main")

running = True


def shutdown_handler(signum, frame):
    global running
    logger.info(f"Received signal {signum}. Shutting down gracefully...")
    running = False


signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)


def main():
    logger.info("=" * 60)
    logger.info("F1 Streaming Producer v2 starting...")
    logger.info(f"Session: {SESSION_KEY} | Year: {F1_YEAR}")
    logger.info("=" * 60)

    api_client = OpenF1Client()
    kafka = F1KafkaProducer()

    cycle_count = 0

    try:
        while running:
            # 1. Fetch session info
            session = api_client.fetch_session(session_key=SESSION_KEY)
            session_key = SESSION_KEY
            if session:
                session_key = str(session.get("session_key", SESSION_KEY))
                logger.info(f"Session: {session.get('session_name', 'Unknown')} "
                           f"at {session.get('circuit_short_name', 'Unknown')}")

            # 2. Fetch and publish drivers
            drivers = api_client.fetch_drivers(session_key=session_key)
            if drivers:
                for driver in drivers:
                    driver['_session_key'] = session_key
                    # Attach session metadata
                    if session:
                        driver['_session_name'] = session.get('session_name')
                        driver['_session_type'] = session.get('session_type')
                        driver['_circuit_name'] = session.get('circuit_short_name')
                        driver['_country'] = session.get('country_name')
                        driver['_year'] = session.get('year')
                        driver['_meeting_key'] = session.get('meeting_key')
                    kafka.send(
                        topic=TOPIC_DRIVERS,
                        value=driver,
                        key=str(driver.get('driver_number', ''))
                    )
                logger.info(f"Published {len(drivers)} drivers to {TOPIC_DRIVERS}")
                time.sleep(2)

                # 3. For each driver: telemetry, laps, positions
                for driver in drivers:
                    driver_number = driver.get('driver_number')
                    if not driver_number:
                        continue

                    # Telemetry
                    telemetry = api_client.fetch_telemetry(driver_number, session_key)
                    if telemetry:
                        # If fixed session, send all. If 'latest', send last 50.
                        to_send = telemetry if SESSION_KEY != 'latest' else telemetry[-50:]
                        for record in to_send:
                            record['driver_number'] = driver_number
                            record['_session_key'] = session_key
                            kafka.send(TOPIC_TELEMETRY, record, str(driver_number))
                        logger.info(f"Published {len(to_send)} telemetry for #{driver_number}")

                    # Laps
                    laps = api_client.fetch_laps(driver_number, session_key)
                    if laps:
                        for lap in laps:
                            lap['driver_number'] = driver_number
                            lap['_session_key'] = session_key
                            kafka.send(TOPIC_LAPS, lap, str(driver_number))
                        logger.info(f"Published {len(laps)} laps for #{driver_number}")

                    # Positions
                    positions = api_client.fetch_position(driver_number, session_key)
                    if positions:
                        to_send = positions if SESSION_KEY != 'latest' else positions[-10:]
                        for pos in to_send:
                            pos['driver_number'] = driver_number
                            pos['_session_key'] = session_key
                            kafka.send(TOPIC_POSITIONS, pos, str(driver_number))
                        logger.info(f"Published {len(to_send)} positions for #{driver_number}")

                    # Locations (X, Y, Z)
                    locations = api_client.fetch_location(driver_number, session_key)
                    if locations:
                        to_send = locations if SESSION_KEY != 'latest' else locations[-20:]
                        for loc in to_send:
                            loc['driver_number'] = driver_number
                            loc['_session_key'] = session_key
                            kafka.send(TOPIC_LOCATIONS, loc, str(driver_number))
                        logger.info(f"Published {len(to_send)} locations for #{driver_number}")

                # 4. Weather (session-level, once per cycle)
                weather = api_client.fetch_weather(session_key)
                if weather:
                    latest_weather = weather[-5:]
                    for w in latest_weather:
                        w['_session_key'] = session_key
                        kafka.send(TOPIC_WEATHER, w, session_key)
                    logger.info(f"Published {len(latest_weather)} weather records")

                # 5. New Features: Intervals, Pit Stops, Race Control
                # Intervals (every cycle)
                intervals = api_client.fetch_intervals(session_key)
                if intervals:
                    for interval in intervals[-20:]: # Last 20 for real-time
                        interval['_session_key'] = session_key
                        kafka.send(TOPIC_INTERVALS, interval, str(interval.get('driver_number')))
                    logger.info(f"Published {len(intervals[-20:])} intervals")

                # Pit Stops (every cycle)
                pit_stops = api_client.fetch_pit(session_key)
                if pit_stops:
                    for pit in pit_stops:
                        pit['_session_key'] = session_key
                        kafka.send(TOPIC_PIT_STOPS, pit, str(pit.get('driver_number')))
                    logger.info(f"Published {len(pit_stops)} pit stops")

                # Race Control (every 2 cycles)
                if cycle_count % 2 == 0:
                    rc_messages = api_client.fetch_race_control(session_key)
                    if rc_messages:
                        for msg in rc_messages[-5:]:
                            msg['_session_key'] = session_key
                            kafka.send(TOPIC_RACE_CONTROL, msg, session_key)
                        logger.info(f"Published {len(rc_messages[-5:])} race control messages")
                
                # Stints (every 5 cycles)
                if cycle_count % 5 == 0:
                    stints = api_client.fetch_stints(session_key)
                    if stints:
                        for stint in stints:
                            stint['_session_key'] = session_key
                            kafka.send(TOPIC_STINTS, stint, str(stint.get('driver_number')))
                        logger.info(f"Published {len(stints)} stints")

                # Team Radio (every 5 cycles)
                if cycle_count % 5 == 0:
                    radio = api_client.fetch_team_radio(session_key)
                    if radio:
                        for r in radio[-5:]:
                            r['_session_key'] = session_key
                            kafka.send(TOPIC_RADIO, r, str(r.get('driver_number')))
                        logger.info(f"Published {len(radio[-5:])} radio records")

            else:
                logger.warning("No drivers data received from API")

            # 6. Sync Meetings & Standings (periodic)
            if cycle_count % 10 == 0:
                logger.info(f"Syncing meetings for year={F1_YEAR}...")
                meetings = api_client.fetch_meetings(year=F1_YEAR)
                if meetings:
                    for meeting in meetings:
                        kafka.send(TOPIC_MEETINGS, meeting, str(meeting.get('meeting_key')))
                    logger.info(f"Published {len(meetings)} meetings to {TOPIC_MEETINGS}")
                
                # Standings (every 10 cycles, beta)
                standings = api_client.fetch_championship_standings(year=F1_YEAR)
                kafka.send(TOPIC_STANDINGS, standings, F1_YEAR)
                logger.info(f"Published standings update for {F1_YEAR}")

            # If SESSION_KEY is fixed (not 'latest'), we can finish after one full sync
            if SESSION_KEY != 'latest' and cycle_count > 0:
                logger.info("Fixed session sync complete. Shutting down producer.")
                break

            cycle_count += 1
            kafka.flush()

            logger.info(f"Sleeping {POLL_INTERVAL_SECONDS}s before next poll...")
            time.sleep(POLL_INTERVAL_SECONDS)

    except Exception as e:
        logger.error(f"Fatal error in producer: {e}", exc_info=True)
    finally:
        kafka.close()
        logger.info("Producer shutdown complete")


if __name__ == "__main__":
    main()
