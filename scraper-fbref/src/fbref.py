"""FBRef / Opta advanced metrics scraper.

Scrapes progressive carries, shot-creating actions (SCA), and ball
recoveries from FBRef's stats tables.
"""

from __future__ import annotations

import logging

import httpx
from bs4 import BeautifulSoup

from src.delay import human_delay_range
from src.pb_client import get_all_players, upsert_gameweek_stat
from src.player_matcher import match_player, update_player_external_id

logger = logging.getLogger(__name__)

FBREF_BASE = "https://fbref.com"
EPL_SEASON_URL = f"{FBREF_BASE}/en/comps/9/2025-2026/stats/2025-2026-Premier-League-Stats"

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,"
        "application/signed-exchange;v=b3;q=0.7"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Sec-CH-UA": '"Chromium";v="133", "Not(A:Brand";v="99", "Google Chrome";v="133"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Linux"',
    "Cache-Control": "max-age=0",
    "Referer": "https://www.google.com/",
}

MAX_RETRIES = 4
INITIAL_BACKOFF = 4


def _create_client() -> httpx.Client:
    """Create an httpx client with browser-like headers."""
    return httpx.Client(
        headers=_BROWSER_HEADERS,
        follow_redirects=True,
        timeout=30.0,
        http2=True,
    )


def _fetch_page(client: httpx.Client, url: str) -> str:
    """Fetch an HTML page from FBRef with retry and exponential backoff."""
    last_exc: httpx.HTTPStatusError | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            last_exc = exc
            if (status == 429 or status == 403) and attempt < MAX_RETRIES:
                low = INITIAL_BACKOFF * (2 ** attempt)
                high = low + 3
                logger.warning(
                    "FBRef returned %d for %s (attempt %d/%d), "
                    "retrying in %d-%ds...",
                    status, url, attempt + 1, MAX_RETRIES + 1, low, high,
                )
                human_delay_range(low, high)
            else:
                raise
    raise last_exc  # type: ignore[misc]


def _parse_stat_table(
    html: str, table_id: str,
) -> list[dict[str, str]]:
    """Parse an FBRef stats table into a list of row dicts."""
    soup = BeautifulSoup(html, "html.parser")

    table = soup.find("table", id=table_id)

    if table is None:
        import re
        for comment in soup.find_all(string=lambda t: isinstance(t, type(soup.new_string(""))) is False):
            pass
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


def fetch_possession_stats(client: httpx.Client) -> list[dict[str, str]]:
    """Fetch possession/carrying stats (progressive carries)."""
    logger.info("Fetching FBRef possession stats...")
    url = EPL_SEASON_URL.replace("/stats/", "/possession/")
    html = _fetch_page(client, url)
    return _parse_stat_table(html, "stats_possession")


def fetch_gca_stats(client: httpx.Client) -> list[dict[str, str]]:
    """Fetch goal and shot creation stats (SCA)."""
    logger.info("Fetching FBRef GCA stats...")
    url = EPL_SEASON_URL.replace("/stats/", "/gca/")
    html = _fetch_page(client, url)
    return _parse_stat_table(html, "stats_gca")


def fetch_defense_stats(client: httpx.Client) -> list[dict[str, str]]:
    """Fetch defensive stats (tackles, blocks, interceptions, recoveries)."""
    logger.info("Fetching FBRef defensive stats...")
    url = EPL_SEASON_URL.replace("/stats/", "/defense/")
    html = _fetch_page(client, url)
    return _parse_stat_table(html, "stats_defense")


def _safe_int(value: str, default: int = 0) -> int:
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def _safe_float(value: str, default: float = 0.0) -> float:
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def run() -> int:
    """Run the FBRef sync pipeline. Returns records processed."""
    logger.info("Starting FBRef sync...")
    client = _create_client()
    players_pb = get_all_players()
    count = 0

    player_stats: dict[str, dict] = {}

    human_delay_range(3, 6)
    for row in fetch_possession_stats(client):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "progressive_carries": _safe_int(row.get("progressive_carries", "0")),
        })

    human_delay_range(5, 10)
    for row in fetch_gca_stats(client):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "sca": _safe_int(row.get("sca", "0")),
        })

    human_delay_range(5, 10)
    for row in fetch_defense_stats(client):
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
