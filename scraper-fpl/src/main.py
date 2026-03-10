"""Entrypoint for the FPL sync scraper."""

from __future__ import annotations

import logging
import time

from src.pb_client import log_sync

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("scraper-fpl")


def main() -> None:
    logger.info("FPL sync starting...")
    start = time.time()

    try:
        from src.fpl_sync import run
        count = run()
        duration = time.time() - start
        log_sync("fpl_sync", "success", count, duration)
        logger.info("FPL sync completed: %d records in %.1fs", count, duration)
    except Exception as exc:
        duration = time.time() - start
        log_sync("fpl_sync", "error", 0, duration, str(exc))
        logger.exception("FPL sync failed after %.1fs: %s", duration, exc)
        raise


if __name__ == "__main__":
    main()
