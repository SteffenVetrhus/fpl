/**
 * News aggregation types
 * Interfaces for the multi-source FPL news feed
 */

/** Identifies the origin of a news item */
export interface NewsSource {
  name: string;
  type: "rss" | "twitter";
  url: string;
}

/** A single news item from any source */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: NewsSource;
  imageUrl?: string;
  author?: string;
  categories?: string[];
}

/** RSS feed configuration */
export interface RSSFeedConfig {
  name: string;
  url: string;
}

/** Optional Twitter/X API configuration */
export interface TwitterConfig {
  apiKey: string;
  apiBaseUrl: string;
  searchQuery: string;
  maxResults: number;
}

/** Result from fetching RSS feeds */
export interface RSSFetchResult {
  items: NewsItem[];
  errors: string[];
}

/** Aggregated news response returned by the route loader */
export interface NewsLoaderData {
  items: NewsItem[];
  sources: NewsSource[];
  lastUpdated: string;
  twitterAvailable: boolean;
  error?: string;
}
