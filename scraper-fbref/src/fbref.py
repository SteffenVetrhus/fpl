"""FBRef / Opta advanced metrics scraper.

Scrapes progressive carries, shot-creating actions (SCA), and ball
recoveries from FBRef's stats tables.

Two-layer approach to bypass Cloudflare:
1. Primary: cloudscraper — lightweight, uses proper TLS fingerprints
   and solves CF JS challenges without a full browser.
2. Fallback: Camoufox (anti-detect Firefox) with Xvfb virtual display
   for complex challenges that require a real browser.

Both layers support an optional PROXY_URL for residential proxy routing,
which is often required when running from datacenter IPs.
"""

from __future__ import annotations

import logging
import os
import subprocess
import time

import cloudscraper
from bs4 import BeautifulSoup
from playwright.sync_api import Page

from src.delay import human_delay_range
from src.pb_client import get_all_players, upsert_gameweek_stat
from src.player_matcher import match_player, update_player_external_id

logger = logging.getLogger(__name__)

FBREF_BASE = "https://fbref.com"
EPL_SEASON_URL = f"{FBREF_BASE}/en/comps/9/2025-2026/stats/2025-2026-Premier-League-Stats"

MAX_RETRIES = 4
INITIAL_BACKOFF = 4

PROXY_URL = os.getenv("PROXY_URL", "")

# Cloudflare challenge typically resolves within 10s; we wait up to 30s.
CF_CHALLENGE_TIMEOUT_MS = 30_000

_xvfb_proc: subprocess.Popen | None = None


# ---------------------------------------------------------------------------
# Layer 1: cloudscraper (lightweight, no browser needed)
# ---------------------------------------------------------------------------

def _create_scraper() -> cloudscraper.CloudScraper:
    """Create a cloudscraper session with optional proxy."""
    scraper = cloudscraper.create_scraper(
        browser={"browser": "chrome", "platform": "linux", "desktop": True},
    )
    if PROXY_URL:
        scraper.proxies = {"http": PROXY_URL, "https": PROXY_URL}
        logger.info("cloudscraper using proxy: %s", PROXY_URL.split("@")[-1])
    return scraper


def _fetch_page_cloudscraper(scraper: cloudscraper.CloudScraper, url: str) -> str:
    """Fetch a page via cloudscraper with retry."""
    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = scraper.get(url, timeout=30)
            if resp.status_code in (403, 429):
                raise RuntimeError(
                    f"FBRef returned HTTP {resp.status_code} for {url}"
                )
            resp.raise_for_status()
            return resp.text
        except Exception as exc:
            last_exc = exc
            if attempt < MAX_RETRIES:
                low = INITIAL_BACKOFF * (2 ** attempt)
                high = low + 3
                logger.warning(
                    "cloudscraper fetch failed for %s (attempt %d/%d): %s — "
                    "retrying in %d-%ds...",
                    url, attempt + 1, MAX_RETRIES + 1, exc, low, high,
                )
                human_delay_range(low, high)
            else:
                raise
    raise last_exc  # type: ignore[misc]


def _try_cloudscraper() -> dict[str, str] | None:
    """Try fetching all stats via cloudscraper. Returns None on failure."""
    logger.info("Attempting cloudscraper (lightweight CF solver)...")
    try:
        scraper = _create_scraper()
        pages: dict[str, str] = {}

        human_delay_range(1, 3)
        url = EPL_SEASON_URL.replace("/stats/", "/possession/")
        logger.info("Fetching FBRef possession stats (cloudscraper)...")
        pages["possession"] = _fetch_page_cloudscraper(scraper, url)

        human_delay_range(5, 10)
        url = EPL_SEASON_URL.replace("/stats/", "/gca/")
        logger.info("Fetching FBRef GCA stats (cloudscraper)...")
        pages["gca"] = _fetch_page_cloudscraper(scraper, url)

        human_delay_range(5, 10)
        url = EPL_SEASON_URL.replace("/stats/", "/defense/")
        logger.info("Fetching FBRef defensive stats (cloudscraper)...")
        pages["defense"] = _fetch_page_cloudscraper(scraper, url)

        return pages
    except Exception as exc:
        logger.warning("cloudscraper failed: %s — falling back to browser.", exc)
        return None


