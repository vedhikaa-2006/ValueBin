import datetime
from typing import Any, Dict
from backend.config import (
    BASELINE_G_PER_PERSON_PER_DAY,
    CO2_FACTOR,
    DAILY_BASELINE_G,
    HOUSEHOLD_SIZE,
    RATES_PER_KG,
)
from backend.database import get_db_connection


def calculate_value_inr(weight_g: float, category: str) -> float:
    """FR5 to FR7: Value Calculation = (weight_g / 1000) * RATE_PER_KG."""
    rate = RATES_PER_KG.get(category.lower(), RATES_PER_KG["unknown"])
    return round((weight_g / 1000.0) * rate, 2)


def get_dashboard_summary() -> Dict[str, Any]:
    """FR8 to FR13: Calculates summary metrics, score badge, weekly trends, and suggestions."""
    conn = get_db_connection()
    cursor = conn.cursor()

    today_str = datetime.date.today().isoformat()

    # 1. Today's Totals
    cursor.execute(
        "SELECT SUM(weight_g) as total_weight, SUM(value_inr) as total_value FROM events WHERE DATE(timestamp) = ?",
        (today_str,),
    )
    today_row = cursor.fetchone()
    today_weight_g = today_row["total_weight"] or 0.0
    today_value_inr = round(today_row["total_value"] or 0.0, 2)

    # 2. Daily totals for last 7 days (including zero days)
    daily_trends = []
    current_week_total_g = 0.0
    for i in range(6, -1, -1):
        day_date = datetime.date.today() - datetime.timedelta(days=i)
        day_str = day_date.isoformat()
        cursor.execute(
            "SELECT SUM(weight_g) as daily_weight FROM events WHERE DATE(timestamp) = ?",
            (day_str,),
        )
        w = cursor.fetchone()["daily_weight"] or 0.0
        daily_trends.append({"date": day_str, "weight_g": round(w, 1)})
        current_week_total_g += w

    # 3. Previous 7 days total for Week-over-Week % change
    prev_week_total_g = 0.0
    for i in range(13, 6, -1):
        day_date = datetime.date.today() - datetime.timedelta(days=i)
        day_str = day_date.isoformat()
        cursor.execute(
            "SELECT SUM(weight_g) as daily_weight FROM events WHERE DATE(timestamp) = ?",
            (day_str,),
        )
        prev_week_total_g += cursor.fetchone()["daily_weight"] or 0.0

    if prev_week_total_g > 0:
        wow_change_pct = round(((current_week_total_g - prev_week_total_g) / prev_week_total_g) * 100, 1)
    else:
        wow_change_pct = 0.0

    # 4. Household Reduction Score calculation
    weekly_baseline_g = DAILY_BASELINE_G * 7
    ratio = current_week_total_g / weekly_baseline_g if weekly_baseline_g > 0 else 0

    if ratio <= 0.7:
        score_badge = "Excellent"
    elif ratio <= 1.0:
        score_badge = "Good"
    else:
        score_badge = "Needs Improvement"

    # 5. Waste level percentage & CO2 saved estimation
    waste_level_pct = min(100.0, round((today_weight_g / DAILY_BASELINE_G) * 100, 1))
    co2_kg = round((today_weight_g / 1000.0) * CO2_FACTOR, 2)

    # 6. Find most-wasted category this week
    cursor.execute(
        """
        SELECT category, SUM(weight_g) as cat_weight
        FROM events
        WHERE DATE(timestamp) >= DATE('now', '-7 days') AND category NOT IN ('pending', 'unknown')
        GROUP BY category ORDER BY cat_weight DESC LIMIT 1
    """
    )
    top_cat_row = cursor.fetchone()
    top_category = top_cat_row["category"] if top_cat_row else "general waste"

    # 7. AI Suggestion message based on score & top category
    if score_badge == "Excellent":
        suggestion = f"Outstanding effort! Your household waste is well below average. Keep minimizing {top_category} waste."
    elif score_badge == "Good":
        suggestion = f"Good job maintaining baseline habits! Try buying smaller portions of {top_category} to improve further."
    else:
        suggestion = f"Action needed: High waste detected this week! Focus on meal planning and reducing leftover {top_category}."

    conn.close()

    return {
        "today_weight_kg": round(today_weight_g / 1000.0, 2),
        "today_value_inr": today_value_inr,
        "waste_level_pct": waste_level_pct,
        "co2_kg": co2_kg,
        "score_badge": score_badge,
        "wow_change_pct": wow_change_pct,
        "weekly_trend": daily_trends,
        "top_wasted_category": top_category,
        "ai_suggestion": suggestion,
    }