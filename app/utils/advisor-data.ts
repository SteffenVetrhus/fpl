/**
 * AI Advisor data enrichment
 * Builds comprehensive context for the AI advisor by combining
 * squad data, rival analysis, form trends, and multi-GW planning
 */

import type {
  FPLElement,
  FPLFixture,
  FPLTeam,
  FPLPick,
  FPLManagerGameweek,
  FPLManagerHistory,
  FPLStandingsResult,
  FPLChip,
  FPLEvent,
} from "~/lib/fpl-api/types";

// ── Exported interfaces ──────────────────────────────────────────────

export interface SquadPlayer {
  name: string;
  team: string;
  position: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isOnBench: boolean;
  form: number;
  expectedPoints: number;
  fixtureDifficulty: number;
  opponent: string;
  fixtureRun: string[];
  avgFixtureDifficulty: number;
  status: string;
  chanceOfPlaying: number | null;
  cost: number;
  ownership: number;
  xGI: number;
  xGIPer90: number;
  pointsPerGame: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
}

export interface FormTrend {
  direction: "rising" | "falling" | "steady";
  last4Scores: number[];
  trend: string;
}

export interface ManagerFormTrend {
  managerName: string;
  teamName: string;
  overallRank: number;
  last5GWScores: number[];
  avgLast5: number;
  seasonAvg: number;
  trend: "rising" | "falling" | "steady";
  totalPoints: number;
  rankChange5GW: number;
}

export interface RivalSnapshot {
  managerName: string;
  teamName: string;
  totalPoints: number;
  pointsBehindLeader: number;
  pointsGap: number;
  last3GWAvg: number;
  trend: "rising" | "falling" | "steady";
  chipsRemaining: string[];
}

export interface TransferMarketInsight {
  mostTransferredIn: { name: string; team: string; netTransfers: number }[];
  mostTransferredOut: { name: string; team: string; netTransfers: number }[];
  priceRisers: { name: string; team: string; costChange: number }[];
  priceFallers: { name: string; team: string; costChange: number }[];
}

export interface SquadBalance {
  totalValue: number;
  bank: number;
  benchValue: number;
  startingValue: number;
  positionCounts: Record<string, number>;
  teamExposure: { team: string; count: number }[];
}

export interface AdvisorContext {
  managerName: string;
  teamName: string;
  nextGameweek: number;
  gameweeksRemaining: number;
  managerForm: ManagerFormTrend;
  squad: SquadPlayer[];
  squadBalance: SquadBalance;
  chipsAvailable: string[];
  chipWindows: string[];
  rivals: RivalSnapshot[];
  transferMarket: TransferMarketInsight;
  seasonPhase: "early" | "mid" | "late" | "endgame";
  deadlineTime: string | null;
}

// ── Position map ─────────────────────────────────────────────────────

const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

// ── Helper: fixture run for a team ───────────────────────────────────

function getFixtureRun(
  fixtures: FPLFixture[],
  teamId: number,
  teamMap: Map<number, FPLTeam>,
  fromGW: number,
  numGWs: number = 5
): { opponents: string[]; avgDifficulty: number; nextDifficulty: number } {
  const opponents: string[] = [];
  let totalDiff = 0;
  let count = 0;
  let nextDifficulty = 3;

  for (let gw = fromGW; gw < fromGW + numGWs; gw++) {
    const gwFixtures = fixtures.filter(
      (f) => f.event === gw && (f.team_h === teamId || f.team_a === teamId)
    );

    if (gwFixtures.length === 0) {
      opponents.push("BGW");
      totalDiff += 5;
      count++;
    } else {
      for (const fix of gwFixtures) {
        const isHome = fix.team_h === teamId;
        const oppId = isHome ? fix.team_a : fix.team_h;
        const opp = teamMap.get(oppId);
        const diff = isHome ? fix.team_h_difficulty : fix.team_a_difficulty;
        opponents.push(
          `${opp?.short_name ?? "???"}${isHome ? "(H)" : "(A)"}`
        );
        totalDiff += diff;
        count++;
        if (gw === fromGW && nextDifficulty === 3) {
          nextDifficulty = diff;
        }
      }
    }
  }

  return {
    opponents,
    avgDifficulty: count > 0 ? totalDiff / count : 3,
    nextDifficulty,
  };
}

// ── Build squad players with enriched data ───────────────────────────

/**
 * Build enriched squad player list from picks and bootstrap data
 */
