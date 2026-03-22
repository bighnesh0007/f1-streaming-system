-- F1 Streaming System — Normalized Schema (v2)
-- ==========================================

CREATE DATABASE IF NOT EXISTS f1;
USE f1;

-- ==========================================
-- Teams (normalized from drivers.team_name)
-- ==========================================
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team_name (name)
);

-- ==========================================
-- Sessions (race/qualifying/practice)
-- ==========================================
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_key INT NOT NULL UNIQUE,
  session_type VARCHAR(50),
  session_name VARCHAR(100),
  circuit_name VARCHAR(100),
  country VARCHAR(100),
  year INT,
  meeting_key INT,
  started_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_key (session_key),
  INDEX idx_session_year (year)
);

-- ==========================================
-- Drivers (FK → teams)
-- ==========================================
CREATE TABLE IF NOT EXISTS drivers (
  driver_number INT PRIMARY KEY,
  full_name VARCHAR(100),
  name_acronym VARCHAR(10),
  team_id INT,
  country_code VARCHAR(10),
  headshot_url VARCHAR(500),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_driver_acronym (name_acronym)
);

-- ==========================================
-- Raw Telemetry Data (FK → drivers, sessions)
-- ==========================================
CREATE TABLE IF NOT EXISTS telemetry (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_number INT NOT NULL,
  session_id INT,
  speed FLOAT,
  throttle FLOAT,
  brake TINYINT(1),
  rpm INT,
  gear INT,
  drs TINYINT(1),
  recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_telemetry_driver (driver_number),
  INDEX idx_telemetry_session (session_id),
  INDEX idx_telemetry_recorded (recorded_at)
);

-- ==========================================
-- Lap Timing Data (FK → drivers, sessions)
-- ==========================================
CREATE TABLE IF NOT EXISTS laps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_number INT NOT NULL,
  session_id INT,
  lap_number INT,
  lap_duration FLOAT,
  sector_1 FLOAT,
  sector_2 FLOAT,
  sector_3 FLOAT,
  is_personal_best TINYINT(1) DEFAULT 0,
  recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_laps_driver (driver_number),
  INDEX idx_laps_session (session_id),
  UNIQUE KEY uq_lap_driver_session (driver_number, session_id, lap_number)
);

-- ==========================================
-- Driver Positions (FK → drivers, sessions)
-- ==========================================
CREATE TABLE IF NOT EXISTS positions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_number INT NOT NULL,
  session_id INT,
  position INT,
  recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_positions_driver (driver_number),
  INDEX idx_positions_session (session_id)
);

-- ==========================================
-- Track Coordinates (FK → drivers, sessions)
-- ==========================================
CREATE TABLE IF NOT EXISTS locations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_number INT NOT NULL,
  session_id INT,
  date DATETIME,
  x INT,
  y INT,
  z INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_locations_driver (driver_number),
  INDEX idx_locations_session (session_id),
  INDEX idx_locations_date (date)
);

-- ==========================================
-- Weather Snapshots (FK → sessions)
-- ==========================================
CREATE TABLE IF NOT EXISTS weather (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  air_temperature FLOAT,
  track_temperature FLOAT,
  humidity FLOAT,
  pressure FLOAT,
  rainfall TINYINT(1) DEFAULT 0,
  wind_direction INT,
  wind_speed FLOAT,
  recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_weather_session (session_id)
);

-- ==========================================
-- Computed Analytics (unique per driver+session)
-- ==========================================
CREATE TABLE IF NOT EXISTS analytics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_number INT NOT NULL,
  session_id INT,
  avg_speed FLOAT,
  max_speed FLOAT,
  min_speed FLOAT,
  avg_throttle FLOAT,
  avg_rpm FLOAT,
  throttle_on_pct FLOAT,
  brake_aggression FLOAT,
  lap_consistency FLOAT,
  prediction_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  UNIQUE KEY uq_analytics_driver_session (driver_number, session_id),
  INDEX idx_analytics_driver (driver_number),
  INDEX idx_analytics_session (session_id)
);

-- ==========================================
-- Dead-Letter Queue (failed Kafka messages)
-- ==========================================
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  topic VARCHAR(100) NOT NULL,
  partition_num INT,
  offset_num BIGINT,
  message_key VARCHAR(255),
  message_value JSON,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  status ENUM('pending', 'retried', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dlq_status (status)
);

-- ==========================================
-- Meetings (Season Schedule)
-- ==========================================
CREATE TABLE IF NOT EXISTS meetings (
  meeting_key INT PRIMARY KEY,
  meeting_name VARCHAR(255),
  meeting_official_name VARCHAR(255),
  location VARCHAR(255),
  country_name VARCHAR(100),
  circuit_key INT,
  circuit_short_name VARCHAR(100),
  date_start DATETIME,
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Pit Stops (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS pit_stops (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_number INT NOT NULL,
  session_id INT,
  lap_number INT,
  stop_number INT,
  duration FLOAT,
  recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_pit_driver (driver_number),
  INDEX idx_pit_session (session_id)
);

-- ==========================================
-- Intervals / Gaps (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS intervals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_number INT NOT NULL,
  session_id INT,
  gap_to_leader FLOAT,
  interval_to_ahead FLOAT,
  recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_intervals_driver (driver_number),
  INDEX idx_intervals_session (session_id)
);

-- ==========================================
-- Race Control Messages (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS race_control (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  message TEXT,
  category VARCHAR(50),
  flag VARCHAR(20),
  recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_rc_session (session_id)
);

-- ==========================================
-- Stints (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS stints (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_number INT NOT NULL,
  session_id INT,
  stint_number INT,
  compound VARCHAR(20),
  lap_start INT,
  lap_end INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_stints_driver (driver_number),
  INDEX idx_stints_session (session_id)
);

-- ==========================================
-- Standings (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS standings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('driver', 'team'),
  entity_id INT, -- driver_number or team_id
  points FLOAT,
  position INT,
  year INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_standings (entity_type, entity_id, year),
  INDEX idx_standings_year (year)
);
