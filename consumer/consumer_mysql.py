from kafka import KafkaConsumer
import json
from db import get_connection
from analytics import generate_analytics

conn = get_connection()
cursor = conn.cursor()

consumer = KafkaConsumer(
    'f1-telemetry',
    bootstrap_servers='localhost:9092',
    value_deserializer=lambda x: json.loads(x.decode('utf-8')),
    auto_offset_reset='latest'
)

print("🚀 Consumer started...")

for message in consumer:
    data = message.value

    for driver in data:
        driver_number = driver.get("driver_number")
        full_name = driver.get("full_name")
        acronym = driver.get("name_acronym")
        team = driver.get("team_name")

        # Insert driver
        cursor.execute("""
            INSERT INTO drivers (driver_number, full_name, name_acronym, team_name)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)
        """, (driver_number, full_name, acronym, team))

        # Generate analytics
        avg_speed, max_speed, prediction_score = generate_analytics(driver_number)

        cursor.execute("""
            INSERT INTO analytics (driver_number, avg_speed, max_speed, prediction_score)
            VALUES (%s, %s, %s, %s)
        """, (driver_number, avg_speed, max_speed, prediction_score))

    conn.commit()
    print("✅ Data stored in MySQL")