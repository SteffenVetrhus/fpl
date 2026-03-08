/**
 * Cached FPL API wrapper
 * Wraps API calls with Redis caching when available, falls back to direct fetch
 */

import { cacheGet, cacheSet } from "./redis";
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchLeagueStandings,
  fetchManagerEntry,
  fetchManagerHistory,
  fetchManagerTransfers,
  fetchGameweekPicks,
  fetchElementSummary,
  fetchLiveGameweek,
} from "~/lib/fpl-api/client";

// Cache TTLs in seconds
const TTL = {
  BOOTSTRAP: 600,       // 10 minutes — changes infrequently
  FIXTURES: 3600,       // 1 hour — fixtures rarely change
  LEAGUE: 120,          // 2 minutes — during live GW
  MANAGER_ENTRY: 300,   // 5 minutes
  MANAGER_HISTORY: 300, // 5 minutes
  MANAGER_TRANSFERS: 600, // 10 minutes
  PICKS: 3600,          // 1 hour — picks are locked after deadline
  ELEMENT_SUMMARY: 600, // 10 minutes
  LIVE: 60,             // 1 minute — changes during live matches
} as const;

/**
 * Generic cached fetch wrapper
 */
async function cachedFetch<T>(
  cacheKey: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(cacheKey);
  if (cached) return cached;

  // Cache miss — fetch from API
  const data = await fetcher();

  // Store in cache (fire and forget)
  cacheSet(cacheKey, data, ttl);

  return data;
}

export function cachedBootstrapStatic() {
  return cachedFetch("fpl:bootstrap", TTL.BOOTSTRAP, fetchBootstrapStatic);
}

export function cachedFixtures(gameweek?: number) {
  const key = gameweek ? `fpl:fixtures:${gameweek}` : "fpl:fixtures:all";
  return cachedFetch(key, TTL.FIXTURES, () => fetchFixtures(gameweek));
}

export function cachedLeagueStandings(leagueId: string, page?: number) {
  const key = `fpl:league:${leagueId}:${page ?? 1}`;
  return cachedFetch(key, TTL.LEAGUE, () => fetchLeagueStandings(leagueId, page));
}

export function cachedManagerEntry(managerId: string) {
  return cachedFetch(`fpl:entry:${managerId}`, TTL.MANAGER_ENTRY, () =>
    fetchManagerEntry(managerId)
  );
}

export function cachedManagerHistory(managerId: string) {
  return cachedFetch(`fpl:history:${managerId}`, TTL.MANAGER_HISTORY, () =>
    fetchManagerHistory(managerId)
  );
}

export function cachedManagerTransfers(managerId: string) {
  return cachedFetch(`fpl:transfers:${managerId}`, TTL.MANAGER_TRANSFERS, () =>
    fetchManagerTransfers(managerId)
  );
}

export function cachedGameweekPicks(managerId: string, gameweek: number) {
  return cachedFetch(`fpl:picks:${managerId}:${gameweek}`, TTL.PICKS, () =>
    fetchGameweekPicks(managerId, gameweek)
  );
}

export function cachedElementSummary(playerId: number) {
  return cachedFetch(`fpl:element:${playerId}`, TTL.ELEMENT_SUMMARY, () =>
    fetchElementSummary(playerId)
  );
}

export function cachedLiveGameweek(gameweek: number) {
  return cachedFetch(`fpl:live:${gameweek}`, TTL.LIVE, () =>
    fetchLiveGameweek(gameweek)
  );
}
