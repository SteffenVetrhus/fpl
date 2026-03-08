/**
 * Player snapshot operations
 * Stores and retrieves historical player data for price tracking
 */

import { query, isDatabaseAvailable } from "./client";
import type { FPLElement } from "~/lib/fpl-api/types";

export interface PlayerSnapshot {
  playerId: number;
  webName: string;
  teamId: number;
  elementType: number;
  nowCost: number;
  selectedByPercent: number;
  form: number;
  transfersInEvent: number;
  transfersOutEvent: number;
  epNext: number;
  expectedGoalInvolvements: number;
  totalPoints: number;
  minutes: number;
  snapshotDate: string;
}

export interface PriceChange {
  playerId: number;
  webName: string;
  teamId: number;
  elementType: number;
  currentCost: number;
  previousCost: number;
  costChange: number;
  selectedByPercent: number;
  transfersInEvent: number;
  transfersOutEvent: number;
  form: number;
  snapshotDate: string;
}

/**
 * Save a batch of player snapshots for today
 * Uses UPSERT to handle re-runs on the same day
 */
export async function savePlayerSnapshots(
  players: FPLElement[]
): Promise<number> {
  let count = 0;

  for (const player of players) {
    await query(
      `INSERT INTO player_snapshots (
        player_id, web_name, team_id, element_type, now_cost,
        selected_by_percent, form, transfers_in_event, transfers_out_event,
        ep_next, expected_goal_involvements, total_points, minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (player_id, snapshot_date) DO UPDATE SET
        now_cost = EXCLUDED.now_cost,
        selected_by_percent = EXCLUDED.selected_by_percent,
        form = EXCLUDED.form,
        transfers_in_event = EXCLUDED.transfers_in_event,
        transfers_out_event = EXCLUDED.transfers_out_event,
        ep_next = EXCLUDED.ep_next,
        expected_goal_involvements = EXCLUDED.expected_goal_involvements,
        total_points = EXCLUDED.total_points,
        minutes = EXCLUDED.minutes`,
      [
        player.id,
        player.web_name,
        player.team,
        player.element_type,
        player.now_cost,
        parseFloat(player.selected_by_percent) || 0,
        parseFloat(player.form) || 0,
        player.transfers_in_event,
        player.transfers_out_event,
        parseFloat(player.ep_next ?? "0"),
        parseFloat(player.expected_goal_involvements) || 0,
        player.total_points,
        player.minutes,
      ]
    );
    count++;
  }

  return count;
}

/**
 * Get recent price changes from the database
 */
export async function getPriceChanges(): Promise<PriceChange[]> {
  const result = await query<{
    player_id: number;
    web_name: string;
    team_id: number;
    element_type: number;
    current_cost: number;
    previous_cost: number;
    cost_change: number;
    selected_by_percent: number;
    transfers_in_event: number;
    transfers_out_event: number;
    form: number;
    snapshot_date: string;
  }>("SELECT * FROM price_changes ORDER BY ABS(cost_change) DESC");

  return result.rows.map((row) => ({
    playerId: row.player_id,
    webName: row.web_name,
    teamId: row.team_id,
    elementType: row.element_type,
    currentCost: row.current_cost,
    previousCost: row.previous_cost,
    costChange: row.cost_change,
    selectedByPercent: Number(row.selected_by_percent),
    transfersInEvent: row.transfers_in_event,
    transfersOutEvent: row.transfers_out_event,
    form: Number(row.form),
    snapshotDate: row.snapshot_date,
  }));
}

/**
 * Get price history for a specific player
 */
export async function getPlayerPriceHistory(
  playerId: number,
  days: number = 30
): Promise<{ date: string; cost: number }[]> {
  const result = await query<{ snapshot_date: string; now_cost: number }>(
    `SELECT snapshot_date, now_cost
     FROM player_snapshots
     WHERE player_id = $1
       AND snapshot_date >= CURRENT_DATE - $2::int
     ORDER BY snapshot_date ASC`,
    [playerId, days]
  );

  return result.rows.map((row) => ({
    date: row.snapshot_date,
    cost: row.now_cost,
  }));
}

/**
 * Predict price changes based on transfer velocity
 * Players with high net transfers in are likely to rise; high net out likely to fall
 */
export async function predictPriceChanges(
  players: FPLElement[]
): Promise<{
  likelyRisers: { player: FPLElement; netTransfers: number; velocity: number }[];
  likelyFallers: { player: FPLElement; netTransfers: number; velocity: number }[];
}> {
  const withVelocity = players
    .filter((p) => p.status === "a" && p.minutes > 0)
    .map((p) => ({
      player: p,
      netTransfers: p.transfers_in_event - p.transfers_out_event,
      velocity:
        (p.transfers_in_event - p.transfers_out_event) /
        Math.max(p.transfers_in_event + p.transfers_out_event, 1),
    }));

  const likelyRisers = withVelocity
    .filter((p) => p.netTransfers > 5000 && p.velocity > 0.3)
    .sort((a, b) => b.netTransfers - a.netTransfers)
    .slice(0, 10);

  const likelyFallers = withVelocity
    .filter((p) => p.netTransfers < -5000 && p.velocity < -0.3)
    .sort((a, b) => a.netTransfers - b.netTransfers)
    .slice(0, 10);

  return { likelyRisers, likelyFallers };
}