# ---------------------------------------------------------------------------
# Layer 2: Camoufox browser fallback
# ---------------------------------------------------------------------------

def _ensure_xvfb() -> None:
    """Start Xvfb on :99 if not already running."""
    global _xvfb_proc
    if _xvfb_proc is not None:
        return

    logger.info("Starting Xvfb on :99...")
    _xvfb_proc = subprocess.Popen(
        ["Xvfb", ":99", "-screen", "0", "1920x1080x24", "-nolisten", "tcp"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1)
    if _xvfb_proc.poll() is not None:
        raise RuntimeError(
            f"Xvfb failed to start (exit code {_xvfb_proc.returncode})"
        )
    logger.info("Xvfb started (pid=%d).", _xvfb_proc.pid)


def _solve_cloudflare(page: Page) -> None:
    """Detect and solve Cloudflare challenge if present."""
    title = page.title()
    if "Just a moment" not in title and "Checking" not in title:
        return

    logger.info("Cloudflare challenge detected, waiting for resolution...")

    # Try clicking the Turnstile checkbox if it appears.
    try:
        turnstile = page.frame_locator(
            "iframe[src*='challenges.cloudflare.com']"
        )
        checkbox = turnstile.locator("input[type='checkbox'], .cb-lb")
        if checkbox.count() > 0:
            logger.info("Clicking Turnstile checkbox...")
            checkbox.first.click()
    except Exception:
        logger.debug("No Turnstile checkbox found, waiting for auto-resolve")

    try:
        page.wait_for_function(
            """() => {
                const title = document.title || '';
                return !title.includes('Just a moment')
                    && !title.includes('Checking')
                    && !title.includes('Attention Required');
            }""",
            timeout=CF_CHALLENGE_TIMEOUT_MS,
        )
        logger.info("Cloudflare challenge resolved.")
    except Exception:
        logger.warning(
            "Cloudflare challenge did not resolve within %ds.",
            CF_CHALLENGE_TIMEOUT_MS // 1000,
        )


def _fetch_page_browser(page: Page, url: str) -> str:
    """Fetch an HTML page via Camoufox browser with retry."""
    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=60_000)
            _solve_cloudflare(page)

            status = resp.status if resp else 0
            if status == 403 or status == 429:
                raise RuntimeError(
                    f"FBRef returned HTTP {status} for {url}"
                )

            page.wait_for_selector("table", timeout=15_000)
            return page.content()

        except Exception as exc:
            last_exc = exc
            if attempt < MAX_RETRIES:
                low = INITIAL_BACKOFF * (2 ** attempt)
                high = low + 3
                logger.warning(
                    "Browser fetch failed for %s (attempt %d/%d): %s — "
                    "retrying in %d-%ds...",
                    url, attempt + 1, MAX_RETRIES + 1, exc, low, high,
                )
                human_delay_range(low, high)
            else:
                raise

    raise last_exc  # type: ignore[misc]


def _try_browser() -> dict[str, str]:
    """Fetch all stats via Camoufox browser."""
    from camoufox.sync_api import Camoufox

    logger.info("Attempting Camoufox browser fallback...")
    _ensure_xvfb()

    proxy_config = None
    if PROXY_URL:
        proxy_config = {"server": PROXY_URL}
        logger.info("Camoufox using proxy: %s", PROXY_URL.split("@")[-1])

    pages: dict[str, str] = {}

    with Camoufox(
        headless=False,
        virtual_display=":99",
        disable_coop=True,
        os="linux",
        proxy=proxy_config,
    ) as context:
        page = context.new_page()

        human_delay_range(3, 6)
        url = EPL_SEASON_URL.replace("/stats/", "/possession/")
        logger.info("Fetching FBRef possession stats (browser)...")
        pages["possession"] = _fetch_page_browser(page, url)

        human_delay_range(5, 10)
        url = EPL_SEASON_URL.replace("/stats/", "/gca/")
        logger.info("Fetching FBRef GCA stats (browser)...")
        pages["gca"] = _fetch_page_browser(page, url)

        human_delay_range(5, 10)
        url = EPL_SEASON_URL.replace("/stats/", "/defense/")
        logger.info("Fetching FBRef defensive stats (browser)...")
        pages["defense"] = _fetch_page_browser(page, url)

    return pages


