"""Configuration loaded from environment variables."""

import os
import sys


PB_URL = os.getenv("PB_URL", "http://localhost:8090")
PB_USER = os.getenv("PB_USER", "")
PB_PASS = os.getenv("PB_PASS", "")

FPLCORE_BASE_URL = os.getenv(
    "FPLCORE_BASE_URL",
    "https://raw.githubusercontent.com/olbauday/FPL-Core-Insights/main/data/2025-2026",
)


def validate_env() -> None:
    """Validate required environment variables are set. Exit early with a clear message if not."""
    missing = []
    if not PB_USER:
        missing.append("PB_USER")
    if not PB_PASS:
        missing.append("PB_PASS")
    if missing:
        print(
            f"ERROR: Missing required environment variables: {', '.join(missing)}",
            file=sys.stderr,
        )
        sys.exit(1)
