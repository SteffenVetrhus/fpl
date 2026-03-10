/**
 * Derived metric calculations for the Stat Corner.
 *
 * These are pure functions that compute analytical metrics from raw data.
 * None of these are stored in PocketBase — they are calculated on demand.
 */

import type { GameweekStat } from "~/lib/stat-corner/types";

/**
 * Calculate goal overperformance (Goals - xG).
 * Positive = clinical (scores more than expected).
 * Negative = underperforming (scores less than expected).
 */
export function calculateOverperformance(goals: number, xg: number): number {
  return goals - xg;
}

/**
 * Calculate a "luck index" comparing actual FPL points to an xG-based estimate.
 * Returns the difference: positive = lucky, negative = unlucky.
 *
 * @param actualPoints - FPL points scored
 * @param xgBasedPoints - Estimated points based on xG/xA model
 */
export function calculateLuckIndex(
  actualPoints: number,
  xgBasedPoints: number,
): number {
  return actualPoints - xgBasedPoints;
}

/**
 * Calculate per-90-minute defensive score.
 * Combines CBIT (clearances, blocks, interceptions, tackles) with ball recoveries.
 */
export function calculateDefensiveScore(
  cbit: number,
  ballRecoveries: number,
  minutes: number,
): number {
  if (minutes <= 0) return 0;
  const nineties = minutes / 90;
  return (cbit + ballRecoveries) / nineties;
}

/**
 * Calculate per-90-minute creativity score.
 * Combines xA, SCA (shot-creating actions), and key passes.
 */
export function calculateCreativityScore(
  xa: number,
  sca: number,
  keyPasses: number,
  minutes: number,
): number {
  if (minutes <= 0) return 0;
  const nineties = minutes / 90;
  // Weighted formula: xA is most predictive, SCA adds context
  return (xa * 3 + sca * 0.5 + keyPasses * 0.3) / nineties;
}

/**
 * Calculate a rolling form trend over the last N gameweeks.
 * Returns the trend direction: positive = improving, negative = declining.
 *
 * Uses a simple linear regression slope on the metric values.
 */
export function calculateFormTrend(
  stats: GameweekStat[],
  metric: "xg" | "xa" | "fpl_points" = "fpl_points",
  windowSize: number = 5,
): number {
  const recent = stats
    .filter((s) => s.gw > 0)
    .sort((a, b) => b.gw - a.gw)
    .slice(0, windowSize);

  if (recent.length < 2) return 0;

  // Simple linear regression: slope of metric values over time
  const n = recent.length;
  const values = recent.reverse().map((s) => s[metric] || 0);

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Format a stat value for display.
 */
export function formatStat(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Classify a player's goal-scoring as clinical, average, or lucky.
 */
export function classifyFinishing(
  overperformance: number,
): "clinical" | "average" | "lucky" {
  if (overperformance > 1) return "clinical";
  if (overperformance < -1) return "lucky";
  return "average";
}
