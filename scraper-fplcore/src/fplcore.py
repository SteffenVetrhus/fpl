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

    last_gw = 0
    for gw in range(1, max_gw + 1):
        url = f"{FPLCORE_BASE_URL}/By%20Gameweek/GW{gw}/playermatchstats.csv"
        try:
            rows = _fetch_csv(url)
            if rows:
                for row in rows:
                    row["_gw"] = str(gw)
                all_rows.extend(rows)
                last_gw = gw
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                break
            raise

    if last_gw:
        logger.info("Fetched GW1-%d: %d match rows", last_gw, len(all_rows))

    return all_rows


def _extract_stat_fields(row: dict[str, str]) -> dict[str, Any]:
    """Extract all stat fields from a single CSV row."""
    tackles_won = _safe_int(row.get("tackles_won", "0"))
    interceptions = _safe_int(row.get("interceptions", "0"))
    blocks = _safe_int(row.get("blocks", "0"))
    clearances = _safe_int(row.get("clearances", "0"))
    xgot_faced = _safe_float(row.get("xgot_faced", "0"))
    goals_conceded = _safe_int(row.get("goals_conceded", "0"))

    return {
        "minutes": _safe_int(row.get("minutes_played", "0")),
        "goals": _safe_int(row.get("goals", "0")),
        "assists": _safe_int(row.get("assists", "0")),
        "shots": _safe_int(row.get("total_shots", "0")),
        "xg": round(_safe_float(row.get("xg", "0")), 2),
        "xa": round(_safe_float(row.get("xa", "0")), 2),
        "xgot": round(_safe_float(row.get("xgot", "0")), 2),
        "chances_created": _safe_int(row.get("chances_created", "0")),
        "successful_dribbles": _safe_int(row.get("successful_dribbles", "0")),
        "touches_opposition_box": _safe_int(row.get("touches_opposition_box", "0")),
        "recoveries": _safe_int(row.get("recoveries", "0")),
        "tackles_won": tackles_won,
        "interceptions": interceptions,
        "blocks": blocks,
        "clearances": clearances,
        "duels_won": _safe_int(row.get("duels_won", "0")),
        "aerial_duels_won": _safe_int(row.get("aerial_duels_won", "0")),
        "big_chances_missed": _safe_int(row.get("big_chances_missed", "0")),
        "saves": _safe_int(row.get("saves", "0")),
        "goals_conceded": goals_conceded,
        "xgot_faced": round(xgot_faced, 2),
        "defensive_contributions": _safe_int(row.get("defensive_contributions", "0")),
        # Computed fields
        "cbit": tackles_won + blocks + interceptions + clearances,
        "goals_prevented": round(xgot_faced - goals_conceded, 2),
        "ball_recoveries": _safe_int(row.get("recoveries", "0")),
        "sca": _safe_int(row.get("chances_created", "0")),
    }


def _aggregate_by_player_and_gw(
    match_rows: list[dict[str, str]],
) -> dict[tuple[int, int], dict[str, Any]]:
    """Aggregate match-level stats per (player_id, gameweek).

    A player may have multiple match rows in the same GW (e.g. double
    gameweeks), so we sum them.
    """
    aggregates: dict[tuple[int, int], dict[str, Any]] = {}

    for row in match_rows:
        pid = _safe_int(row.get("player_id", "0"))
        gw = _safe_int(row.get("_gw", "0"))
        if pid == 0 or gw == 0:
            continue

        key = (pid, gw)
        fields = _extract_stat_fields(row)

        if key not in aggregates:
            aggregates[key] = fields
        else:
            agg = aggregates[key]
            for field, value in fields.items():
                agg[field] = agg[field] + value

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

    # Fetch and aggregate match stats per (player, gameweek)
    match_rows = _fetch_all_match_stats()
    logger.info("Fetched %d match-stat rows", len(match_rows))

    per_gw = _aggregate_by_player_and_gw(match_rows)
    unique_players = len({pid for pid, _ in per_gw})
    unique_gws = len({gw for _, gw in per_gw})
    logger.info(
        "Aggregated: %d players x %d gameweeks = %d records",
        unique_players, unique_gws, len(per_gw),
    )

    # Upsert per-gameweek records into PocketBase
    count = 0
    skipped = 0
    for (fpl_id, gw), stats in per_gw.items():
        pb_record_id = fpl_id_map.get(fpl_id)
        if pb_record_id is None:
            skipped += 1
            continue

        upsert_gameweek_stat(pb_record_id, gw, stats)
        count += 1

    if skipped:
        logger.info("Skipped %d records (player not in PocketBase)", skipped)
    logger.info("Sync complete: %d records upserted", count)
    return count
