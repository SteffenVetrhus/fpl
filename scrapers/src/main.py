"""Main orchestrator for the Stat Corner scraping pipeline.

Runs all three services sequentially:
1. FPL Sync (establishes player records + prices)
2. Understat (xG, npxG, xA per match)
3. FBRef (progressive carries, SCA, CBIT, ball recoveries)

Each service logs its outcome to the ``sync_log`` PocketBase collection.
"""

from __future__ import annotations

import logging
import sys
import time

from src.delay import human_delay_range
from src.pb_client import log_sync

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("stat-corner")


def run_service(name: str, run_fn: callable) -> None:
    """Run a single scraping service with timing and error handling."""
    logger.info("=" * 60)
    logger.info("Starting service: %s", name)
    logger.info("=" * 60)

    start = time.time()
    try:
        count = run_fn()
        duration = time.time() - start
        log_sync(name, "success", count, duration)
        logger.info(
            "Service %s completed: %d records in %.1fs", name, count, duration,
        )
    except Exception as exc:
        duration = time.time() - start
        log_sync(name, "error", 0, duration, str(exc))
        logger.exception("Service %s failed after %.1fs: %s", name, duration, exc)


def main() -> None:
    """Run the full scraping pipeline."""
    logger.info("Stat Corner daily sync starting...")
    start = time.time()

    # Service 1: FPL API — must run first to populate player records
    from src.services.fpl_sync import run as fpl_run
    run_service("fpl_sync", fpl_run)

    # Pause between services to avoid rapid cross-site traffic
    logger.info("Pausing before Understat...")
    human_delay_range(10, 30)

    # Service 2: Understat — needs player records for matching
    from src.services.understat import run as understat_run
    run_service("understat", understat_run)

    # Pause between services
    logger.info("Pausing before FBRef...")
    human_delay_range(15, 45)

    # Service 3: FBRef — needs player records for matching
    from src.services.fbref import run as fbref_run
    run_service("fbref", fbref_run)

    total_duration = time.time() - start
    logger.info(
        "Stat Corner daily sync complete in %.1f minutes",
        total_duration / 60,
    )


if __name__ == "__main__":
    main()
