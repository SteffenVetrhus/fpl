/**
 * Transfer recommendation algorithm
 * Identifies sell candidates and suggests replacements
 */

import type {
  FPLElement,
  FPLFixture,
  FPLTeam,
  FPLPick,
} from "~/lib/fpl-api/types";

export interface SellCandidate {
  player: PlayerSummary;
  reasons: string[];
  urgency: "high" | "medium" | "low";
  sellScore: number;
}

export interface BuyCandidate {
  player: PlayerSummary;
  transferScore: number;
  reasons: string[];
  fixtureRun: string[];
  pointsProjection: number;
}

export interface PlayerSummary {
  id: number;
  webName: string;
  teamShort: string;
  position: string;
  cost: number;
  form: number;
  ownership: number;
  expectedPoints: number;
  xGI: number;
  status: string;
  chanceOfPlaying: number | null;
}

export interface TransferSuggestion {
  out: PlayerSummary;
  in: BuyCandidate;
  netCost: number;
  pointsGain: number;
}

const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

/**
 * Convert FPLElement to PlayerSummary
 */
function toPlayerSummary(player: FPLElement, teams: Map<number, FPLTeam>): PlayerSummary {
  return {
    id: player.id,
    webName: player.web_name,
    teamShort: teams.get(player.team)?.short_name ?? "???",
    position: POSITION_MAP[player.element_type] ?? "???",
    cost: player.now_cost / 10,
    form: parseFloat(player.form) || 0,
    ownership: parseFloat(player.selected_by_percent),
    expectedPoints: parseFloat(player.ep_next ?? "0"),
    xGI: parseFloat(player.expected_goal_involvements) || 0,
    status: player.status,
    chanceOfPlaying: player.chance_of_playing_next_round,
  };
}

/**
 * Get fixture difficulty for a team over the next N gameweeks
 */
function getFixtureDifficulty(
  fixtures: FPLFixture[],
  teamId: number,
  teams: Map<number, FPLTeam>,
  fromGW: number,
  numGWs: number = 4
): { avgDifficulty: number; fixtures: string[] } {
  const upcoming: string[] = [];
  let totalDiff = 0;
  let count = 0;

  for (let gw = fromGW; gw < fromGW + numGWs; gw++) {
    const gwFixtures = fixtures.filter(
      (f) => f.event === gw && (f.team_h === teamId || f.team_a === teamId)
    );

    if (gwFixtures.length === 0) {
      upcoming.push("BGW");
      totalDiff += 5; // Blank = worst
      count++;
    } else {
      for (const fix of gwFixtures) {
        const isHome = fix.team_h === teamId;
        const oppId = isHome ? fix.team_a : fix.team_h;
        const opp = teams.get(oppId);
        const diff = isHome ? fix.team_h_difficulty : fix.team_a_difficulty;
        upcoming.push(`${opp?.short_name ?? "???"}${isHome ? "(H)" : "(A)"}`);
        totalDiff += diff;
        count++;
      }
    }
  }

  return {
    avgDifficulty: count > 0 ? totalDiff / count : 3,
    fixtures: upcoming,
  };
}

/**
 * Identify players in the current team that should be sold
 */
export function identifySellCandidates(
  picks: FPLPick[],
  allPlayers: FPLElement[],
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  nextGW: number
): SellCandidate[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  const candidates: SellCandidate[] = [];

  for (const pick of picks) {
    const player = playerMap.get(pick.element);
    if (!player) continue;

    const reasons: string[] = [];
    let sellScore = 0;

    // Bad form
    const form = parseFloat(player.form) || 0;
    if (form < 3) {
      reasons.push(`Poor form (${form})`);
      sellScore += (3 - form) * 2;
    }

    // Tough upcoming fixtures
    const fixData = getFixtureDifficulty(fixtures, player.team, teamMap, nextGW);
    if (fixData.avgDifficulty >= 3.5) {
      reasons.push(`Tough fixtures: ${fixData.fixtures.join(", ")}`);
      sellScore += (fixData.avgDifficulty - 3) * 3;
    }

    // Injury/doubt
    if (player.status === "d") {
      reasons.push("Doubtful");
      sellScore += 3;
    } else if (player.status === "i") {
      reasons.push("Injured");
      sellScore += 8;
    } else if (player.status === "u") {
      reasons.push("Unavailable");
      sellScore += 10;
    }

    // Low expected points
    const epNext = parseFloat(player.ep_next ?? "0");
    if (epNext < 2) {
      reasons.push(`Low expected pts (${epNext.toFixed(1)})`);
      sellScore += (2 - epNext) * 2;
    }

    // Price falling
    if (player.cost_change_event < 0) {
      reasons.push("Price dropping");
      sellScore += 2;
    }

    if (reasons.length === 0) continue;

    const urgency: SellCandidate["urgency"] =
      sellScore >= 8 ? "high" : sellScore >= 4 ? "medium" : "low";

    candidates.push({
      player: toPlayerSummary(player, teamMap),
      reasons,
      urgency,
      sellScore,
    });
  }

  return candidates.sort((a, b) => b.sellScore - a.sellScore);
}

