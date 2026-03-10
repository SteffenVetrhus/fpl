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

function createStatClient(): PocketBase {
  const config = getEnvConfig();
  return new PocketBase(config.pocketbaseUrl);
}

/**
 * Fetch advanced stats for a single player, optionally filtered by gameweek.
 */
export async function fetchPlayerStats(
  fplId: number,
  gw?: number,
): Promise<GameweekStat[]> {
  const pb = createStatClient();

  // First, get the player record ID from fpl_id
  const player = await pb
    .collection("players")
    .getFirstListItem<PlayerRecord>(`fpl_id = ${fplId}`)
    .catch(() => null);

  if (!player) return [];

  let filter = `player = "${player.id}"`;
  if (gw !== undefined) {
    filter += ` && gw = ${gw}`;
  }

  const result = await pb
    .collection("gameweek_stats")
    .getFullList<GameweekStat>({ filter, sort: "gw" });

  return result;
}

/**
 * Fetch all player stats for a given gameweek.
 */
export async function fetchAllPlayerStats(
  gw: number,
): Promise<(GameweekStat & { expand?: { player: PlayerRecord } })[]> {
  const pb = createStatClient();
  const result = await pb
    .collection("gameweek_stats")
    .getFullList<GameweekStat & { expand?: { player: PlayerRecord } }>({
      filter: `gw = ${gw}`,
      expand: "player",
      sort: "-fpl_points",
    });
  return result;
}

/**
 * Fetch price history for a player over the last N days.
 */
export async function fetchPriceHistory(
  fplId: number,
  days: number = 30,
): Promise<PriceSnapshot[]> {
  const pb = createStatClient();

  const player = await pb
    .collection("players")
    .getFirstListItem<PlayerRecord>(`fpl_id = ${fplId}`)
    .catch(() => null);

  if (!player) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await pb
    .collection("price_history")
    .getFullList<PriceSnapshot>({
      filter: `player = "${player.id}" && snapshot_date >= "${since.toISOString()}"`,
      sort: "snapshot_date",
    });

  return result;
}

/**
 * Fetch top performers by a given metric across all gameweeks.
 */
export async function fetchTopPerformers(
  metric: StatMetric,
  limit: number = 10,
): Promise<PlayerStatSummary[]> {
  const pb = createStatClient();

  // Get all players
  const players = await pb
    .collection("players")
    .getFullList<PlayerRecord>({ sort: "name" });

  console.log(`[stat-corner] fetchTopPerformers(${metric}): ${players.length} players found`);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Get all gameweek stats (gw > 0 — exclude season aggregates)
  const allStats = await pb
    .collection("gameweek_stats")
    .getFullList<GameweekStat>({ filter: "gw > 0" });

  console.log(`[stat-corner] fetchTopPerformers(${metric}): ${allStats.length} gameweek stats (gw > 0)`);

  // Also get season aggregates (gw = 0) for FBRef data
  const seasonAggregates = await pb
    .collection("gameweek_stats")
    .getFullList<GameweekStat>({ filter: "gw = 0" });

  console.log(`[stat-corner] fetchTopPerformers(${metric}): ${seasonAggregates.length} season aggregates (gw = 0)`);

  const seasonMap = new Map(seasonAggregates.map((s) => [s.player, s]));

  // Aggregate per player
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
        totalCbit: 0,
        totalBallRecoveries: 0,
        totalProgressiveCarries: 0,
        totalSca: 0,
        totalFplPoints: stat.fpl_points || 0,
        overperformance: 0,
        xgPer90: 0,
        xaPer90: 0,
        cbitPer90: 0,
        gameweeks: 1,
      });
    }
  }

  // Merge season aggregates (FBRef data stored as gw=0)
  for (const [playerId, summary] of summaries) {
    const season = seasonMap.get(playerId);
    if (season) {
      summary.totalCbit = season.cbit || 0;
      summary.totalBallRecoveries = season.ball_recoveries || 0;
      summary.totalProgressiveCarries = season.progressive_carries || 0;
      summary.totalSca = season.sca || 0;
    }

    // Compute derived metrics
    summary.overperformance = summary.totalGoals - summary.totalXg;
    const nineties = summary.totalMinutes / 90;
    summary.xgPer90 = nineties > 0 ? summary.totalXg / nineties : 0;
    summary.xaPer90 = nineties > 0 ? summary.totalXa / nineties : 0;
    summary.cbitPer90 = nineties > 0 ? summary.totalCbit / nineties : 0;
  }

  console.log(`[stat-corner] fetchTopPerformers(${metric}): ${summaries.size} player summaries after aggregation`);

  // Sort by the requested metric
  const sorted = Array.from(summaries.values()).sort((a, b) => {
    const aVal = getMetricValue(a, metric);
    const bVal = getMetricValue(b, metric);
    return bVal - aVal;
  });

  return sorted.slice(0, limit);
}

/**
 * Fetch the latest sync log entries.
 */
export async function fetchSyncStatus(): Promise<SyncLogEntry[]> {
  const pb = createStatClient();
  const result = await pb
    .collection("sync_log")
    .getList<SyncLogEntry>(1, 10, { sort: "-created" });
  return result.items;
}

/**
 * Fetch all player records.
 */
export async function fetchAllPlayers(): Promise<PlayerRecord[]> {
  const pb = createStatClient();
  return pb.collection("players").getFullList<PlayerRecord>({ sort: "name" });
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
    default:
      return 0;
  }
}
