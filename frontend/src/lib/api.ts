/**
 * API Client — expanded with all new endpoints and WebSocket/SSE helpers.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/telemetry';
const SSE_URL = process.env.NEXT_PUBLIC_SSE_URL || 'http://localhost:3001/api/stream/telemetry';

export const fetcher = async (url: string) => {
  const res = await fetch(`${API_BASE_URL}${url}`);
  if (!res.ok) throw new Error('Fetch error');
  const json = await res.json();
  return json.data;
};

// URL Builders
export const API_DRIVERS = '/drivers';
export const API_ANALYTICS = '/analytics';
export const API_HEALTH = '/health';
export const API_SESSIONS = '/sessions';
export const API_POSITIONS_LATEST = '/positions/latest';
export const API_WEATHER_LATEST = '/weather/latest';

export const getDriverUrl = (id: string | number) => `/drivers/${id}`;
export const getAnalyticsUrl = (driverNumber?: number) => driverNumber ? `/analytics/${driverNumber}` : `/analytics`;
export const getTelemetryUrl = (driverNumber: number, limit: number = 50) => `/telemetry/${driverNumber}?limit=${limit}`;
export const getLapsUrl = (driverNumber: number) => `/laps/${driverNumber}`;
export const getBestLapUrl = (driverNumber: number) => `/laps/${driverNumber}/best`;
export const getWeatherUrl = (sessionId: number) => `/weather/${sessionId}`;
export const getCompareUrl = (drivers: number[], limit: number = 50) => `/telemetry/compare?drivers=${drivers.join(',')}&limit=${limit}`;
export const getPitStopsUrl = (driverNumber: number) => `/pitstops/${driverNumber}`;
export const getIntervalsUrl = (sessionId?: number) => sessionId ? `/intervals?session_id=${sessionId}` : '/intervals';
export const getRaceControlUrl = (sessionId?: number) => sessionId ? `/racecontrol?session_id=${sessionId}` : '/racecontrol';
export const getStandingsUrl = (year: number = 2024) => `/standings?year=${year}`;

export { WS_URL, SSE_URL };
