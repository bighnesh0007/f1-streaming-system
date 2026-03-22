"""
OpenF1 API Client — wraps the OpenF1 REST API with retry logic.
Supports drivers, telemetry, laps, positions, weather, and meetings.
"""
import time
import requests
from logger import get_logger
from config import OPENF1_BASE_URL

logger = get_logger("f1-producer.api")


class OpenF1Client:
    """Client for the OpenF1 API with built-in retry and error handling."""

    def __init__(self, base_url: str = OPENF1_BASE_URL, max_retries: int = 3):
        self.base_url = base_url.rstrip('/')
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'F1-Streaming-System/2.0'
        })
        # Idempotency: track seen telemetry keys to dedupe
        self._seen_telemetry = set()
        self._max_seen = 50000  # cap memory

    def _request(self, endpoint: str, params: dict = None) -> list | dict | None:
        """Make a GET request with exponential backoff retry."""
        url = f"{self.base_url}/{endpoint}"

        for attempt in range(1, self.max_retries + 1):
            try:
                response = self.session.get(url, params=params, timeout=15)

                if response.status_code == 429:
                    wait = 2 ** attempt
                    logger.warning(f"Rate limited (429). Retrying in {wait}s... (attempt {attempt}/{self.max_retries})")
                    time.sleep(wait)
                    continue

                if response.status_code >= 500:
                    wait = 2 ** attempt
                    logger.warning(f"Server error {response.status_code}. Retrying in {wait}s...")
                    time.sleep(wait)
                    continue

                if response.status_code != 200:
                    logger.error(f"API error {response.status_code}: {response.text[:200]}")
                    return None

                data = response.json()

                if isinstance(data, dict) and "detail" in data:
                    logger.warning(f"API returned error detail: {data['detail']}")
                    return None

                return data

            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout for {url} (attempt {attempt}/{self.max_retries})")
                time.sleep(2 ** attempt)
            except requests.exceptions.ConnectionError:
                logger.error(f"Connection error for {url} (attempt {attempt}/{self.max_retries})")
                time.sleep(2 ** attempt)
            except Exception as e:
                logger.error(f"Unexpected error: {e}", exc_info=True)
                return None

        logger.error(f"All {self.max_retries} retries exhausted for {url}")
        return None

    def _dedupe_key(self, record: dict, driver_number: int) -> str:
        """Generate a dedup key for telemetry records."""
        return f"{driver_number}:{record.get('date', '')}:{record.get('speed', '')}"

    def fetch_drivers(self, session_key: str = "latest") -> list:
        """Fetch the driver list for a session."""
        data = self._request("drivers", params={"session_key": session_key})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} drivers for session={session_key}")
            return data
        return []

    def fetch_session(self, session_key: str = "latest") -> dict | None:
        """Fetch session metadata."""
        data = self._request("sessions", params={"session_key": session_key})
        if data and isinstance(data, list) and len(data) > 0:
            return data[0]
        return None

    def fetch_sessions_list(self, year: str = "2024") -> list:
        """Fetch all sessions for a given year (for session picker)."""
        data = self._request("sessions", params={"year": year})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} sessions for year={year}")
            return data
        return []

    def fetch_telemetry(self, driver_number: int, session_key: str = "latest") -> list:
        """Fetch car telemetry data with deduplication."""
        data = self._request("car_data", params={
            "driver_number": driver_number,
            "session_key": session_key
        })
        if data and isinstance(data, list):
            # Deduplicate
            new_records = []
            for record in data:
                key = self._dedupe_key(record, driver_number)
                if key not in self._seen_telemetry:
                    self._seen_telemetry.add(key)
                    new_records.append(record)

            # Cap memory
            if len(self._seen_telemetry) > self._max_seen:
                self._seen_telemetry = set(list(self._seen_telemetry)[-10000:])

            if new_records:
                logger.info(f"Fetched {len(new_records)} new telemetry records for driver #{driver_number} (deduped from {len(data)})")
            return new_records
        return []

    def fetch_laps(self, driver_number: int, session_key: str = "latest") -> list:
        """Fetch lap timing data for a driver."""
        data = self._request("laps", params={
            "driver_number": driver_number,
            "session_key": session_key
        })
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} laps for driver #{driver_number}")
            return data
        return []

    def fetch_position(self, driver_number: int, session_key: str = "latest") -> list:
        """Fetch position data for a driver."""
        data = self._request("position", params={
            "driver_number": driver_number,
            "session_key": session_key
        })
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} position records for driver #{driver_number}")
            return data
        return []

    def fetch_weather(self, session_key: str = "latest") -> list:
        """Fetch weather data for a session."""
        data = self._request("weather", params={"session_key": session_key})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} weather records")
            return data
        return []

    def fetch_location(self, driver_number: int, session_key: str = "latest") -> list:
        """Fetch car location (X, Y, Z) data for a driver."""
        data = self._request("location", params={
            "driver_number": driver_number,
            "session_key": session_key
        })
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} location records for driver #{driver_number}")
            return data
        return []

    def fetch_meetings(self, year: str = "2024") -> list:
        """Fetch the full season schedule (meetings)."""
        data = self._request("meetings", params={"year": year})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} meetings for year={year}")
            return data
        return []

    def fetch_intervals(self, session_key: str = "latest") -> list:
        """Fetch the gaps between drivers."""
        data = self._request("intervals", params={"session_key": session_key})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} intervals for session={session_key}")
            return data
        return []

    def fetch_pit(self, session_key: str = "latest") -> list:
        """Fetch pit stop data."""
        data = self._request("pit", params={"session_key": session_key})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} pit stops for session={session_key}")
            return data
        return []

    def fetch_race_control(self, session_key: str = "latest") -> list:
        """Fetch race control messages."""
        data = self._request("race_control", params={"session_key": session_key})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} race control messages for session={session_key}")
            return data
        return []

    def fetch_stints(self, session_key: str = "latest") -> list:
        """Fetch tire stint data."""
        data = self._request("stints", params={"session_key": session_key})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} stints for session={session_key}")
            return data
        return []

    def fetch_team_radio(self, session_key: str = "latest") -> list:
        """Fetch team radio metadata."""
        data = self._request("team_radio", params={"session_key": session_key})
        if data and isinstance(data, list):
            logger.info(f"Fetched {len(data)} team radio records for session={session_key}")
            return data
        return []

    def fetch_championship_standings(self, year: str = "2024") -> dict:
        """Fetch drivers & teams standings (beta)."""
        # Note: This might be a different endpoint or format in beta
        drivers_standings = self._request("drivers_championship", params={"year": year})
        teams_standings = self._request("teams_championship", params={"year": year})
        return {
            "drivers": drivers_standings if isinstance(drivers_standings, list) else [],
            "teams": teams_standings if isinstance(teams_standings, list) else []
        }
