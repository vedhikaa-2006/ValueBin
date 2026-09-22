import sys
from pathlib import Path

# Add root folder to python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import argparse
import datetime
import random
import time
import requests
import argparse
import datetime
import random
import time
import requests

API_URL = "http://127.0.0.1:8000/event"


def populate_fake_history():
    """Generates 7 days of realistic historical events directly in SQLite."""
    from backend.database import get_db_connection, init_db
    from backend.logic import calculate_value_inr

    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    categories = ["cooked rice", "vegetables", "bread", "banana peel", "fruit waste"]

    print("Generating 7 days of backdated fake test events...")
    for i in range(7, 0, -1):
        num_events = random.randint(2, 6)
        day_date = datetime.date.today() - datetime.timedelta(days=i)

        for _ in range(num_events):
            event_time = datetime.datetime.combine(
                day_date,
                datetime.time(
                    hour=random.randint(7, 21),
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59),
                ),
            )
            weight_g = round(random.uniform(30.0, 400.0), 1)
            cat = random.choice(categories)
            val = calculate_value_inr(weight_g, cat)

            cursor.execute(
                """
                INSERT INTO events (timestamp, weight_g, category, confidence, top3, value_inr)
                VALUES (?, ?, ?, ?, '[]', ?)
            """,
                (event_time.strftime("%Y-%m-%d %H:%M:%S"), weight_g, cat, 0.92, val),
            )

    conn.commit()
    conn.close()
    print("Historical data successfully created!")


def run_live_simulation():
    """Posts a new event to the live server every few seconds."""
    print("Starting --live simulator mode. Press Ctrl+C to stop.")
    while True:
        weight = round(random.uniform(40.0, 350.0), 1)
        try:
            res = requests.post(API_URL, json={"weight_g": weight})
            print(f"Posted live event: {weight}g -> Response: {res.json()}")
        except Exception as e:
            print(f"Error connecting to server: {e}")
        time.sleep(5)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Run live event loop")
    args = parser.parse_args()

    if args.live:
        run_live_simulation()
    else:
        populate_fake_history()