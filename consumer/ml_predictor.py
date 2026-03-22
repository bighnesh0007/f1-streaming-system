"""
ML Predictor — Linear Regression model for driver performance prediction.
Trains on historical analytics data and predicts a performance score.
"""
import numpy as np
from logger import get_logger

logger = get_logger("f1-consumer.ml")

# Try to import sklearn — fall back to heuristic if not available
try:
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed. Using heuristic prediction fallback.")


class PerformancePredictor:
    """
    Predicts a driver performance score (0-1) based on analytics features.
    Uses LinearRegression when enough training data is available,
    otherwise falls back to a simple heuristic.
    """

    def __init__(self, min_training_samples: int = 10):
        self.min_training_samples = min_training_samples
        self.model = None
        self.scaler = None
        self.is_trained = False

    def train(self, historical_analytics: list):
        """
        Train the model on historical analytics data.
        
        Each record should have: avg_speed, max_speed, min_speed, 
                                 avg_throttle, avg_rpm, lap_consistency
        """
        if not SKLEARN_AVAILABLE:
            logger.info("sklearn not available, skipping training")
            return

        if len(historical_analytics) < self.min_training_samples:
            logger.info(
                f"Not enough training data ({len(historical_analytics)}/{self.min_training_samples}). "
                f"Will use heuristic prediction."
            )
            return

        try:
            features = []
            targets = []

            for record in historical_analytics:
                row = [
                    record.get('avg_speed', 0) or 0,
                    record.get('max_speed', 0) or 0,
                    record.get('avg_throttle', 0) or 0,
                    record.get('avg_rpm', 0) or 0,
                    record.get('lap_consistency', 0.5) or 0.5,
                ]
                target = record.get('prediction_score')
                if target is not None:
                    features.append(row)
                    targets.append(target)

            if len(features) < self.min_training_samples:
                return

            X = np.array(features)
            y = np.array(targets)

            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)

            self.model = LinearRegression()
            self.model.fit(X_scaled, y)
            self.is_trained = True

            # Log model performance
            score = self.model.score(X_scaled, y)
            logger.info(f"ML model trained on {len(features)} samples, R2 score: {score:.4f}")

        except Exception as e:
            logger.error(f"Error training ML model: {e}", exc_info=True)
            self.is_trained = False

    def predict(self, analytics: dict) -> float:
        """
        Predict a performance score for the given analytics.
        Returns a float between 0.0 and 1.0.
        """
        if self.is_trained and self.model and self.scaler:
            return self._ml_predict(analytics)
        else:
            return self._heuristic_predict(analytics)

    def _ml_predict(self, analytics: dict) -> float:
        """Use trained ML model for prediction."""
        try:
            features = np.array([[
                analytics.get('avg_speed', 0) or 0,
                analytics.get('max_speed', 0) or 0,
                analytics.get('avg_throttle', 0) or 0,
                analytics.get('avg_rpm', 0) or 0,
                analytics.get('lap_consistency', 0.5) or 0.5,
            ]])

            features_scaled = self.scaler.transform(features)
            prediction = float(self.model.predict(features_scaled)[0])
            # Clamp to 0-1 range
            prediction = max(0.0, min(1.0, prediction))

            logger.info(f"ML prediction: {prediction:.4f}")
            return round(prediction, 4)

        except Exception as e:
            logger.error(f"ML prediction failed, falling back to heuristic: {e}")
            return self._heuristic_predict(analytics)

    @staticmethod
    def _heuristic_predict(analytics: dict) -> float:
        """
        Simple heuristic fallback when ML model is not trained.
        Score based on: high speed + high throttle + low consistency variance = better.
        """
        avg_speed = analytics.get('avg_speed') or 0
        max_speed = analytics.get('max_speed') or 0
        avg_throttle = analytics.get('avg_throttle') or 0
        consistency = analytics.get('lap_consistency') or 0.5

        # Normalize each component to ~0-1 range based on F1 typical values
        speed_score = min(avg_speed / 300, 1.0)       # 300 km/h is a solid average
        max_speed_score = min(max_speed / 350, 1.0)    # 350 km/h is near top speed
        throttle_score = min(avg_throttle / 100, 1.0)  # Throttle is 0-100%
        consistency_score = 1.0 - consistency            # Lower variance = better

        # Weighted average
        score = (
            speed_score * 0.3 +
            max_speed_score * 0.2 +
            throttle_score * 0.2 +
            consistency_score * 0.3
        )

        score = max(0.0, min(1.0, score))
        logger.info(f"Heuristic prediction: {score:.4f}")
        return round(score, 4)
