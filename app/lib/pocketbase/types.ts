/**
 * PocketBase Collection Types
 * Collections for caching FPL API data
 */

import type {
  FPLBootstrapStatic,
  FPLGameweekPicks,
} from "~/lib/fpl-api/types";

/**
 * Bootstrap cache record
 * Stores bootstrap-static data (all players, teams, gameweeks)
 */
export interface BootstrapCacheRecord {
  id?: string;
  gameweek: number;
  data: FPLBootstrapStatic;
  fetched_at: string; // ISO datetime
  created?: string;
  updated?: string;
}

/**
 * Manager picks cache record
 * Stores gameweek picks for a specific manager
 */
export interface ManagerPicksRecord {
  id?: string;
  manager_id: string;
  gameweek: number;
  data: FPLGameweekPicks;
  is_completed: boolean; // If true, cache forever
  fetched_at: string; // ISO datetime
  created?: string;
  updated?: string;
}

/**
 * PocketBase collection names
 */
export const Collections = {
  BOOTSTRAP_CACHE: "bootstrap_cache",
  MANAGER_PICKS: "manager_picks",
} as const;
