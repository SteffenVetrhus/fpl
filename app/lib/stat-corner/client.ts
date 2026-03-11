/**
 * Server-side PocketBase client for reading Stat Corner data.
 *
 * All functions run in route loaders — never on the client.
 * Uses the same PocketBase instance as auth but queries the stat collections.
 */

import PocketBase from "pocketbase";
import { getEnvConfig } from "~/config/env";
import type {
  GameweekStat,
  PlayerRecord,
  PlayerStatSummary,
  PriceSnapshot,
  StatMetric,
  SyncLogEntry,
} from "./types";

const PB_AUTH_COOKIE = "pb_auth";

/** Default timeout for PocketBase requests (30 seconds) */
const PB_TIMEOUT_MS = 30_000;

function createStatClient(request: Request): PocketBase {
  const config = getEnvConfig();
  const pb = new PocketBase(config.pocketbaseUrl);
  const cookieHeader = request.headers.get("cookie") || "";
  pb.authStore.loadFromCookie(cookieHeader, PB_AUTH_COOKIE);
  return pb;
}

/** Wrap a promise with a timeout to prevent hanging PocketBase requests */
async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`PocketBase request timed out after ${PB_TIMEOUT_MS}ms: ${label}`)),
      PB_TIMEOUT_MS
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Fetch advanced stats for a single player, optionally filtered by gameweek.
 * Uses relation filter to avoid a sequential player lookup query.
 */
export async function fetchPlayerStats(
  request: Request,
  fplId: number,
  gw?: number,
): Promise<GameweekStat[]> {
  const pb = createStatClient(request);

  let filter = `player.fpl_id = ${fplId}`;
  if (gw !== undefined) {
    filter += ` && gw = ${gw}`;
  }

  return withTimeout(
    pb.collection("gameweek_stats").getFullList<GameweekStat>({ filter, sort: "gw" }),
    `fetchPlayerStats(fplId=${fplId})`
  );
}

/**
 * Fetch all player stats for a given gameweek.
 */
export async function fetchAllPlayerStats(
  request: Request,
  gw: number,
): Promise<(GameweekStat & { expand?: { player: PlayerRecord } })[]> {
  const pb = createStatClient(request);
  return withTimeout(
    pb.collection("gameweek_stats")
      .getFullList<GameweekStat & { expand?: { player: PlayerRecord } }>({
        filter: `gw = ${gw}`,
        expand: "player",
        sort: "-fpl_points",
      }),
    `fetchAllPlayerStats(gw=${gw})`
  );
}

/**
 * Fetch price history for a player over the last N days.
 * Uses relation filter to avoid a sequential player lookup query.
 */
export async function fetchPriceHistory(
  request: Request,
  fplId: number,
  days: number = 30,
): Promise<PriceSnapshot[]> {
  const pb = createStatClient(request);

  const since = new Date();
  since.setDate(since.getDate() - days);

  return withTimeout(
    pb.collection("price_history")
      .getFullList<PriceSnapshot>({
        filter: `player.fpl_id = ${fplId} && snapshot_date >= "${since.toISOString()}"`,
        sort: "snapshot_date",
      }),
    `fetchPriceHistory(fplId=${fplId})`
  );
}

/** In-memory cache for aggregated leaderboard data. */
let leaderboardCache: {
  data: LeaderboardResults;
  expiresAt: number;
} | null = null;

/** Cache TTL: 5 minutes (data syncs 2x daily so this is very safe). */
const LEADERBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

/** Results from fetchAllLeaderboards keyed by metric. */
export type LeaderboardResults = Record<StatMetric, PlayerStatSummary[]>;

/**
 * Fetch all leaderboards in a single pass. Fetches players and gameweek_stats
 * once, aggregates once, then sorts by each metric. Results are cached
 * in-memory for 5 minutes.
 */
