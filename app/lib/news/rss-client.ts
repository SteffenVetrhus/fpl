/**
 * RSS feed client for FPL news aggregation
 * Fetches and parses RSS feeds from FPL content sites
 */

import Parser from "rss-parser";
import type { NewsItem, NewsSource, RSSFeedConfig, RSSFetchResult } from "./types";
import { getEnvConfig } from "~/config/env";

const parser = new Parser();

/** Default FPL RSS feeds */
export const DEFAULT_RSS_FEEDS: RSSFeedConfig[] = [
  { name: "All About FPL", url: "https://allaboutfpl.com/feed" },
  { name: "Fantasy Football 247", url: "https://fantasyfootball247.co.uk/feed" },
  { name: "FPL Hints", url: "https://fplhints.com/blog-feed.xml" },
  { name: "Fantasy Football Community", url: "https://fantasyfootballcommunity.com/feed" },
  { name: "Fantasy Yirma", url: "https://fantasyyirma.com/feed" },
];

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const rssCache = new Map<string, CacheEntry<NewsItem[]>>();

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

/** Generate a deterministic ID from url and title */
export function generateId(url: string, title: string): string {
  const str = `${url}:${title}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

/** Parse a single RSS item into a NewsItem */
export function parseRSSItem(
  item: Parser.Item,
  source: NewsSource
): NewsItem {
  const title = item.title ?? "Untitled";
  const url = item.link ?? "";
  const rawContent = item.contentSnippet ?? item.content ?? "";
  const summary = stripHtml(rawContent).slice(0, 200);

  return {
    id: generateId(url, title),
    title,
    summary,
    url,
    publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    source,
    author: item.creator ?? (item as Record<string, unknown>).author as string | undefined,
    categories: item.categories,
  };
}

/** Fetch and parse a single RSS feed */
async function fetchSingleFeed(feed: RSSFeedConfig): Promise<NewsItem[]> {
  const source: NewsSource = {
    name: feed.name,
    type: "rss",
    url: feed.url,
  };

  const result = await parser.parseURL(feed.url);
  return (result.items ?? []).map((item) => parseRSSItem(item, source));
}

/**
 * Fetch all configured RSS feeds
 * Gracefully handles individual feed failures
 */
export async function fetchRSSFeeds(
  feeds: RSSFeedConfig[] = DEFAULT_RSS_FEEDS
): Promise<RSSFetchResult> {
  const config = getEnvConfig();
  const ttl = config.newsCacheDuration * 1000;
  const allItems: NewsItem[] = [];
  const errors: string[] = [];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      if (config.enableCache) {
        const cached = rssCache.get(feed.url);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.data;
        }
      }

      const items = await fetchSingleFeed(feed);

      if (config.enableCache) {
        rssCache.set(feed.url, {
          data: items,
          expiresAt: Date.now() + ttl,
        });
      }

      return items;
    })
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    } else {
      errors.push(`Failed to fetch ${feeds[i].name}: ${result.reason}`);
    }
  }

  return { items: allItems, errors };
}

/** Clear the RSS cache */
export function clearRSSCache(): void {
  rssCache.clear();
}
