"""Service 2: Understat scraper.

Understat embeds JSON data in ``<script>`` tags on league and player pages.
This service parses that embedded data to extract per-match xG, npxG, xA,
and shot counts, then updates ``gameweek_stats`` in PocketBase.
"""

from __future__ import annotations

import json
import logging
import re

import httpx
from bs4 import BeautifulSoup

from src.delay import human_delay, human_delay_range
from src.pb_client import get_all_players, upsert_gameweek_stat
from src.player_matcher import match_player, update_player_external_id

logger = logging.getLogger(__name__)

UNDERSTAT_BASE = "https://understat.com"
SEASON = "2025"  # Understat uses the start year of the season


def _fetch_page(url: str) -> str:
    """Fetch an HTML page from Understat."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
    }
    resp = httpx.get(url, headers=headers, timeout=30, follow_redirects=True)
    resp.raise_for_status()
    return resp.text


def _extract_json_var(html: str, var_name: str) -> list | dict:
    """Extract a JavaScript variable from Understat's embedded scripts.

    Understat stores data like:
        var playersData = JSON.parse('...')
    The JSON string uses hex-encoded characters (\\xNN) that we need to decode.
    """
    pattern = rf"var\s+{var_name}\s*=\s*JSON\.parse\('(.+?)'\)"
    match = re.search(pattern, html)
    if not match:
        raise ValueError(f"Could not find variable '{var_name}' in page")

    raw = match.group(1)
    # Decode hex escapes like \x22 → "
    decoded = raw.encode("utf-8").decode("unicode_escape")
    return json.loads(decoded)


def fetch_league_players() -> list[dict]:
    """Fetch all EPL player summary data for the current season.

    Returns a list of player dicts with keys: id, player_name, team_title,
    games, xG, npxG, xA, shots, etc.
    """
    url = f"{UNDERSTAT_BASE}/league/EPL/{SEASON}"
    logger.info("Fetching Understat league page: %s", url)
    html = _fetch_page(url)
    return _extract_json_var(html, "playersData")


def fetch_player_matches(understat_id: int) -> list[dict]:
    """Fetch per-match data for a specific player from Understat.

    Returns a list of match dicts with xG, npxG, xA, shots per match.
    """
    url = f"{UNDERSTAT_BASE}/player/{understat_id}"
    html = _fetch_page(url)
    return _extract_json_var(html, "matchesData")


def _map_understat_round_to_gw(match_data: dict) -> int | None:
    """Map an Understat match to an FPL gameweek.

    Understat provides a ``round`` field that usually maps to the PL matchday.
    This is a best-effort mapping — edge cases exist for double gameweeks.
    """
    return int(match_data.get("round", 0)) or None


def run() -> int:
    """Run the Understat sync pipeline. Returns records processed."""
    logger.info("Starting Understat sync...")
    players_pb = get_all_players()
    league_data = fetch_league_players()
    count = 0

    for us_player in league_data:
        us_name = us_player.get("player_name", "")
        us_team = us_player.get("team_title", "")
        us_id = int(us_player.get("id", 0))

        if not us_name or not us_id:
            continue

        # Try to find existing player with understat_id first
        matched = None
        for p in players_pb:
            uid = getattr(p, "understat_id", None)
            if uid and int(uid) == us_id:
                matched = p
                break

        # Fall back to name matching
        if matched is None:
            matched = match_player("understat", us_name, us_team, players_pb)

        if matched is None:
            continue

        # Store the understat_id for future lookups
        update_player_external_id(matched, "understat", us_id)

        # Fetch per-match data for this player
        try:
            matches = fetch_player_matches(us_id)
        except Exception as exc:
            logger.warning("Failed to fetch matches for %s: %s", us_name, exc)
            human_delay_range(2, 5)
            continue

        for m in matches:
            gw = _map_understat_round_to_gw(m)
            if gw is None:
                continue

            upsert_gameweek_stat(matched.id, gw, {
                "xg": float(m.get("xG", 0)),
                "npxg": float(m.get("npxG", 0)),
                "xa": float(m.get("xA", 0)),
                "shots": int(m.get("shots", 0)),
                "key_passes": int(m.get("key_passes", 0)),
            })
            count += 1

        # Human-like delay between player page fetches
        human_delay(2.0, 1.0)

    logger.info("Understat sync complete: %d records", count)
    return count
