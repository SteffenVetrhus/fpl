/**
 * Rival analysis utilities
 * Compare two managers' teams to find differentials and exploit weaknesses
 */

import type { FPLElement, FPLFixture, FPLTeam, FPLPick } from "~/lib/fpl-api/types";

export interface RivalPlayer {
  id: number;
  webName: string;
  teamShort: string;
  position: string;
  cost: number;
  form: number;
  expectedPoints: number;
  upcomingDifficulty: number;
  isCaptain: boolean;
  isOnBench: boolean;
  status: string;
  chanceOfPlaying: number | null;
}

export interface RivalComparison {
  shared: RivalPlayer[];
  onlyYours: RivalPlayer[];
  onlyTheirs: RivalPlayer[];
  yourCaptain: RivalPlayer | null;
  theirCaptain: RivalPlayer | null;
  exploitOpportunities: ExploitOpportunity[];
  teamValueDiff: number;
}

export interface ExploitOpportunity {
  player: RivalPlayer;
  reason: string;
  severity: "high" | "medium" | "low";
}

const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

/**
 * Build a RivalPlayer from a pick and player data
 */
function buildRivalPlayer(
  pick: FPLPick,
  player: FPLElement,
  teams: Map<number, FPLTeam>,
  fixtures: FPLFixture[],
  nextGW: number
): RivalPlayer {
  const team = teams.get(player.team);

  // Calculate upcoming difficulty
  const gwFixtures = fixtures.filter(
    (f) => f.event === nextGW && (f.team_h === player.team || f.team_a === player.team)
  );
  let difficulty = 3;
  if (gwFixtures.length > 0) {
    const fix = gwFixtures[0];
    const isHome = fix.team_h === player.team;
    difficulty = isHome ? fix.team_h_difficulty : fix.team_a_difficulty;
  }

  return {
    id: player.id,
    webName: player.web_name,
    teamShort: team?.short_name ?? "???",
    position: POSITION_MAP[player.element_type] ?? "???",
    cost: player.now_cost / 10,
    form: parseFloat(player.form) || 0,
    expectedPoints: parseFloat(player.ep_next ?? "0"),
    upcomingDifficulty: difficulty,
    isCaptain: pick.is_captain,
    isOnBench: pick.position > 11,
    status: player.status,
    chanceOfPlaying: player.chance_of_playing_next_round,
  };
}

/**
 * Compare two managers' teams
 *
 * @param yourPicks - Your gameweek picks
 * @param theirPicks - Rival's gameweek picks
 * @param allPlayers - All players from bootstrap
 * @param fixtures - All fixtures
 * @param teams - All teams
 * @param nextGW - Next gameweek number
 * @returns Detailed comparison
 */
export function compareTeams(
  yourPicks: FPLPick[],
  theirPicks: FPLPick[],
  allPlayers: FPLElement[],
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  nextGW: number
): RivalComparison {
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const yourPlayerIds = new Set(yourPicks.map((p) => p.element));
  const theirPlayerIds = new Set(theirPicks.map((p) => p.element));

  const shared: RivalPlayer[] = [];
  const onlyYours: RivalPlayer[] = [];
  const onlyTheirs: RivalPlayer[] = [];
  let yourCaptain: RivalPlayer | null = null;
  let theirCaptain: RivalPlayer | null = null;

  // Process your picks
  for (const pick of yourPicks) {
    const player = playerMap.get(pick.element);
    if (!player) continue;

    const rp = buildRivalPlayer(pick, player, teamMap, fixtures, nextGW);

    if (pick.is_captain) yourCaptain = rp;

    if (theirPlayerIds.has(pick.element)) {
      shared.push(rp);
    } else {
      onlyYours.push(rp);
    }
  }

  // Process their picks
  for (const pick of theirPicks) {
    const player = playerMap.get(pick.element);
    if (!player) continue;

    const rp = buildRivalPlayer(pick, player, teamMap, fixtures, nextGW);

    if (pick.is_captain) theirCaptain = rp;

    if (!yourPlayerIds.has(pick.element)) {
      onlyTheirs.push(rp);
    }
  }

  // Find exploit opportunities — weaknesses in rival's team
  const exploitOpportunities: ExploitOpportunity[] = [];

  for (const pick of theirPicks) {
    if (pick.position > 11) continue; // Skip their bench

    const player = playerMap.get(pick.element);
    if (!player) continue;

    const rp = buildRivalPlayer(pick, player, teamMap, fixtures, nextGW);

    if (player.status === "i" || player.status === "u") {
      exploitOpportunities.push({
        player: rp,
        reason: `${rp.webName} is ${player.status === "i" ? "injured" : "unavailable"}`,
        severity: "high",
      });
    } else if (player.status === "d") {
      exploitOpportunities.push({
        player: rp,
        reason: `${rp.webName} is doubtful`,
        severity: "medium",
      });
    }

    if (rp.form < 2 && !rp.isOnBench) {
      exploitOpportunities.push({
        player: rp,
        reason: `${rp.webName} has terrible form (${rp.form})`,
        severity: "medium",
      });
    }

    if (rp.upcomingDifficulty >= 4 && !rp.isOnBench) {
      exploitOpportunities.push({
        player: rp,
        reason: `${rp.webName} faces tough fixture (FDR ${rp.upcomingDifficulty})`,
        severity: "low",
      });
    }
  }

  // Calculate total team value diff
  const yourValue = yourPicks.reduce((sum, pick) => {
    const p = playerMap.get(pick.element);
    return sum + (p?.now_cost ?? 0);
  }, 0);
  const theirValue = theirPicks.reduce((sum, pick) => {
    const p = playerMap.get(pick.element);
    return sum + (p?.now_cost ?? 0);
  }, 0);

  return {
    shared,
    onlyYours,
    onlyTheirs,
    yourCaptain,
    theirCaptain,
    exploitOpportunities: exploitOpportunities.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    teamValueDiff: (yourValue - theirValue) / 10,
  };
}

/**
 * Get all player IDs owned by any manager in the league
 */
export function getLeagueOwnedPlayerIds(
  allPicks: FPLPick[][]
): Set<number> {
  const ids = new Set<number>();
  for (const picks of allPicks) {
    for (const pick of picks) {
      ids.add(pick.element);
    }
  }
  return ids;
}
