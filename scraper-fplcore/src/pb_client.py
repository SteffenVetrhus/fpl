"""PocketBase client helpers for upserting stat-corner data."""

from __future__ import annotations

import logging
import re
from typing import Any

from pocketbase import PocketBase
from pocketbase.utils import ClientResponseError

from src.config import PB_URL, PB_USER, PB_PASS

logger = logging.getLogger(__name__)

_SAFE_STRING_RE = re.compile(r"^[a-zA-Z0-9_\-@.]+$")


def _safe_int(value: object) -> int:
    """Validate and return an integer safe for PocketBase filter interpolation."""
    n = int(value)  # type: ignore[arg-type]
    return n


def _safe_str(value: object) -> str:
    """Validate and return a string safe for PocketBase filter interpolation."""
    s = str(value)
    if not s or not _SAFE_STRING_RE.match(s):
        raise ValueError(f"Invalid string filter value: {s}")
    return s


_client: PocketBase | None = None


def get_client() -> PocketBase:
    """Return an authenticated PocketBase client (singleton)."""
    global _client
    if _client is None:
        _client = PocketBase(PB_URL)
        _client.admins.auth_with_password(PB_USER, PB_PASS)
    return _client


def upsert_gameweek_stat(player_record_id: str, gw: int, data: dict[str, Any]) -> str:
    """Create or update a gameweek stat record. Returns the record ID."""
    pb = get_client()

    try:
        existing = pb.collection("gameweek_stats").get_first_list_item(
            f'player = "{_safe_str(player_record_id)}" && gw = {_safe_int(gw)}'
        )
        record = pb.collection("gameweek_stats").update(existing.id, {
            "player": player_record_id,
            "gw": gw,
            **data,
        })
        return record.id
    except ClientResponseError:
        record = pb.collection("gameweek_stats").create({
            "player": player_record_id,
            "gw": gw,
            **data,
        })
        return record.id


def log_sync(
    service: str,
    status: str,
    records_processed: int,
    duration_seconds: float,
    error_message: str = "",
) -> None:
    """Log a sync run to the sync_log collection."""
    pb = get_client()
    pb.collection("sync_log").create({
        "service": service,
        "status": status,
        "records_processed": records_processed,
        "duration_seconds": round(duration_seconds, 2),
        "error_message": error_message,
    })


def get_all_players() -> list[Any]:
    """Return all player records from PocketBase."""
    pb = get_client()
    page = 1
    all_records: list[Any] = []
    while True:
        result = pb.collection("players").get_list(page, 200)
        all_records.extend(result.items)
        if page >= result.total_pages:
            break
        page += 1
    return all_records


def get_player_by_fpl_id(fpl_id: int) -> Any | None:
    """Find a player record by FPL element ID."""
    pb = get_client()
    try:
        return pb.collection("players").get_first_list_item(f"fpl_id = {_safe_int(fpl_id)}")
    except ClientResponseError:
        return None
