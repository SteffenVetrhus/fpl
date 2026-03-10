"""Service 3: FBRef / Opta advanced metrics scraper.

Scrapes progressive carries, shot-creating actions (SCA), and ball
recoveries from FBRef's stats tables.  Uses ``cloudscraper`` to handle
Cloudflare protection.
"""

from __future__ import annotations

import logging
import time

import cloudscraper
from bs4 import BeautifulSoup

from src.pb_client import get_all_players, upsert_gameweek_stat
from src.player_matcher import match_player, update_player_external_id

logger = logging.getLogger(__name__)

FBREF_BASE = "https://fbref.com"
EPL_SEASON_URL = f"{FBREF_BASE}/en/comps/9/2025-2026/stats/2025-2026-Premier-League-Stats"


def _create_scraper() -> cloudscraper.CloudScraper:
    """Create a cloudscraper instance with browser-like headers."""
    return cloudscraper.create_scraper(
        browser={"browser": "chrome", "platform": "linux", "desktop": True},
    )


def _fetch_page(scraper: cloudscraper.CloudScraper, url: str) -> str:
    """Fetch an HTML page from FBRef via cloudscraper."""
    resp = scraper.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text


def _parse_stat_table(
    html: str, table_id: str,
) -> list[dict[str, str]]:
    """Parse an FBRef stats table into a list of row dicts.

    FBRef wraps tables in comments (<!-- ... -->) for lazy loading.
    We need to handle both regular and commented-out tables.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Try direct table first
    table = soup.find("table", id=table_id)

    # If not found, check inside HTML comments
    if table is None:
        import re
        for comment in soup.find_all(string=lambda t: isinstance(t, type(soup.new_string(""))) is False):
            pass
        # FBRef hides tables in comments
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
            # Extract player link for fbref_id
            link = tr.find("a", href=True)
            if link and "/players/" in link["href"]:
                parts = link["href"].split("/")
                player_idx = parts.index("players") if "players" in parts else -1
                if player_idx >= 0 and player_idx + 1 < len(parts):
                    row["fbref_id"] = parts[player_idx + 1]
            rows.append(row)

    return rows


def fetch_possession_stats(scraper: cloudscraper.CloudScraper) -> list[dict[str, str]]:
    """Fetch possession/carrying stats (progressive carries)."""
    logger.info("Fetching FBRef possession stats...")
    url = EPL_SEASON_URL.replace("/stats/", "/possession/")
    html = _fetch_page(scraper, url)
    return _parse_stat_table(html, "stats_possession")


def fetch_gca_stats(scraper: cloudscraper.CloudScraper) -> list[dict[str, str]]:
    """Fetch goal and shot creation stats (SCA)."""
    logger.info("Fetching FBRef GCA stats...")
    url = EPL_SEASON_URL.replace("/stats/", "/gca/")
    html = _fetch_page(scraper, url)
    return _parse_stat_table(html, "stats_gca")


def fetch_defense_stats(scraper: cloudscraper.CloudScraper) -> list[dict[str, str]]:
    """Fetch defensive stats (tackles, blocks, interceptions, recoveries)."""
    logger.info("Fetching FBRef defensive stats...")
    url = EPL_SEASON_URL.replace("/stats/", "/defense/")
    html = _fetch_page(scraper, url)
    return _parse_stat_table(html, "stats_defense")


def _safe_int(value: str, default: int = 0) -> int:
    """Parse an int from a string, returning default on failure."""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def _safe_float(value: str, default: float = 0.0) -> float:
    """Parse a float from a string, returning default on failure."""
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def run() -> int:
    """Run the FBRef sync pipeline. Returns records processed.

    FBRef data is season-level aggregates (not per-gameweek), so we store
    the season totals as a special ``gw=0`` record for each player. The React
    app can use these for per-90 calculations.
    """
    logger.info("Starting FBRef sync...")
    scraper = _create_scraper()
    players_pb = get_all_players()
    count = 0

    # Merge data from three tables by player name + team
    player_stats: dict[str, dict] = {}

    # 1. Possession stats → progressive carries
    time.sleep(3)
    for row in fetch_possession_stats(scraper):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "progressive_carries": _safe_int(row.get("progressive_carries", "0")),
        })

    # 2. GCA stats → shot-creating actions
    time.sleep(5)
    for row in fetch_gca_stats(scraper):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "sca": _safe_int(row.get("sca", "0")),
        })

    # 3. Defense stats → CBIT, ball recoveries
    time.sleep(5)
    for row in fetch_defense_stats(scraper):
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

    # 4. Match to PocketBase players and upsert
    for stats in player_stats.values():
        name = stats.get("player_name", "")
        team = stats.get("team", "")
        if not name:
            continue

        # Try fbref_id direct lookup first
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

        # Store as gw=0 (season aggregate)
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
