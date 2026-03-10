"""Standalone entrypoint for the FBRef scraper service."""

from __future__ import annotations

import logging
import time

from src.pb_client import log_sync

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("scraper-fbref")


def main() -> None:
    logger.info("FBRef scraper starting...")
    start = time.time()

    try:
        from src.services.fbref import run
        count = run()
        duration = time.time() - start
        log_sync("fbref", "success", count, duration)
        logger.info("FBRef scraper completed: %d records in %.1fs", count, duration)
    except Exception as exc:
        duration = time.time() - start
        log_sync("fbref", "error", 0, duration, str(exc))
        logger.exception("FBRef scraper failed after %.1fs: %s", duration, exc)
        raise


if __name__ == "__main__":
    main()
