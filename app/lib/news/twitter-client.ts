/**
 * Optional Twitter/X client for FPL news
 * Gated behind TWITTER_API_KEY environment variable
 * Uses a third-party API (e.g., SociaVault) for free-tier tweet access
 */

import type { NewsItem, NewsSource, TwitterConfig } from "./types";
import { getEnvConfig } from "~/config/env";

interface CacheEntry {
  data: NewsItem[];
  expiresAt: number;
}

const twitterCache = new Map<string, CacheEntry>();
const TWITTER_CACHE_TTL = 300_000; // 5 minutes
const TWITTER_TIMEOUT_MS = 15_000; // 15 seconds

/** Check if Twitter/X integration is available */
export function isTwitterAvailable(): boolean {
  return !!process.env.TWITTER_API_KEY;
}

/** Get Twitter config from environment */
export function getTwitterConfig(): TwitterConfig | null {
  const apiKey = process.env.TWITTER_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    apiBaseUrl:
      process.env.TWITTER_API_BASE_URL || "https://api.sociavault.com/v1",
    searchQuery: "#FPL OR #FantasyPremierLeague OR #FPLCommunity",
    maxResults: 20,
  };
}

/** Map a tweet response to a NewsItem */
export function mapTweetToNewsItem(tweet: {
  id: string;
  text: string;
  created_at: string;
  author_name?: string;
  url?: string;
}): NewsItem {
  const source: NewsSource = {
    name: "X (Twitter)",
    type: "twitter",
    url: "https://x.com",
  };

  return {
    id: `tw-${tweet.id}`,
    title: tweet.text.slice(0, 100) + (tweet.text.length > 100 ? "..." : ""),
    summary: tweet.text.slice(0, 200),
    url: tweet.url ?? `https://x.com/i/status/${tweet.id}`,
    publishedAt: tweet.created_at,
    source,
    author: tweet.author_name,
  };
}

/**
 * Fetch FPL-related tweets
 * Returns empty array if Twitter is not configured (no errors thrown)
 */
export async function fetchFPLTweets(): Promise<NewsItem[]> {
  const config = getTwitterConfig();
  if (!config) return [];

  const envConfig = getEnvConfig();
  const cacheKey = config.searchQuery;

  if (envConfig.enableCache) {
    const cached = twitterCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const params = new URLSearchParams({
    query: config.searchQuery,
    max_results: config.maxResults.toString(),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TWITTER_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}/search?${params}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Twitter API request timed out after ${TWITTER_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(
      `Twitter API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const items = (data.results ?? data.data ?? []).map(mapTweetToNewsItem);

  if (envConfig.enableCache) {
    twitterCache.set(cacheKey, {
      data: items,
      expiresAt: Date.now() + TWITTER_CACHE_TTL,
    });
  }

  return items;
}

/** Clear the Twitter cache */
export function clearTwitterCache(): void {
  twitterCache.clear();
}
