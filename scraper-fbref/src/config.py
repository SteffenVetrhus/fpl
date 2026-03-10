"""Configuration loaded from environment variables."""

import os


PB_URL = os.getenv("PB_URL", "http://localhost:8090")
PB_USER = os.getenv("PB_USER", "")
PB_PASS = os.getenv("PB_PASS", "")
FPL_API_BASE_URL = os.getenv(
    "FPL_API_BASE_URL", "https://fantasy.premierleague.com/api"
)
