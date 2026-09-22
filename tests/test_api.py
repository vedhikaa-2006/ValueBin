import os
import sys
from pathlib import Path

# Add project root directory to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import pytest
from backend.logic import calculate_value_inr
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_read_root():
    """Verify root endpoint responds with status 200."""
    response = client.get("/")
    assert response.status_code == 200


def test_create_event():
    """Verify POST /event accepts weight and returns HTTP 202 Accepted."""
    response = client.post("/event", json={"weight_g": 250.5})
    assert response.status_code == 202
    data = response.json()
    assert "id" in data
    assert data["status"] == "pending"


def test_invalid_event():
    """Verify POST /event rejects invalid (negative/zero) weights."""
    response = client.post("/event", json={"weight_g": -50.0})
    assert response.status_code == 422  # Validation error from Pydantic


def test_get_summary():
    """Verify GET /summary returns required dashboard fields."""
    response = client.get("/summary")
    assert response.status_code == 200
    data = response.json()
    assert "today_weight_kg" in data
    assert "today_value_inr" in data
    assert "score_badge" in data
    assert "weekly_trend" in data


def test_get_events():
    """Verify GET /events returns a list of logged items."""
    response = client.get("/events")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_calculate_value_inr():
    """Verify price calculation logic based on category rates."""
    # 500g of cooked rice at ₹60/kg = ₹30.0
    assert calculate_value_inr(500.0, "cooked rice") == 30.0
    # 1000g of vegetables at ₹40/kg = ₹40.0
    assert calculate_value_inr(1000.0, "vegetables") == 40.0