# ---------------------------------------------------------------------------
# Parsing (shared by both layers)
# ---------------------------------------------------------------------------

def _parse_stat_table(
    html: str, table_id: str,
) -> list[dict[str, str]]:
    """Parse an FBRef stats table into a list of row dicts."""
    soup = BeautifulSoup(html, "html.parser")

    table = soup.find("table", id=table_id)

    if table is None:
        comments = soup.find_all(
            string=lambda text: text and table_id in str(text)
        )
        for comment in comments:
            comment_soup = BeautifulSoup(str(comment), "html.parser")
            table = comment_soup.find("table", id=table_id)
            if table:
                break

    if table is None:
        logger.warning("Could not find table '%s'", table_id)
        return []

    rows = []
    tbody = table.find("tbody")
    if tbody is None:
        return rows

    for tr in tbody.find_all("tr"):
        if tr.get("class") and "thead" in tr.get("class", []):
            continue

        row: dict[str, str] = {}
        for td in tr.find_all(["th", "td"]):
            stat = td.get("data-stat", "")
            if stat:
                row[stat] = td.get_text(strip=True)
        if row.get("player"):
            link = tr.find("a", href=True)
            if link and "/players/" in link["href"]:
                parts = link["href"].split("/")
                player_idx = parts.index("players") if "players" in parts else -1
                if player_idx >= 0 and player_idx + 1 < len(parts):
                    row["fbref_id"] = parts[player_idx + 1]
            rows.append(row)

    return rows


def _safe_int(value: str, default: int = 0) -> int:
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run() -> int:
    """Run the FBRef sync pipeline. Returns records processed."""
    logger.info("Starting FBRef sync...")
    players_pb = get_all_players()
    count = 0

    # Try cloudscraper first (fast, lightweight), fall back to browser.
    pages = _try_cloudscraper()
    if pages is None:
        pages = _try_browser()

    player_stats: dict[str, dict] = {}

    for row in _parse_stat_table(pages["possession"], "stats_possession"):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "progressive_carries": _safe_int(row.get("progressive_carries", "0")),
        })

    for row in _parse_stat_table(pages["gca"], "stats_gca"):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "sca": _safe_int(row.get("sca", "0")),
        })

    for row in _parse_stat_table(pages["defense"], "stats_defense"):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        tackles = _safe_int(row.get("tackles", "0"))
        blocks = _safe_int(row.get("blocks", "0"))
        interceptions = _safe_int(row.get("interceptions", "0"))
        clearances = _safe_int(row.get("clearances", "0"))
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "cbit": tackles + blocks + interceptions + clearances,
            "ball_recoveries": _safe_int(row.get("ball_recoveries", "0")),
        })

    for stats in player_stats.values():
        name = stats.get("player_name", "")
        team = stats.get("team", "")
        if not name:
            continue

        matched = None
        fbref_id = stats.get("fbref_id", "")
        if fbref_id:
            for p in players_pb:
                pid = getattr(p, "fbref_id", None)
                if pid and str(pid) == fbref_id:
                    matched = p
                    break

        if matched is None:
            matched = match_player("fbref", name, team, players_pb)

        if matched is None:
            continue

        if fbref_id:
            update_player_external_id(matched, "fbref", fbref_id)

        stat_data = {}
        if "progressive_carries" in stats:
            stat_data["progressive_carries"] = stats["progressive_carries"]
        if "sca" in stats:
            stat_data["sca"] = stats["sca"]
        if "cbit" in stats:
            stat_data["cbit"] = stats["cbit"]
        if "ball_recoveries" in stats:
            stat_data["ball_recoveries"] = stats["ball_recoveries"]

        if stat_data:
            upsert_gameweek_stat(matched.id, 0, stat_data)
            count += 1

    logger.info("FBRef sync complete: %d records", count)
    return count
