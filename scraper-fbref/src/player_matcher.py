"""Player ID matching across FPL and FBRef.

Uses exact name matching first, then fuzzy matching constrained by team.
Stores resolved IDs in the PocketBase ``players`` collection for future
lookups so matching only needs to happen once per player.
"""

from __future__ import annotations

import logging
from typing import Any

from rapidfuzz import fuzz

from src.pb_client import get_all_players, get_client

logger = logging.getLogger(__name__)

MANUAL_OVERRIDES: dict[tuple[str, str], str] = {
    ("fbref", "Heung-Min Son"): "Son",
    ("fbref", "Bruno Fernandes"): "Bruno Fernandes",
}

TEAM_ALIASES: dict[str, list[str]] = {
    "ARS": ["Arsenal"],
    "AVL": ["Aston Villa"],
    "BOU": ["Bournemouth", "AFC Bournemouth"],
    "BRE": ["Brentford"],
    "BHA": ["Brighton", "Brighton and Hove Albion"],
    "CHE": ["Chelsea"],
    "CRY": ["Crystal Palace"],
    "EVE": ["Everton"],
    "FUL": ["Fulham"],
    "IPS": ["Ipswich", "Ipswich Town"],
    "LEI": ["Leicester", "Leicester City"],
    "LIV": ["Liverpool"],
    "MCI": ["Manchester City"],
    "MUN": ["Manchester United"],
    "NEW": ["Newcastle", "Newcastle United"],
    "NFO": ["Nottingham Forest", "Nott'ham Forest"],
    "SOU": ["Southampton"],
    "TOT": ["Tottenham", "Tottenham Hotspur", "Spurs"],
    "WHU": ["West Ham", "West Ham United"],
    "WOL": ["Wolverhampton Wanderers", "Wolves"],
}

_TEAM_REVERSE: dict[str, str] = {}
for short, aliases in TEAM_ALIASES.items():
    for alias in aliases:
        _TEAM_REVERSE[alias.lower()] = short


def normalize_team(team_name: str) -> str:
    """Convert an external team name to the FPL short code."""
    return _TEAM_REVERSE.get(team_name.lower(), team_name)


def match_player(
    source: str,
    external_name: str,
    external_team: str,
    players: list[Any] | None = None,
) -> Any | None:
    """Match an external player name to a PocketBase player record."""
    override = MANUAL_OVERRIDES.get((source, external_name))

    if players is None:
        players = get_all_players()

    fpl_team = normalize_team(external_team)
    search_name = override or external_name

    for p in players:
        if p.name == search_name and p.team == fpl_team:
            return p

    for p in players:
        full_name = getattr(p, "full_name", "") or ""
        if full_name.lower() == external_name.lower() and p.team == fpl_team:
            return p

    best_score = 0
    best_match = None
    for p in players:
        if p.team != fpl_team:
            continue
        full_name = getattr(p, "full_name", "") or ""
        score = max(
            fuzz.ratio(external_name.lower(), p.name.lower()),
            fuzz.ratio(external_name.lower(), full_name.lower()),
            fuzz.partial_ratio(external_name.lower(), full_name.lower()),
        )
        if score > best_score:
            best_score = score
            best_match = p

    if best_match and best_score >= 85:
        logger.info(
            "Fuzzy matched '%s' → '%s' (score=%d, team=%s)",
            external_name, best_match.name, best_score, fpl_team,
        )
        return best_match

    logger.warning(
        "No match for '%s' (%s) from %s", external_name, external_team, source,
    )
    return None


def update_player_external_id(
    player_record: Any, source: str, external_id: str | int,
) -> None:
    """Store the external ID on the player record for future direct lookups."""
    pb = get_client()
    field = f"{source}_id"
    current_value = getattr(player_record, field, None)
    if current_value is None or str(current_value) != str(external_id):
        pb.collection("players").update(player_record.id, {field: external_id})
        logger.info(
            "Updated %s.%s = %s", player_record.name, field, external_id,
        )