export function buildSquadPlayers(
  picks: FPLPick[],
  elements: FPLElement[],
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  nextGW: number
): SquadPlayer[] {
  const playerMap = new Map(elements.map((p) => [p.id, p]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return picks.map((pick) => {
    const player = playerMap.get(pick.element)!;
    const team = teamMap.get(player.team);
    const run = getFixtureRun(fixtures, player.team, teamMap, nextGW, 5);

    const xgi = parseFloat(player.expected_goal_involvements) || 0;
    const xgiPer90 = player.minutes > 0 ? (xgi / player.minutes) * 90 : 0;

    return {
      name: player.web_name,
      team: team?.short_name ?? "???",
      position: POSITION_MAP[player.element_type] ?? "???",
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      isOnBench: pick.position > 11,
      form: parseFloat(player.form) || 0,
      expectedPoints: parseFloat(player.ep_next ?? "0"),
      fixtureDifficulty: run.nextDifficulty,
      opponent: run.opponents[0] ?? "???",
      fixtureRun: run.opponents,
      avgFixtureDifficulty: run.avgDifficulty,
      status: player.status,
      chanceOfPlaying: player.chance_of_playing_next_round,
      cost: player.now_cost / 10,
      ownership: parseFloat(player.selected_by_percent),
      xGI: xgi,
      xGIPer90: Math.round(xgiPer90 * 100) / 100,
      pointsPerGame: parseFloat(player.points_per_game) || 0,
      minutes: player.minutes,
      goals: player.goals_scored,
      assists: player.assists,
      cleanSheets: player.clean_sheets,
    };
  });
}

// ── Manager form trend ───────────────────────────────────────────────

/**
 * Compute form trend for the logged-in manager
 */
export function buildManagerForm(
  managerName: string,
  teamName: string,
  history: FPLManagerGameweek[],
  overallRank: number
): ManagerFormTrend {
  const sorted = [...history].sort((a, b) => b.event - a.event);
  const last5 = sorted.slice(0, 5);
  const last5Scores = last5.map((gw) => gw.points - gw.event_transfers_cost);

  const avgLast5 =
    last5Scores.length > 0
      ? last5Scores.reduce((s, v) => s + v, 0) / last5Scores.length
      : 0;

  const seasonAvg =
    history.length > 0
      ? history.reduce((s, gw) => s + gw.points - gw.event_transfers_cost, 0) /
        history.length
      : 0;

  const totalPoints =
    sorted.length > 0 ? sorted[0].total_points : 0;

  const rankChange5GW =
    last5.length >= 5
      ? last5[last5.length - 1].overall_rank - last5[0].overall_rank
      : 0;

  let trend: "rising" | "falling" | "steady" = "steady";
  if (avgLast5 > seasonAvg + 3) trend = "rising";
  else if (avgLast5 < seasonAvg - 3) trend = "falling";

  return {
    managerName,
    teamName,
    overallRank,
    last5GWScores: last5Scores.reverse(),
    avgLast5: Math.round(avgLast5 * 10) / 10,
    seasonAvg: Math.round(seasonAvg * 10) / 10,
    trend,
    totalPoints,
    rankChange5GW,
  };
}

// ── Rival analysis ───────────────────────────────────────────────────

/**
 * Build rival snapshots from league standings and their histories
 */
export function buildRivalSnapshots(
  standings: FPLStandingsResult[],
  rivalHistories: Map<number, FPLManagerGameweek[]>,
  rivalChips: Map<number, FPLChip[]>,
  myManagerId: number
): RivalSnapshot[] {
  const leaderPoints = standings.length > 0 ? standings[0].total : 0;
  const myStanding = standings.find((s) => s.entry === myManagerId);
  const myPoints = myStanding?.total ?? 0;

  return standings
    .filter((s) => s.entry !== myManagerId)
    .slice(0, 8)
    .map((rival) => {
      const history = rivalHistories.get(rival.entry) ?? [];
      const sorted = [...history].sort((a, b) => b.event - a.event);
      const last3 = sorted.slice(0, 3);
      const last3Avg =
        last3.length > 0
          ? last3.reduce(
              (s, gw) => s + gw.points - gw.event_transfers_cost,
              0
            ) / last3.length
          : 0;

      const seasonAvg =
        history.length > 0
          ? history.reduce(
              (s, gw) => s + gw.points - gw.event_transfers_cost,
              0
            ) / history.length
          : 0;

      let trend: "rising" | "falling" | "steady" = "steady";
      if (last3Avg > seasonAvg + 3) trend = "rising";
      else if (last3Avg < seasonAvg - 3) trend = "falling";

      const chips = rivalChips.get(rival.entry) ?? [];
      const usedChipNames = new Set(chips.map((c) => c.name));
      const ALL_CHIPS = ["wildcard", "3xc", "bboost", "freehit"];
      const CHIP_LABELS: Record<string, string> = {
        wildcard: "Wildcard",
        "3xc": "Triple Captain",
        bboost: "Bench Boost",
        freehit: "Free Hit",
      };
      const chipsRemaining = ALL_CHIPS.filter(
        (c) => !usedChipNames.has(c)
      ).map((c) => CHIP_LABELS[c]);

      return {
        managerName: rival.player_name,
        teamName: rival.entry_name,
        totalPoints: rival.total,
        pointsBehindLeader: leaderPoints - rival.total,
        pointsGap: rival.total - myPoints,
        last3GWAvg: Math.round(last3Avg * 10) / 10,
        trend,
        chipsRemaining,
      };
    });
}

// ── Transfer market momentum ─────────────────────────────────────────

/**
 * Get trending transfers and price changes
 */
export function buildTransferMarketInsights(
  elements: FPLElement[],
  teams: FPLTeam[]
): TransferMarketInsight {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const withNet = elements
    .filter((p) => p.status === "a" && p.minutes > 90)
    .map((p) => ({
      name: p.web_name,
      team: teamMap.get(p.team)?.short_name ?? "???",
      netTransfers: p.transfers_in_event - p.transfers_out_event,
      costChange: p.cost_change_event,
    }));

  const sorted = [...withNet].sort(
    (a, b) => b.netTransfers - a.netTransfers
  );

  return {
    mostTransferredIn: sorted.slice(0, 5).map(({ name, team, netTransfers }) => ({
      name,
      team,
      netTransfers,
    })),
    mostTransferredOut: sorted
      .slice(-5)
      .reverse()
      .map(({ name, team, netTransfers }) => ({
        name,
        team,
        netTransfers,
      })),
    priceRisers: withNet
      .filter((p) => p.costChange > 0)
      .sort((a, b) => b.costChange - a.costChange)
      .slice(0, 5)
      .map(({ name, team, costChange }) => ({
        name,
        team,
        costChange: costChange / 10,
      })),
    priceFallers: withNet
      .filter((p) => p.costChange < 0)
      .sort((a, b) => a.costChange - b.costChange)
      .slice(0, 5)
      .map(({ name, team, costChange }) => ({
        name,
        team,
        costChange: costChange / 10,
      })),
  };
}

// ── Squad balance analysis ───────────────────────────────────────────

/**
 * Analyze squad value distribution and team exposure
 */
export function buildSquadBalance(
  squad: SquadPlayer[],
  bank: number
): SquadBalance {
  const starting = squad.filter((p) => !p.isOnBench);
  const bench = squad.filter((p) => p.isOnBench);

  const positionCounts: Record<string, number> = {};
  const teamCounts: Record<string, number> = {};

  for (const p of squad) {
    positionCounts[p.position] = (positionCounts[p.position] ?? 0) + 1;
    teamCounts[p.team] = (teamCounts[p.team] ?? 0) + 1;
  }

  const teamExposure = Object.entries(teamCounts)
    .map(([team, count]) => ({ team, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalValue:
      Math.round(
        (squad.reduce((s, p) => s + p.cost, 0) + bank / 10) * 10
      ) / 10,
    bank: bank / 10,
    benchValue:
      Math.round(bench.reduce((s, p) => s + p.cost, 0) * 10) / 10,
    startingValue:
      Math.round(starting.reduce((s, p) => s + p.cost, 0) * 10) / 10,
    positionCounts,
    teamExposure,
  };
}

// ── Season phase ─────────────────────────────────────────────────────

/**
 * Determine season phase for strategic context
 */
export function getSeasonPhase(
  currentGW: number,
  totalGWs: number
): "early" | "mid" | "late" | "endgame" {
  const progress = currentGW / totalGWs;
  if (progress < 0.2) return "early";
  if (progress < 0.55) return "mid";
  if (progress < 0.82) return "late";
  return "endgame";
}

// ── Chip window summary ──────────────────────────────────────────────

/**
 * Summarize upcoming chip-worthy gameweeks
 */
export function summarizeChipWindows(
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  events: FPLEvent[],
  nextGW: number
): string[] {
  const summaries: string[] = [];
  const totalGWs = events.length;
  const maxScan = Math.min(nextGW + 8, totalGWs);

  for (let gw = nextGW; gw <= maxScan; gw++) {
    const dgwTeams: string[] = [];
    const bgwTeams: string[] = [];

    for (const team of teams) {
      const count = fixtures.filter(
        (f) =>
          f.event === gw && (f.team_h === team.id || f.team_a === team.id)
      ).length;
      if (count > 1) dgwTeams.push(team.short_name);
      else if (count === 0) bgwTeams.push(team.short_name);
    }

    if (dgwTeams.length > 0) {
      summaries.push(
        `GW${gw}: DGW for ${dgwTeams.join(", ")} (${dgwTeams.length} teams) — TC/BB candidate`
      );
    }
    if (bgwTeams.length >= 4) {
      summaries.push(
        `GW${gw}: BGW for ${bgwTeams.join(", ")} (${bgwTeams.length} teams) — Free Hit candidate`
      );
    }
  }

  return summaries;
}
