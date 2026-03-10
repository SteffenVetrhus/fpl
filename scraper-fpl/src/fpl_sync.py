"""FPL API sync service.

Fetches player data from the official FPL API and populates the ``players``
and ``price_history`` PocketBase collections.  Also pulls per-gameweek stats
from the element-summary endpoint to seed ``gameweek_stats`` with official
FPL data (points, minutes, goals, assists, xG/xA from FPL's own model).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from src.config import FPL_API_BASE_URL
from src.delay import human_delay, human_delay_range
from src.pb_client import (
    create_price_snapshot,
    get_player_by_fpl_id,
    upsert_gameweek_stat,
    upsert_player,
)

logger = logging.getLogger(__name__)

POSITION_MAP = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}


def _fetch_json(url: str) -> dict | list:
    """Fetch JSON from the FPL API with a polite user-agent."""
    headers = {"User-Agent": "FPL-StatCorner/1.0"}
    resp = httpx.get(url, headers=headers, timeout=30, follow_redirects=True)
    resp.raise_for_status()
    return resp.json()


def sync_players() -> int:
    """Sync all players from bootstrap-static. Returns count processed."""
    logger.info("Fetching bootstrap-static data...")
    data = _fetch_json(f"{FPL_API_BASE_URL}/bootstrap-static/")

    teams = {t["id"]: t["short_name"] for t in data["teams"]}
    count = 0

    for el in data["elements"]:
        player_data = {
            "fpl_id": el["id"],
            "name": el["web_name"],
            "full_name": f'{el["first_name"]} {el["second_name"]}',
            "team": teams.get(el["team"], "UNK"),
            "position": POSITION_MAP.get(el["element_type"], "UNK"),
        }
        upsert_player(player_data)
        count += 1

    logger.info("Synced %d players", count)
    return count


def sync_price_snapshots() -> int:
    """Create daily price/ownership snapshots for all players. Returns count."""
    logger.info("Creating price snapshots...")
    data = _fetch_json(f"{FPL_API_BASE_URL}/bootstrap-static/")

    count = 0
    now = datetime.now(timezone.utc).isoformat()

    for el in data["elements"]:
        player = get_player_by_fpl_id(el["id"])
        if player is None:
            continue

        create_price_snapshot(player.id, {
            "price": el["now_cost"],
            "ownership": float(el.get("selected_by_percent", "0")),
            "transfers_in": el.get("transfers_in_event", 0),
            "transfers_out": el.get("transfers_out_event", 0),
            "snapshot_date": now,
        })
        count += 1

    logger.info("Created %d price snapshots", count)
    return count


def sync_element_summaries(batch_size: int = 50) -> int:
    """Fetch per-player element summaries and populate gameweek_stats."""
    logger.info("Fetching element summaries for gameweek stats...")
    data = _fetch_json(f"{FPL_API_BASE_URL}/bootstrap-static/")

    active_players = [el for el in data["elements"] if el.get("minutes", 0) > 0]
    logger.info("Found %d active players to process", len(active_players))

    count = 0
    for i, el in enumerate(active_players):
        player = get_player_by_fpl_id(el["id"])
        if player is None:
            continue

        try:
            summary = _fetch_json(
                f"{FPL_API_BASE_URL}/element-summary/{el['id']}/"
            )
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Failed to fetch summary for %s (fpl_id=%d): %s",
                el["web_name"], el["id"], exc,
            )
            continue

        for gw_data in summary.get("history", []):
            upsert_gameweek_stat(player.id, gw_data["round"], {
                "minutes": gw_data.get("minutes", 0),
                "goals": gw_data.get("goals_scored", 0),
                "assists": gw_data.get("assists", 0),
                "xg": float(gw_data.get("expected_goals", "0")),
                "xa": float(gw_data.get("expected_assists", "0")),
                "shots": 0,
                "key_passes": 0,
                "fpl_points": gw_data.get("total_points", 0),
            })
            count += 1

        if (i + 1) % batch_size == 0:
            logger.info("Processed %d/%d players...", i + 1, len(active_players))
            human_delay_range(3, 6)
        else:
            human_delay(1.0, 0.5)

    logger.info("Created/updated %d gameweek stat records", count)
    return count


def run() -> int:
    """Run the full FPL sync pipeline. Returns total records processed."""
    total = 0
    total += sync_players()
    total += sync_price_snapshots()
    total += sync_element_summaries()
    return total
