"""Configuration loaded from environment variables."""

import os


PB_URL = os.getenv("PB_URL", "http://localhost:8090")
PB_USER = os.getenv("PB_USER", "")
PB_PASS = os.getenv("PB_PASS", "")

FPLCORE_BASE_URL = os.getenv(
    "FPLCORE_BASE_URL",
    "https://raw.githubusercontent.com/olbauday/FPL-Core-Insights/main/data/2025-2026",
)
