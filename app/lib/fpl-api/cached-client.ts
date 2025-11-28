/**
 * Cached FPL API Client
 * Wraps the FPL API client with PocketBase caching
 */

import {
  fetchBootstrapStatic as fetchBootstrapDirect,
  fetchManagerGameweekPicks as fetchPicksDirect,
} from "./client";
import { getPocketBaseClient } from "~/lib/pocketbase/client";
import type {
  FPLBootstrapStatic,
  FPLGameweekPicks,
} from "./types";

const ONE_HOUR = 3600000; // 1 hour in milliseconds
const TEN_MINUTES = 600000; // 10 minutes in milliseconds

/**
 * Fetch bootstrap-static data with caching
 * @param currentGameweek - The current gameweek number (for cache key)
 * @returns Bootstrap static data
 */
export async function fetchBootstrapStatic(
  currentGameweek?: number
): Promise<FPLBootstrapStatic> {
  const pb = getPocketBaseClient();

  // Use current gameweek or 0 as cache key
  const cacheKey = currentGameweek || 0;

  try {
    // Try to get from cache
    const cached = await pb.getBootstrapCache(cacheKey);

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.fetched_at).getTime();

      // If cache is less than 1 hour old, use it
      if (cacheAge < ONE_HOUR) {
        console.log(
          `[Cache HIT] Bootstrap data (${Math.round(cacheAge / 1000)}s old)`
        );
        return cached.data;
      }
    }
  } catch (error) {
    console.warn("Cache read failed, fetching fresh data:", error);
  }

  // Cache miss or expired, fetch fresh data
  console.log("[Cache MISS] Fetching fresh bootstrap data from FPL API");
  const data = await fetchBootstrapDirect();

  // Store in cache (fire and forget)
  pb.setBootstrapCache({
    gameweek: cacheKey,
    data,
    fetched_at: new Date().toISOString(),
  }).catch((err) => console.error("Failed to cache bootstrap data:", err));

  return data;
}

/**
 * Fetch manager gameweek picks with caching
 * @param managerId - Manager ID
 * @param gameweek - Gameweek number
 * @param isCompleted - Whether the gameweek is completed (cache forever if true)
 * @returns Gameweek picks data
 */
export async function fetchManagerGameweekPicks(
  managerId: string,
  gameweek: number,
  isCompleted = false
): Promise<FPLGameweekPicks> {
  const pb = getPocketBaseClient();

  try {
    // Try to get from cache
    const cached = await pb.getManagerPicks(managerId, gameweek);

    if (cached) {
      // If gameweek is completed, cache is permanent
      if (cached.is_completed || isCompleted) {
        console.log(`[Cache HIT] Manager ${managerId} GW${gameweek} (permanent)`);
        return cached.data;
      }

      // For current gameweek, use 10-minute TTL
      const cacheAge = Date.now() - new Date(cached.fetched_at).getTime();
      if (cacheAge < TEN_MINUTES) {
        console.log(
          `[Cache HIT] Manager ${managerId} GW${gameweek} (${Math.round(cacheAge / 1000)}s old)`
        );
        return cached.data;
      }
    }
  } catch (error) {
    console.warn("Cache read failed, fetching fresh data:", error);
  }

  // Cache miss or expired, fetch fresh data
  console.log(`[Cache MISS] Fetching manager ${managerId} GW${gameweek} from FPL API`);
  const data = await fetchPicksDirect(managerId, gameweek);

  // Store in cache (fire and forget)
  pb.setManagerPicks({
    manager_id: managerId,
    gameweek,
    data,
    is_completed: isCompleted,
    fetched_at: new Date().toISOString(),
  }).catch((err) =>
    console.error(`Failed to cache picks for manager ${managerId}:`, err)
  );

  return data;
}

/**
 * Batch fetch manager picks for multiple gameweeks
 * Useful for captain regret calculation
 * @param managerId - Manager ID
 * @param gameweeks - Array of gameweek numbers
 * @returns Map of gameweek to picks data
 */
export async function fetchManagerPicksBatch(
  managerId: string,
  gameweeks: number[]
): Promise<Map<number, FPLGameweekPicks>> {
  const pb = getPocketBaseClient();
  const results = new Map<number, FPLGameweekPicks>();

  // Try to get all cached picks for this manager
  const allCached = await pb.getAllManagerPicks(managerId);
  const cachedMap = new Map(
    allCached.map((record) => [record.gameweek, record])
  );

  // Determine which gameweeks need fetching
  const toFetch: number[] = [];
  const now = Date.now();

  for (const gw of gameweeks) {
    const cached = cachedMap.get(gw);

    if (cached) {
      const cacheAge = now - new Date(cached.fetched_at).getTime();

      // Use cache if completed or less than 10 minutes old
      if (cached.is_completed || cacheAge < TEN_MINUTES) {
        results.set(gw, cached.data);
        console.log(`[Batch Cache HIT] Manager ${managerId} GW${gw}`);
        continue;
      }
    }

    toFetch.push(gw);
  }

  // Fetch missing gameweeks
  if (toFetch.length > 0) {
    console.log(
      `[Batch Cache MISS] Fetching ${toFetch.length} gameweeks for manager ${managerId}`
    );

    // Fetch in parallel
    const fetches = toFetch.map((gw) =>
      fetchManagerGameweekPicks(managerId, gw, true).then((data) => ({
        gw,
        data,
      }))
    );

    const fetchResults = await Promise.all(fetches);
    for (const { gw, data } of fetchResults) {
      results.set(gw, data);
    }
  }

  return results;
}
