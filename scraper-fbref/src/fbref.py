"""FBRef / Opta advanced metrics parser.

Reads locally saved FBRef HTML pages and extracts progressive carries,
shot-creating actions (SCA), and ball recoveries.

Workflow:
1. Open the 3 FBRef stat pages in your browser
2. Save each as HTML (Ctrl+S) into the data/ directory
3. Run the scraper — it reads the local files and syncs to PocketBase
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from bs4 import BeautifulSoup

from src.pb_client import get_all_players, upsert_gameweek_stat
from src.player_matcher import match_player, update_player_external_id

logger = logging.getLogger(__name__)

DATA_DIR = Path(os.getenv("FBREF_DATA_DIR", "/app/data"))

# Expected filenames in DATA_DIR.
POSSESSION_FILE = "possession.html"
GCA_FILE = "gca.html"
DEFENSE_FILE = "defense.html"


def _read_html(filename: str) -> str:
    """Read an HTML file from the data directory."""
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path} — save the FBRef page as HTML and place it "
            f"in {DATA_DIR}/. Expected files: {POSSESSION_FILE}, "
            f"{GCA_FILE}, {DEFENSE_FILE}"
        )
    logger.info("Reading %s (%d KB)", path, path.stat().st_size // 1024)
    return path.read_text(encoding="utf-8", errors="replace")


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


def run() -> int:
    """Run the FBRef sync pipeline. Returns records processed."""
    logger.info("Starting FBRef sync (local HTML mode)...")
    logger.info("Reading HTML files from %s", DATA_DIR)

    players_pb = get_all_players()
    count = 0

    possession_html = _read_html(POSSESSION_FILE)
    gca_html = _read_html(GCA_FILE)
    defense_html = _read_html(DEFENSE_FILE)

    player_stats: dict[str, dict] = {}

    for row in _parse_stat_table(possession_html, "stats_possession"):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "progressive_carries": _safe_int(row.get("progressive_carries", "0")),
        })

    for row in _parse_stat_table(gca_html, "stats_gca"):
        key = f"{row.get('player', '')}|{row.get('team', '')}"
        player_stats.setdefault(key, {}).update({
            "player_name": row.get("player", ""),
            "team": row.get("team", ""),
            "fbref_id": row.get("fbref_id", ""),
            "sca": _safe_int(row.get("sca", "0")),
        })

    for row in _parse_stat_table(defense_html, "stats_defense"):
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
