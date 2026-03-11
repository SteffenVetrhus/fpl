/**
 * FPL API Client
 * Provides functions to fetch data from the Fantasy Premier League API
 */

import type {
  FPLBootstrapStatic,
  FPLLeagueStandings,
  FPLManagerHistory,
  FPLManagerTransfers,
  FPLEntry,
  FPLGameweekPicks,
  FPLFixture,
  FPLElementSummary,
  FPLLiveGameweek,
} from "./types";
import { getEnvConfig } from "~/config/env";

const DEFAULT_API_BASE_URL = "https://fantasy.premierleague.com/api";

/** Default timeout for FPL API requests (30 seconds) */
const FETCH_TIMEOUT_MS = 30_000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Per-endpoint TTL overrides in seconds */
const ENDPOINT_TTL: Record<string, number> = {
  "/bootstrap-static/": 3600,
};

/**
 * Get TTL for a URL, checking endpoint overrides first, then falling back to config default
 */
function getTtlForUrl(url: string, defaultTtl: number): number {
  for (const [pattern, ttl] of Object.entries(ENDPOINT_TTL)) {
    if (url.includes(pattern)) {
      return ttl;
    }
  }
  return defaultTtl;
}

/** In-flight request deduplication map */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Fetch with in-memory caching, request deduplication, and timeout.
 * Returns cached response if available and not expired.
 * Deduplicates concurrent requests for the same URL.
 * @param url - The URL to fetch
 * @returns Promise resolving to parsed JSON response
 * @throws Error if fetch fails or times out
 */
async function cachedFetch<T>(url: string): Promise<T> {
  const config = getEnvConfig();

  if (config.enableCache) {
    const entry = cache.get(url) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
  }

  // Deduplicate concurrent requests for the same URL
  const pending = pendingRequests.get(url);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = performFetch<T>(url, config.enableCache, config.cacheDuration);
  pendingRequests.set(url, request);

  try {
    return await request;
  } finally {
    pendingRequests.delete(url);
  }
}

async function performFetch<T>(
  url: string,
  enableCache: boolean,
  cacheDuration: number
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
    }

    const data: T = await response.json();

    if (enableCache) {
      const ttlSeconds = getTtlForUrl(url, cacheDuration);
      cache.set(url, {
        data,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Clear the API response cache */
export function clearCache(): void {
  cache.clear();
}

/** Get the configured API base URL */
function getBaseUrl(): string {
  return getEnvConfig().apiBaseUrl || DEFAULT_API_BASE_URL;
}

/**
 * Fetch bootstrap-static data
 * Contains all teams, players, gameweeks, and general game information
 *
 * @returns Promise resolving to bootstrap data
 * @throws Error if fetch fails
 */
export async function fetchBootstrapStatic(): Promise<FPLBootstrapStatic> {
  return cachedFetch<FPLBootstrapStatic>(`${getBaseUrl()}/bootstrap-static/`);
}

/**
 * Fetch league standings
 * Returns league information and current standings
 *
 * @param leagueId - The FPL league ID
 * @param page - Optional page number for pagination (default: 1)
 * @returns Promise resolving to league standings
 * @throws Error if fetch fails or league not found
 */
export async function fetchLeagueStandings(
  leagueId: string,
  page?: number
): Promise<FPLLeagueStandings> {
  const params = new URLSearchParams();
  if (page && page > 1) {
    params.append("page_standings", page.toString());
  }

  const queryString = params.toString();
  const url = `${getBaseUrl()}/leagues-classic/${leagueId}/standings/${
    queryString ? `?${queryString}` : ""
  }`;

  return cachedFetch<FPLLeagueStandings>(url);
}

/**
 * Fetch manager entry information
 * Returns manager profile and summary statistics
 *
 * @param managerId - The FPL manager/entry ID
 * @returns Promise resolving to manager entry data
 * @throws Error if fetch fails or manager not found
 */
export async function fetchManagerEntry(
  managerId: string
): Promise<FPLEntry> {
  return cachedFetch<FPLEntry>(`${getBaseUrl()}/entry/${managerId}/`);
}

/**
 * Fetch manager gameweek history
 * Returns gameweek-by-gameweek results, chip usage, and past seasons
 *
 * @param managerId - The FPL manager/entry ID
 * @returns Promise resolving to manager history data
 * @throws Error if fetch fails or manager not found
 */
export async function fetchManagerHistory(
  managerId: string
): Promise<FPLManagerHistory> {
  return cachedFetch<FPLManagerHistory>(
    `${getBaseUrl()}/entry/${managerId}/history/`
  );
}

/**
 * Fetch manager transfers
 * Returns all transfers made by manager this season
 *
 * @param managerId - The FPL manager/entry ID
 * @returns Promise resolving to array of transfers
 * @throws Error if fetch fails or manager not found
 */
export async function fetchManagerTransfers(
  managerId: string
): Promise<FPLManagerTransfers> {
  return cachedFetch<FPLManagerTransfers>(
    `${getBaseUrl()}/entry/${managerId}/transfers/`
  );
}

/**
 * Fetch all fixtures for the season, optionally filtered by gameweek
 *
 * @param gameweek - Optional gameweek number to filter by
 * @returns Promise resolving to array of fixtures
 * @throws Error if fetch fails
 */
export async function fetchFixtures(
  gameweek?: number
): Promise<FPLFixture[]> {
  const params = gameweek ? `?event=${gameweek}` : "";
  return cachedFetch<FPLFixture[]>(`${getBaseUrl()}/fixtures/${params}`);
}

/**
 * Fetch detailed player summary including upcoming fixtures and past history
 *
 * @param playerId - The FPL player/element ID
 * @returns Promise resolving to player summary data
 * @throws Error if fetch fails
 */
export async function fetchElementSummary(
  playerId: number
): Promise<FPLElementSummary> {
  return cachedFetch<FPLElementSummary>(
    `${getBaseUrl()}/element-summary/${playerId}/`
  );
}

/**
 * Fetch live gameweek data with real-time player points
 *
 * @param gameweek - The gameweek number
 * @returns Promise resolving to live gameweek data
 * @throws Error if fetch fails
 */
export async function fetchLiveGameweek(
  gameweek: number
): Promise<FPLLiveGameweek> {
  return cachedFetch<FPLLiveGameweek>(
    `${getBaseUrl()}/event/${gameweek}/live/`
  );
}

/**
 * Fetch manager's picks for a specific gameweek
 * Returns captain, team selection, and auto-subs
 *
 * @param managerId - The FPL manager/entry ID
 * @param gameweek - The gameweek number
 * @returns Promise resolving to gameweek picks data
 * @throws Error if fetch fails or data not found
 */
export async function fetchGameweekPicks(
  managerId: string,
  gameweek: number
): Promise<FPLGameweekPicks> {
  return cachedFetch<FPLGameweekPicks>(
    `${getBaseUrl()}/entry/${managerId}/event/${gameweek}/picks/`
  );
}
