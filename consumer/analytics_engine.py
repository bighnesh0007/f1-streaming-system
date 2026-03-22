"""
Analytics Engine — Computed metrics from real telemetry data (v2).
Now includes throttle_on_pct and brake_aggression.
"""
import numpy as np
from logger import get_logger

logger = get_logger("f1-consumer.analytics")


def compute_analytics(telemetry_records: list) -> dict:
    """
    Compute all analytics from telemetry records.
    Each record: speed, throttle, brake, rpm, gear
    """
    if not telemetry_records:
        return {
            'avg_speed': None, 'max_speed': None, 'min_speed': None,
            'avg_throttle': None, 'avg_rpm': None,
            'throttle_on_pct': None, 'brake_aggression': None,
            'lap_consistency': None,
        }

    speeds = [r.get('speed', 0) for r in telemetry_records if r.get('speed') is not None]
    throttles = [r.get('throttle', 0) for r in telemetry_records if r.get('throttle') is not None]
    rpms = [r.get('rpm', 0) for r in telemetry_records if r.get('rpm') is not None]
    brakes = [r.get('brake', 0) for r in telemetry_records]

    result = {
        'avg_speed': round(float(np.mean(speeds)), 2) if speeds else None,
        'max_speed': round(float(np.max(speeds)), 2) if speeds else None,
        'min_speed': round(float(np.min(speeds)), 2) if speeds else None,
        'avg_throttle': round(float(np.mean(throttles)), 2) if throttles else None,
        'avg_rpm': round(float(np.mean(rpms)), 2) if rpms else None,
        'throttle_on_pct': compute_throttle_on_pct(throttles),
        'brake_aggression': compute_brake_aggression(brakes),
        'lap_consistency': compute_lap_consistency(speeds) if speeds else None,
    }

    return result


def compute_throttle_on_pct(throttles: list) -> float | None:
    """Percentage of time throttle is >90%."""
    if not throttles:
        return None
    high = sum(1 for t in throttles if t and t > 90)
    return round(high / len(throttles) * 100, 2)


def compute_brake_aggression(brakes: list) -> float | None:
    """Frequency of braking events (transitions to brake-on)."""
    if not brakes or len(brakes) < 2:
        return None
    transitions = sum(1 for i in range(1, len(brakes))
                      if brakes[i] and not brakes[i - 1])
    # Normalize per 100 data points
    return round(transitions / len(brakes) * 100, 2)


def compute_lap_consistency(speeds: list) -> float | None:
    """Coefficient of variation of speed, clamped to 0-1."""
    if not speeds or len(speeds) < 2:
        return None
    arr = np.array(speeds, dtype=float)
    mean_speed = np.mean(arr)
    if mean_speed == 0:
        return None
    cv = float(np.std(arr) / mean_speed)
    return round(min(cv, 1.0), 4)