export async function fetchAllLeaderboards(
  request: Request,
  limit: number = 10,
): Promise<LeaderboardResults> {
  if (leaderboardCache && Date.now() < leaderboardCache.expiresAt) {
    return leaderboardCache.data;
  }

  const pb = createStatClient(request);

  const [players, allStats] = await Promise.all([
    withTimeout(
      pb.collection("players").getFullList<PlayerRecord>({ sort: "name" }),
      "fetchAllLeaderboards:players"
    ),
    withTimeout(
      pb.collection("gameweek_stats").getFullList<GameweekStat>({ filter: "gw > 0" }),
      "fetchAllLeaderboards:gameweek_stats"
    ),
  ]);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Aggregate per player (single pass)
  const summaries = new Map<string, PlayerStatSummary>();

  for (const stat of allStats) {
    const player = playerMap.get(stat.player);
    if (!player) continue;

    const existing = summaries.get(stat.player);
    if (existing) {
      existing.totalMinutes += stat.minutes || 0;
      existing.totalGoals += stat.goals || 0;
      existing.totalAssists += stat.assists || 0;
      existing.totalXg += stat.xg || 0;
      existing.totalNpxg += stat.npxg || 0;
      existing.totalXa += stat.xa || 0;
      existing.totalShots += stat.shots || 0;
      existing.totalKeyPasses += stat.key_passes || 0;
      existing.totalFplPoints += stat.fpl_points || 0;
      existing.totalCbit += stat.cbit || 0;
      existing.totalBallRecoveries += stat.ball_recoveries || 0;
      existing.totalProgressiveCarries += stat.progressive_carries || 0;
      existing.totalSca += stat.sca || 0;
      existing.totalChancesCreated += stat.chances_created || 0;
      existing.totalSuccessfulDribbles += stat.successful_dribbles || 0;
      existing.totalTouchesOppositionBox += stat.touches_opposition_box || 0;
      existing.totalRecoveries += stat.recoveries || 0;
      existing.totalDuelsWon += stat.duels_won || 0;
      existing.totalAerialDuelsWon += stat.aerial_duels_won || 0;
      existing.totalBigChancesMissed += stat.big_chances_missed || 0;
      existing.totalGoalsPrevented += stat.goals_prevented || 0;
      existing.totalDefensiveContributions += stat.defensive_contributions || 0;
      existing.gameweeks += 1;
    } else {
      summaries.set(stat.player, {
        player,
        totalMinutes: stat.minutes || 0,
        totalGoals: stat.goals || 0,
        totalAssists: stat.assists || 0,
        totalXg: stat.xg || 0,
        totalNpxg: stat.npxg || 0,
        totalXa: stat.xa || 0,
        totalShots: stat.shots || 0,
        totalKeyPasses: stat.key_passes || 0,
        totalCbit: stat.cbit || 0,
        totalBallRecoveries: stat.ball_recoveries || 0,
        totalProgressiveCarries: stat.progressive_carries || 0,
        totalSca: stat.sca || 0,
        totalFplPoints: stat.fpl_points || 0,
        overperformance: 0,
        xgPer90: 0,
        xaPer90: 0,
        cbitPer90: 0,
        gameweeks: 1,
        totalChancesCreated: stat.chances_created || 0,
        totalSuccessfulDribbles: stat.successful_dribbles || 0,
        totalTouchesOppositionBox: stat.touches_opposition_box || 0,
        totalRecoveries: stat.recoveries || 0,
        totalDuelsWon: stat.duels_won || 0,
        totalAerialDuelsWon: stat.aerial_duels_won || 0,
        totalBigChancesMissed: stat.big_chances_missed || 0,
        totalGoalsPrevented: stat.goals_prevented || 0,
        totalDefensiveContributions: stat.defensive_contributions || 0,
      });
    }
  }

  // Compute derived metrics
  for (const [, summary] of summaries) {
    summary.overperformance = summary.totalGoals - summary.totalXg;
    const nineties = summary.totalMinutes / 90;
    summary.xgPer90 = nineties > 0 ? summary.totalXg / nineties : 0;
    summary.xaPer90 = nineties > 0 ? summary.totalXa / nineties : 0;
    summary.cbitPer90 = nineties > 0 ? summary.totalCbit / nineties : 0;
  }

  const allSummaries = Array.from(summaries.values());

  // Sort by each metric and take top N
  const metrics: StatMetric[] = [
    "xg", "npxg", "xa", "cbit", "overperformance", "sca",
    "progressive_carries", "ball_recoveries", "fpl_points",
    "chances_created", "successful_dribbles", "touches_opposition_box",
    "recoveries", "duels_won", "aerial_duels_won", "big_chances_missed",
    "goals_prevented", "defensive_contributions",
  ];

  const results = {} as LeaderboardResults;
  for (const metric of metrics) {
    const sorted = [...allSummaries].sort((a, b) =>
      getMetricValue(b, metric) - getMetricValue(a, metric)
    );
    results[metric] = sorted.slice(0, limit);
  }

  leaderboardCache = { data: results, expiresAt: Date.now() + LEADERBOARD_CACHE_TTL_MS };

  return results;
}

/**
 * Fetch top performers by a given metric across all gameweeks.
 * @deprecated Use fetchAllLeaderboards() for batch fetching all metrics at once.
 */
export async function fetchTopPerformers(
  request: Request,
  metric: StatMetric,
  limit: number = 10,
): Promise<PlayerStatSummary[]> {
  const all = await fetchAllLeaderboards(request, limit);
  return all[metric];
}

/**
 * Fetch the latest sync log entries.
 */
export async function fetchSyncStatus(request: Request): Promise<SyncLogEntry[]> {
  const pb = createStatClient(request);
  const result = await withTimeout(
    pb.collection("sync_log").getList<SyncLogEntry>(1, 10, { sort: "-created" }),
    "fetchSyncStatus"
  );
  return result.items;
}

/**
 * Fetch all player records.
 */
export async function fetchAllPlayers(request: Request): Promise<PlayerRecord[]> {
  const pb = createStatClient(request);
  return withTimeout(
    pb.collection("players").getFullList<PlayerRecord>({ sort: "name" }),
    "fetchAllPlayers"
  );
}

/** Extract a numeric metric value from a player summary. */
function getMetricValue(summary: PlayerStatSummary, metric: StatMetric): number {
  switch (metric) {
    case "xg":
      return summary.totalXg;
    case "npxg":
      return summary.totalNpxg;
    case "xa":
      return summary.totalXa;
    case "cbit":
      return summary.totalCbit;
    case "overperformance":
      return summary.overperformance;
    case "sca":
      return summary.totalSca;
    case "progressive_carries":
      return summary.totalProgressiveCarries;
    case "ball_recoveries":
      return summary.totalBallRecoveries;
    case "fpl_points":
      return summary.totalFplPoints;
    case "chances_created":
      return summary.totalChancesCreated;
    case "successful_dribbles":
      return summary.totalSuccessfulDribbles;
    case "touches_opposition_box":
      return summary.totalTouchesOppositionBox;
    case "recoveries":
      return summary.totalRecoveries;
    case "duels_won":
      return summary.totalDuelsWon;
    case "aerial_duels_won":
      return summary.totalAerialDuelsWon;
    case "big_chances_missed":
      return summary.totalBigChancesMissed;
    case "goals_prevented":
      return summary.totalGoalsPrevented;
    case "defensive_contributions":
      return summary.totalDefensiveContributions;
    default:
      return 0;
  }
}
