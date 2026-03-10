"""FPL-Core-Insights CSV fetcher.

Fetches pre-built CSV data from github.com/olbauday/FPL-Core-Insights.
Player IDs are already FPL element IDs — no fuzzy name matching needed.
"""

from __future__ import annotations

import csv
import io
import logging
from typing import Any

import httpx

from src.config import FPLCORE_BASE_URL
from src.pb_client import get_all_players, upsert_gameweek_stat

logger = logging.getLogger(__name__)

# Stats we extract from playermatchstats.csv
MATCH_STAT_FIELDS = [
    "minutes_played",
    "goals",
    "assists",
    "total_shots",
    "xg",
    "xa",
    "xgot",
    "shots_on_target",
    "chances_created",
    "successful_dribbles",
    "touches_opposition_box",
    "recoveries",
    "tackles_won",
    "interceptions",
    "blocks",
    "clearances",
    "duels_won",
    "aerial_duels_won",
    "big_chances_missed",
    "saves",
    "goals_conceded",
    "xgot_faced",
    "defensive_contributions",
]


def _fetch_csv(url: str) -> list[dict[str, str]]:
    """Fetch a CSV file from a URL and return rows as dicts."""
    logger.info("Fetching %s", url)
    resp = httpx.get(url, timeout=30, follow_redirects=True)
    resp.raise_for_status()
    reader = csv.DictReader(io.StringIO(resp.text))
    return list(reader)


def _safe_float(value: str, default: float = 0.0) -> float:
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def _safe_int(value: str, default: int = 0) -> int:
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default


def _fetch_all_match_stats(max_gw: int = 38) -> list[dict[str, str]]:
    """Fetch playermatchstats.csv for all available gameweeks."""
    all_rows: list[dict[str, str]] = []

    for gw in range(1, max_gw + 1):
        url = f"{FPLCORE_BASE_URL}/By%20Gameweek/GW{gw}/playermatchstats.csv"
        try:
            rows = _fetch_csv(url)
            if rows:
                for row in rows:
                    row["_gw"] = str(gw)
                all_rows.extend(rows)
                logger.info("GW%d: %d player-match rows", gw, len(rows))
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.info("GW%d not available yet, stopping", gw)
                break
            raise

    return all_rows


def _aggregate_by_player(
    match_rows: list[dict[str, str]],
) -> dict[int, dict[str, Any]]:
    """Aggregate match-level stats into season totals per player_id."""
    aggregates: dict[int, dict[str, Any]] = {}

    for row in match_rows:
        pid = _safe_int(row.get("player_id", "0"))
        if pid == 0:
            continue

        if pid not in aggregates:
            aggregates[pid] = {
                "minutes": 0,
                "goals": 0,
                "assists": 0,
                "shots": 0,
                "xg": 0.0,
                "xa": 0.0,
                "xgot": 0.0,
                "chances_created": 0,
                "successful_dribbles": 0,
                "touches_opposition_box": 0,
                "recoveries": 0,
                "tackles_won": 0,
                "interceptions": 0,
                "blocks": 0,
                "clearances": 0,
                "duels_won": 0,
                "aerial_duels_won": 0,
                "big_chances_missed": 0,
                "saves": 0,
                "goals_conceded": 0,
                "xgot_faced": 0.0,
                "defensive_contributions": 0,
            }

        agg = aggregates[pid]
        agg["minutes"] += _safe_int(row.get("minutes_played", "0"))
        agg["goals"] += _safe_int(row.get("goals", "0"))
        agg["assists"] += _safe_int(row.get("assists", "0"))
        agg["shots"] += _safe_int(row.get("total_shots", "0"))
        agg["xg"] += _safe_float(row.get("xg", "0"))
        agg["xa"] += _safe_float(row.get("xa", "0"))
        agg["xgot"] += _safe_float(row.get("xgot", "0"))
        agg["chances_created"] += _safe_int(row.get("chances_created", "0"))
        agg["successful_dribbles"] += _safe_int(
            row.get("successful_dribbles", "0")
        )
        agg["touches_opposition_box"] += _safe_int(
            row.get("touches_opposition_box", "0")
        )
        agg["recoveries"] += _safe_int(row.get("recoveries", "0"))
        agg["tackles_won"] += _safe_int(row.get("tackles_won", "0"))
        agg["interceptions"] += _safe_int(row.get("interceptions", "0"))
        agg["blocks"] += _safe_int(row.get("blocks", "0"))
        agg["clearances"] += _safe_int(row.get("clearances", "0"))
        agg["duels_won"] += _safe_int(row.get("duels_won", "0"))
        agg["aerial_duels_won"] += _safe_int(row.get("aerial_duels_won", "0"))
        agg["big_chances_missed"] += _safe_int(
            row.get("big_chances_missed", "0")
        )
        agg["saves"] += _safe_int(row.get("saves", "0"))
        agg["goals_conceded"] += _safe_int(row.get("goals_conceded", "0"))
        agg["xgot_faced"] += _safe_float(row.get("xgot_faced", "0"))
        agg["defensive_contributions"] += _safe_int(
            row.get("defensive_contributions", "0")
        )

    return aggregates


def run() -> int:
    """Run the FPL-Core-Insights sync pipeline. Returns records processed."""
    logger.info("Starting FPL-Core-Insights sync...")

    # Build a map of FPL ID -> PocketBase record ID
    players_pb = get_all_players()
    fpl_id_map: dict[int, str] = {}
    for p in players_pb:
        fpl_id = getattr(p, "fpl_id", None)
        if fpl_id is not None:
            fpl_id_map[int(fpl_id)] = p.id

    logger.info("Loaded %d players from PocketBase", len(fpl_id_map))

    # Fetch and aggregate match stats
    match_rows = _fetch_all_match_stats()
    logger.info("Total match-stat rows fetched: %d", len(match_rows))

    aggregates = _aggregate_by_player(match_rows)
    logger.info("Aggregated stats for %d players", len(aggregates))

    # Upsert season aggregates (gw=0) into PocketBase
    count = 0
    for fpl_id, stats in aggregates.items():
        pb_record_id = fpl_id_map.get(fpl_id)
        if pb_record_id is None:
            continue

        # Compute CBIT from individual components
        cbit = (
            stats["tackles_won"]
            + stats["blocks"]
            + stats["interceptions"]
            + stats["clearances"]
        )

        # Compute goals_prevented = xGOT faced - goals conceded
        goals_prevented = stats["xgot_faced"] - stats["goals_conceded"]

        stat_data = {
            "cbit": cbit,
            "ball_recoveries": stats["recoveries"],
            "sca": stats["chances_created"],
            "progressive_carries": 0,  # Not available in this source
            "chances_created": stats["chances_created"],
            "successful_dribbles": stats["successful_dribbles"],
            "touches_opposition_box": stats["touches_opposition_box"],
            "recoveries": stats["recoveries"],
            "duels_won": stats["duels_won"],
            "aerial_duels_won": stats["aerial_duels_won"],
            "big_chances_missed": stats["big_chances_missed"],
            "goals_prevented": round(goals_prevented, 2),
            "defensive_contributions": stats["defensive_contributions"],
        }

        upsert_gameweek_stat(pb_record_id, 0, stat_data)
        count += 1

    logger.info("FPL-Core-Insights sync complete: %d records", count)
    return count
