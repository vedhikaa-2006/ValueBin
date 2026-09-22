import json
import sqlite3
from typing import Any, Dict, List, Optional
from backend.config import DB_FILE


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initializes the database schema if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            weight_g REAL NOT NULL,
            category TEXT DEFAULT 'pending',
            confidence REAL DEFAULT 0.0,
            top3 TEXT DEFAULT '[]',
            value_inr REAL DEFAULT 0.0
        );
    """
    )
    conn.commit()
    conn.close()


def insert_event(weight_g: float) -> int:
    """Inserts a new raw weight event with 'pending' category."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO events (weight_g, category, value_inr) VALUES (?, 'pending', 0.0)",
        (weight_g,),
    )
    conn.commit()
    event_id = cursor.lastrowid
    conn.close()
    return event_id  # type: ignore


def update_event_classification(
    event_id: int, category: str, confidence: float, top3: List[Dict[str, Any]], value_inr: float
) -> None:
    """Updates an event after background image classification."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE events
        SET category = ?, confidence = ?, top3 = ?, value_inr = ?
        WHERE id = ?
    """,
        (category, confidence, json.dumps(top3), value_inr, event_id),
    )
    conn.commit()
    conn.close()


def get_all_events() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]