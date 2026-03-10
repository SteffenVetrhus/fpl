"""Human-like delay utilities.

Adds randomised jitter to all pauses so request patterns don't look
like a bot hammering endpoints at perfectly-spaced intervals.
"""

from __future__ import annotations

import logging
import random
import time

logger = logging.getLogger(__name__)


def human_delay(base: float, jitter: float = 0.5) -> None:
    """Sleep for *base* seconds ± *jitter* (random uniform)."""
    actual = max(0.3, base + random.uniform(-jitter, jitter))
    logger.debug("Sleeping %.2fs", actual)
    time.sleep(actual)


def human_delay_range(low: float, high: float) -> None:
    """Sleep for a random duration between *low* and *high* seconds."""
    actual = random.uniform(low, high)
    logger.debug("Sleeping %.2fs", actual)
    time.sleep(actual)
