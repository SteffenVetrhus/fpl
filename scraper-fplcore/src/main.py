"""Entrypoint for the FPL-Core-Insights scraper."""

from __future__ import annotations

import logging
import time

from src.pb_client import log_sync

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("scraper-fplcore")


def main() -> None:
    logger.info("FPL-Core-Insights scraper starting...")
    start = time.time()

    try:
        from src.fplcore import run
        count = run()
        duration = time.time() - start
        log_sync("fplcore", "success", count, duration)
        logger.info(
            "FPL-Core-Insights scraper completed: %d records in %.1fs",
            count,
            duration,
        )
    except Exception as exc:
        duration = time.time() - start
        log_sync("fplcore", "error", 0, duration, str(exc))
        logger.exception(
            "FPL-Core-Insights scraper failed after %.1fs: %s", duration, exc
        )
        raise


if __name__ == "__main__":
    main()
