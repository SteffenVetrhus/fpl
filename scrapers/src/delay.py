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
    """Sleep for *base* seconds ± *jitter* (random uniform).

    The actual sleep will be ``base + random(-jitter, +jitter)``, clamped
    to a minimum of 0.3 s so we never fire instantly.

    Args:
        base: Centre of the delay window in seconds.
        jitter: Maximum random deviation in either direction.
    """
    actual = max(0.3, base + random.uniform(-jitter, jitter))
    logger.debug("Sleeping %.2fs", actual)
    time.sleep(actual)


def human_delay_range(low: float, high: float) -> None:
    """Sleep for a random duration between *low* and *high* seconds.

    Useful for longer pauses (e.g. between services) where a wide range
    feels more natural.

    Args:
        low: Minimum sleep in seconds.
        high: Maximum sleep in seconds.
    """
    actual = random.uniform(low, high)
    logger.debug("Sleeping %.2fs", actual)
    time.sleep(actual)
