import requests
import json
import time
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

URL = "https://api.openf1.org/v1/drivers?session_key=latest"

while True:
    try:
        response = requests.get(URL)

        if response.status_code != 200:
            print("❌ API Error:", response.text)
            continue

        data = response.json()

        if isinstance(data, dict) and "detail" in data:
            print("❌ API limit hit")
            continue

        producer.send("f1-telemetry", data)

        print("✅ Sent data to Kafka")

        time.sleep(3)

    except Exception as e:
        print("❌ Error:", e)