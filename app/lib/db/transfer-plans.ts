/**
 * Transfer planner persistence layer
 * Stores and retrieves multi-gameweek transfer plans from PostgreSQL
 */

import { query, isDatabaseAvailable } from "./client";

/**
 * A single planned transfer for a gameweek
 */
export interface PlannedTransfer {
  elementIn: number;
  elementOut: number;
}

/**
 * Plan data for a single gameweek
 */
export interface GameweekPlan {
  transfers: PlannedTransfer[];
  captain: number | null;
  viceCaptain: number | null;
  chip: string | null;
  benchOrder: number[];
}

/**
 * Complete transfer plan stored in the database
 */
export interface TransferPlanData {
  gameweeks: Record<string, GameweekPlan>;
}

/**
 * Save a transfer plan for a manager
 * Uses UPSERT to create or update the plan
 */
export async function saveTransferPlan(
  managerId: number,
  planData: TransferPlanData
): Promise<void> {
  await query(
    `INSERT INTO transfer_plans (manager_id, plan_data, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (manager_id) DO UPDATE SET
       plan_data = EXCLUDED.plan_data,
       updated_at = NOW()`,
    [managerId, JSON.stringify(planData)]
  );
}

/**
 * Load a transfer plan for a manager
 * Returns null if no plan exists or database is unavailable
 */
export async function loadTransferPlan(
  managerId: number
): Promise<TransferPlanData | null> {
  const available = await isDatabaseAvailable();
  if (!available) return null;

  try {
    const result = await query<{ plan_data: TransferPlanData }>(
      `SELECT plan_data FROM transfer_plans WHERE manager_id = $1`,
      [managerId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0].plan_data;
  } catch {
    return null;
  }
}

/**
 * Delete a transfer plan for a manager
 */
export async function deleteTransferPlan(managerId: number): Promise<void> {
  await query(`DELETE FROM transfer_plans WHERE manager_id = $1`, [managerId]);
}
