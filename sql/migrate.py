"""
Migrate schema — apply new tables to existing database.
Run this once to add laps, positions, weather tables.
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def migrate():
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'f1')
    )
    cursor = conn.cursor()

    migrations = [
        # Extend sessions table
        "ALTER TABLE sessions ADD COLUMN session_name VARCHAR(100) AFTER session_type",
        "ALTER TABLE sessions ADD COLUMN year INT AFTER country",
        "ALTER TABLE sessions ADD COLUMN meeting_key INT AFTER year",

        # Laps table
        """CREATE TABLE IF NOT EXISTS laps (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          driver_number INT NOT NULL,
          session_id INT,
          lap_number INT,
          lap_duration FLOAT,
          sector_1 FLOAT, sector_2 FLOAT, sector_3 FLOAT,
          is_personal_best TINYINT(1) DEFAULT 0,
          recorded_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (driver_number) REFERENCES drivers(driver_number) ON DELETE CASCADE,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
          INDEX idx_laps_driver (driver_number),
          INDEX idx_laps_session (session_id),
          UNIQUE KEY uq_lap_driver_session (driver_number, session_id, lap_number)
        )""",

        # Positions table
        """CREATE TABLE IF NOT EXISTS positions (
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
        )""",

        # Weather table
        """CREATE TABLE IF NOT EXISTS weather (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          session_id INT,
          air_temperature FLOAT, track_temperature FLOAT,
          humidity FLOAT, pressure FLOAT,
          rainfall TINYINT(1) DEFAULT 0,
          wind_direction INT, wind_speed FLOAT,
          recorded_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
          INDEX idx_weather_session (session_id)
        )""",

        # Meetings table
        """CREATE TABLE IF NOT EXISTS meetings (
          meeting_key INT PRIMARY KEY,
          meeting_name VARCHAR(255),
          meeting_official_name VARCHAR(255),
          location VARCHAR(255),
          country_name VARCHAR(100),
          circuit_key INT,
          circuit_short_name VARCHAR(100),
          date_start DATE,
          year INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",

        # Locations table
        """CREATE TABLE IF NOT EXISTS locations (
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
        )""",

        # Add new analytics columns

        "ALTER TABLE analytics ADD COLUMN throttle_on_pct FLOAT AFTER avg_rpm",
        "ALTER TABLE analytics ADD COLUMN brake_aggression FLOAT AFTER throttle_on_pct",
    ]

    for sql in migrations:
        try:
            cursor.execute(sql)
            conn.commit()
            print(f"OK: {sql[:60]}...")
        except mysql.connector.errors.ProgrammingError as e:
            if 'Duplicate column' in str(e) or 'already exists' in str(e):
                print(f"SKIP (already exists): {sql[:60]}...")
            else:
                print(f"ERROR: {e}")
        except Exception as e:
            print(f"ERROR: {e}")

    cursor.close()
    conn.close()
    print("\nMigration complete!")

if __name__ == "__main__":
    migrate()
