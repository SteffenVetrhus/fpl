/**
 * TypeScript interfaces for the Stat Corner data engine.
 * These map to the PocketBase collections populated by the Python scrapers.
 */

/** PocketBase ``players`` collection record. */
export interface PlayerRecord {
  id: string;
  fpl_id: number;
  understat_id?: number;
  name: string;
  full_name: string;
  team: string;
  position: "GKP" | "DEF" | "MID" | "FWD";
}

/** PocketBase ``gameweek_stats`` collection record. */
export interface GameweekStat {
  id: string;
  player: string; // Relation ID
  gw: number; // 0 = season aggregate, 1+ = per-gameweek
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  npxg: number;
  xa: number;
  shots: number;
  key_passes: number;
  cbit: number;
  ball_recoveries: number;
  progressive_carries: number;
  sca: number;
  fpl_points: number;
  // Fields from FPL-Core-Insights
  chances_created: number;
  successful_dribbles: number;
  touches_opposition_box: number;
  recoveries: number;
  duels_won: number;
  aerial_duels_won: number;
  big_chances_missed: number;
  goals_prevented: number;
  defensive_contributions: number;
}

/** PocketBase ``price_history`` collection record. */
export interface PriceSnapshot {
  id: string;
  player: string; // Relation ID
  price: number; // In tenths (100 = £10.0m)
  ownership: number; // Selected-by percent
  transfers_in: number;
  transfers_out: number;
  snapshot_date: string; // ISO datetime
}

/** PocketBase ``sync_log`` collection record. */
export interface SyncLogEntry {
  id: string;
  service: "fpl_sync" | "understat" | "fplcore";
  status: "success" | "error";
  records_processed: number;
  duration_seconds: number;
  error_message?: string;
  created: string;
}

/** Aggregated season stats for a player (derived from gameweek_stats). */
export interface PlayerStatSummary {
  player: PlayerRecord;
  totalMinutes: number;
  totalGoals: number;
  totalAssists: number;
  totalXg: number;
  totalNpxg: number;
  totalXa: number;
  totalShots: number;
  totalKeyPasses: number;
  totalCbit: number;
  totalBallRecoveries: number;
  totalProgressiveCarries: number;
  totalSca: number;
  totalFplPoints: number;
  /** Goals minus xG. Positive = clinical, negative = underperforming. */
  overperformance: number;
  /** Per-90-minute xG. */
  xgPer90: number;
  /** Per-90-minute xA. */
  xaPer90: number;
  /** Per-90-minute CBIT. */
  cbitPer90: number;
  gameweeks: number;
  // Aggregated fields from FPL-Core-Insights
  totalChancesCreated: number;
  totalSuccessfulDribbles: number;
  totalTouchesOppositionBox: number;
  totalRecoveries: number;
  totalDuelsWon: number;
  totalAerialDuelsWon: number;
  totalBigChancesMissed: number;
  totalGoalsPrevented: number;
  totalDefensiveContributions: number;
}

/** Metric used for leaderboards. */
export type StatMetric =
  | "xg"
  | "npxg"
  | "xa"
  | "cbit"
  | "overperformance"
  | "sca"
  | "progressive_carries"
  | "ball_recoveries"
  | "fpl_points"
  | "chances_created"
  | "successful_dribbles"
  | "touches_opposition_box"
  | "recoveries"
  | "duels_won"
  | "aerial_duels_won"
  | "big_chances_missed"
  | "goals_prevented"
  | "defensive_contributions";
