import random
from typing import Any, Dict, Tuple
import requests
from backend.config import CAM_TIMEOUT_SECONDS, CAM_URL
from backend.logic import calculate_value_inr


def predict_stub() -> Tuple[str, float, list]:
    """Fallback stub predictor returning random classification until ML model is connected."""
    categories = ["cooked rice", "vegetables", "bread", "banana peel", "fruit waste"]
    chosen = random.choice(categories)
    confidence = round(random.uniform(0.80, 0.98), 2)
    top3 = [
        {"category": chosen, "confidence": confidence},
        {"category": "vegetables", "confidence": round((1 - confidence) * 0.6, 2)},
        {"category": "unknown", "confidence": round((1 - confidence) * 0.4, 2)},
    ]
    return chosen, confidence, top3


def classify_event_background(event_id: int, weight_g: float) -> None:
    """Attempts to pull image from camera, runs inference, and updates event record."""
    from backend.database import update_event_classification

    category, confidence, top3 = "unknown", 0.0, []

    try:
        # Fetch JPEG image from ESP32-CAM with a strict timeout
        response = requests.get(CAM_URL, timeout=CAM_TIMEOUT_SECONDS)
        if response.status_code == 200:
            category, confidence, top3 = predict_stub()
        else:
            category, confidence, top3 = "unknown", 0.0, []
    except Exception:
        # Camera unreachable or timeout - gracefully degrade and keep core weight event
        category, confidence, top3 = "unknown", 0.0, []

    # Calculate monetary value based on classified category
    value_inr = calculate_value_inr(weight_g, category)

    # Persist updated event to SQLite
    update_event_classification(event_id, category, confidence, top3, value_inr)