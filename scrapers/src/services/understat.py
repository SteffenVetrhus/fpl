"""Service 2: Understat scraper.

Understat serves data via internal AJAX endpoints that return JSON directly.
This service fetches per-match xG, npxG, xA, and shot counts for EPL players,
maps matches to FPL gameweeks by date, then updates ``gameweek_stats`` in
PocketBase.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from src.config import FPL_API_BASE_URL
from src.delay import human_delay, human_delay_range
from src.pb_client import get_all_players, upsert_gameweek_stat
from src.player_matcher import match_player, update_player_external_id

logger = logging.getLogger(__name__)

UNDERSTAT_BASE = "https://understat.com"
SEASON = "2025"  # Understat uses the start year of the season

# Required header for Understat's AJAX endpoints
_AJAX_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
}


def _fetch_ajax(endpoint: str) -> dict | list:
    """Fetch JSON from an Understat AJAX endpoint.

    Understat's frontend loads data via internal endpoints that require the
    ``X-Requested-With: XMLHttpRequest`` header.
    """
    url = f"{UNDERSTAT_BASE}/{endpoint}"
    resp = httpx.get(url, headers=_AJAX_HEADERS, timeout=30, follow_redirects=True)
    resp.raise_for_status()
    return resp.json()


def fetch_league_players() -> list[dict]:
    """Fetch all EPL player summary data for the current season.

    Returns a list of player dicts with keys: id, player_name, team_title,
    games, xG, npxG, xA, shots, etc.
    """
    logger.info("Fetching Understat league data for EPL/%s", SEASON)
    data = _fetch_ajax(f"getLeagueData/EPL/{SEASON}")
    return data.get("players", [])


def fetch_player_matches(understat_id: int) -> list[dict]:
    """Fetch per-match data for a specific player from Understat.

    Returns a list of match dicts with xG, npxG, xA, shots per match.
    Only returns matches from the current season.
    """
    data = _fetch_ajax(f"getPlayerData/{understat_id}")
    matches = data.get("matches", [])
    return [m for m in matches if m.get("season") == SEASON]


def _build_gameweek_date_map() -> list[tuple[int, datetime, datetime]]:
    """Fetch FPL gameweek deadlines and build date ranges for each GW.

    Returns a sorted list of (gw_number, start_datetime, end_datetime) tuples.
    A match belongs to a gameweek if its date falls on or after that GW's
    deadline and before the next GW's deadline.
    """
    resp = httpx.get(f"{FPL_API_BASE_URL}/bootstrap-static/", timeout=30)
    resp.raise_for_status()
    events = resp.json().get("events", [])

    ranges = []
    for i, ev in enumerate(events):
        gw = ev["id"]
        # Use the start of the deadline day as the GW start, because Understat
        # match dates have no time component (they resolve to midnight UTC) and
        # FPL deadlines are typically set to the afternoon of the first match day.
        deadline = datetime.fromisoformat(
            ev["deadline_time"].replace("Z", "+00:00")
        )
        start = deadline.replace(hour=0, minute=0, second=0, microsecond=0)
        if i + 1 < len(events):
            next_deadline = datetime.fromisoformat(
                events[i + 1]["deadline_time"].replace("Z", "+00:00")
            )
            end = next_deadline.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            # Last gameweek — extend far into the future
            end = datetime(2099, 12, 31, tzinfo=timezone.utc)
        ranges.append((gw, start, end))

    return ranges


def _match_date_to_gw(
    match_date: str, gw_ranges: list[tuple[int, datetime, datetime]]
) -> int | None:
    """Map a match date string to an FPL gameweek using deadline ranges.

    ``match_date`` is in ``YYYY-MM-DD`` format from Understat.
    """
    try:
        dt = datetime.strptime(match_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return None

    for gw, start, end in gw_ranges:
        if start <= dt < end:
            return gw

    return None


def run() -> int:
    """Run the Understat sync pipeline. Returns records processed."""
    logger.info("Starting Understat sync...")

    gw_ranges = _build_gameweek_date_map()
    logger.info("Built gameweek date map with %d gameweeks", len(gw_ranges))

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
            gw = _match_date_to_gw(m.get("date", ""), gw_ranges)
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