/**
 * Find the best replacement players for a given position and budget
 */
export function findReplacements(
  position: number,
  maxCost: number,
  currentTeamPlayerIds: Set<number>,
  allPlayers: FPLElement[],
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  nextGW: number,
  limit: number = 5
): BuyCandidate[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const candidates: BuyCandidate[] = [];

  for (const player of allPlayers) {
    if (player.element_type !== position) continue;
    if (player.now_cost / 10 > maxCost) continue;
    if (currentTeamPlayerIds.has(player.id)) continue;
    if (player.status !== "a") continue;
    if (player.minutes < 90) continue;

    const form = parseFloat(player.form) || 0;
    const fixData = getFixtureDifficulty(fixtures, player.team, teamMap, nextGW);
    const epNext = parseFloat(player.ep_next ?? "0");
    const xgi = parseFloat(player.expected_goal_involvements) || 0;
    const valueForm = parseFloat(player.value_form) || 0;

    // Composite transfer score
    const fixtureScore = Math.max(0, (5 - fixData.avgDifficulty) * 2);
    const transferScore =
      form * 0.25 +
      fixtureScore * 0.25 +
      epNext * 0.20 +
      valueForm * 0.15 +
      (xgi / Math.max(player.minutes, 1)) * 90 * 5 * 0.15;

    const reasons: string[] = [];
    if (form >= 5) reasons.push(`Great form (${form})`);
    if (fixData.avgDifficulty <= 2.5) reasons.push("Easy fixture run");
    if (epNext >= 4) reasons.push(`High expected pts (${epNext.toFixed(1)})`);
    if (valueForm >= 1) reasons.push(`Value pick (${valueForm})`);
    if (player.cost_change_event > 0) reasons.push("Price rising");

    candidates.push({
      player: toPlayerSummary(player, teamMap),
      transferScore,
      reasons,
      fixtureRun: fixData.fixtures,
      pointsProjection: epNext * 4,
    });
  }

  return candidates
    .sort((a, b) => b.transferScore - a.transferScore)
    .slice(0, limit);
}

/**
 * Generate transfer swap suggestions
 */
export function suggestTransfers(
  picks: FPLPick[],
  bank: number,
  allPlayers: FPLElement[],
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  nextGW: number,
  limit: number = 5
): TransferSuggestion[] {
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const currentTeamIds = new Set(picks.map((p) => p.element));

  const sellCandidates = identifySellCandidates(
    picks, allPlayers, fixtures, teams, nextGW
  );

  const suggestions: TransferSuggestion[] = [];

  for (const sell of sellCandidates.slice(0, 3)) {
    const player = playerMap.get(sell.player.id);
    if (!player) continue;

    const budget = player.now_cost / 10 + bank / 10;
    const replacements = findReplacements(
      player.element_type,
      budget,
      currentTeamIds,
      allPlayers,
      fixtures,
      teams,
      nextGW,
      3
    );

    for (const buy of replacements) {
      suggestions.push({
        out: sell.player,
        in: buy,
        netCost: buy.player.cost - sell.player.cost,
        pointsGain: buy.pointsProjection - (sell.player.expectedPoints * 4),
      });
    }
  }

  return suggestions
    .sort((a, b) => b.pointsGain - a.pointsGain)
    .slice(0, limit);
}
