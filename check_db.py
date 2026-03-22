import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def check():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '3306')),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'f1')
        )
        cursor = conn.cursor()
        
        print(f"Connected to database: {os.getenv('DB_NAME', 'f1')}")
        
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"Tables found: {[t[0] for t in tables]}")
        
        for (table_name,) in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f" - {table_name}: {count} rows")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
