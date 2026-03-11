"""Entrypoint for the Understat scraper."""

from __future__ import annotations

import logging
import time

from src.pb_client import log_sync

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("scraper-understat")


def main() -> None:
    from src.config import validate_env
    validate_env()
    logger.info("Understat scraper starting...")
    start = time.time()

    try:
        from src.understat import run
        count = run()
        duration = time.time() - start
        log_sync("understat", "success", count, duration)
        logger.info("Understat scraper completed: %d records in %.1fs", count, duration)
    except Exception as exc:
        duration = time.time() - start
        log_sync("understat", "error", 0, duration, str(exc))
        logger.exception("Understat scraper failed after %.1fs: %s", duration, exc)
        raise


if __name__ == "__main__":
    main()
