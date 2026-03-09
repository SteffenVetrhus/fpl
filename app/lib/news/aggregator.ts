/**
 * News aggregator
 * Combines RSS and optional Twitter sources into a unified, deduplicated feed
 */

import type { NewsItem, NewsLoaderData, NewsSource } from "./types";
import { fetchRSSFeeds, DEFAULT_RSS_FEEDS } from "./rss-client";
import { fetchFPLTweets, isTwitterAvailable } from "./twitter-client";

/** Deduplicate news items by ID */
export function deduplicateItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/** Sort news items by published date, newest first */
export function sortByDate(items: NewsItem[]): NewsItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Extract unique sources from news items */
export function extractSources(items: NewsItem[]): NewsSource[] {
  const sourceMap = new Map<string, NewsSource>();
  for (const item of items) {
    if (!sourceMap.has(item.source.url)) {
      sourceMap.set(item.source.url, item.source);
    }
  }
  return Array.from(sourceMap.values());
}

/**
 * Fetch all news from all configured sources
 * RSS feeds are always fetched; Twitter is only fetched when configured
 */
export async function fetchAllNews(): Promise<NewsLoaderData> {
  const errors: string[] = [];

  const [rssResult, twitterResult] = await Promise.allSettled([
    fetchRSSFeeds(DEFAULT_RSS_FEEDS),
    fetchFPLTweets(),
  ]);

  let allItems: NewsItem[] = [];

  if (rssResult.status === "fulfilled") {
    allItems.push(...rssResult.value.items);
    errors.push(...rssResult.value.errors);
  } else {
    errors.push(`RSS fetch failed: ${rssResult.reason}`);
  }

  if (twitterResult.status === "fulfilled") {
    allItems.push(...twitterResult.value);
  } else {
    errors.push(`Twitter fetch failed: ${twitterResult.reason}`);
  }

  const deduplicated = deduplicateItems(allItems);
  const sorted = sortByDate(deduplicated);

  return {
    items: sorted,
    sources: extractSources(sorted),
    lastUpdated: new Date().toISOString(),
    twitterAvailable: isTwitterAvailable(),
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
}
