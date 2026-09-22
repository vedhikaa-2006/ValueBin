import os

# Server & Data Settings
DB_FILE = os.getenv("DB_FILE", "waste_data.db")
CAM_URL = os.getenv("CAM_URL", "http://192.168.1.50/capture")  # ESP32-CAM URL
CAM_TIMEOUT_SECONDS = 3.0

# Household Baseline Settings
HOUSEHOLD_SIZE = 4
BASELINE_G_PER_PERSON_PER_DAY = 130  # UNEP reference baseline (~130g/person/day)
DAILY_BASELINE_G = HOUSEHOLD_SIZE * BASELINE_G_PER_PERSON_PER_DAY

# Carbon Footprint Factor (2.5 kg CO2e per kg food waste)
CO2_FACTOR = 2.5

# Reference Price Table (₹ per kg)
RATES_PER_KG = {
    "cooked rice": 60,
    "vegetables": 40,
    "bread": 50,
    "banana peel": 10,
    "fruit waste": 30,
    "unknown": 25,
    "pending": 0,
}