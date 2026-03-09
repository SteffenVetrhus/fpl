import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  deduplicateItems,
  sortByDate,
  extractSources,
  fetchAllNews,
} from "./aggregator";
import type { NewsItem, NewsSource } from "./types";

vi.mock("~/config/env", () => ({
  getEnvConfig: vi.fn(() => ({
    enableCache: false,
    newsCacheDuration: 900,
  })),
}));

vi.mock("./rss-client", () => ({
  fetchRSSFeeds: vi.fn(),
  DEFAULT_RSS_FEEDS: [{ name: "Test Feed", url: "https://test.com/feed" }],
}));

vi.mock("./twitter-client", () => ({
  fetchFPLTweets: vi.fn(),
  isTwitterAvailable: vi.fn(),
}));

import { fetchRSSFeeds } from "./rss-client";
import { fetchFPLTweets, isTwitterAvailable } from "./twitter-client";

const mockFetchRSS = fetchRSSFeeds as ReturnType<typeof vi.fn>;
const mockFetchTweets = fetchFPLTweets as ReturnType<typeof vi.fn>;
const mockIsTwitterAvailable = isTwitterAvailable as ReturnType<typeof vi.fn>;

function makeItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: "1",
    title: "Test Article",
    summary: "Test summary",
    url: "https://example.com/1",
    publishedAt: "2026-03-01T10:00:00Z",
    source: { name: "Test", type: "rss", url: "https://test.com/feed" },
    ...overrides,
  };
}

describe("deduplicateItems", () => {
  it("removes duplicate items by id", () => {
    const items = [makeItem({ id: "1" }), makeItem({ id: "1" }), makeItem({ id: "2" })];
    const result = deduplicateItems(items);
    expect(result).toHaveLength(2);
  });

  it("keeps first occurrence", () => {
    const items = [
      makeItem({ id: "1", title: "First" }),
      makeItem({ id: "1", title: "Second" }),
    ];
    expect(deduplicateItems(items)[0].title).toBe("First");
  });

  it("handles empty array", () => {
    expect(deduplicateItems([])).toEqual([]);
  });
});

describe("sortByDate", () => {
  it("sorts newest first", () => {
    const items = [
      makeItem({ id: "1", publishedAt: "2026-03-01T10:00:00Z" }),
      makeItem({ id: "2", publishedAt: "2026-03-03T10:00:00Z" }),
      makeItem({ id: "3", publishedAt: "2026-03-02T10:00:00Z" }),
    ];
    const sorted = sortByDate(items);
    expect(sorted[0].id).toBe("2");
    expect(sorted[1].id).toBe("3");
    expect(sorted[2].id).toBe("1");
  });

  it("does not mutate original array", () => {
    const items = [
      makeItem({ id: "1", publishedAt: "2026-03-01T10:00:00Z" }),
      makeItem({ id: "2", publishedAt: "2026-03-03T10:00:00Z" }),
    ];
    sortByDate(items);
    expect(items[0].id).toBe("1");
  });
});

describe("extractSources", () => {
  it("extracts unique sources by URL", () => {
    const source1: NewsSource = { name: "Feed A", type: "rss", url: "https://a.com/feed" };
    const source2: NewsSource = { name: "Feed B", type: "rss", url: "https://b.com/feed" };
    const items = [
      makeItem({ source: source1 }),
      makeItem({ id: "2", source: source1 }),
      makeItem({ id: "3", source: source2 }),
    ];
    const sources = extractSources(items);
    expect(sources).toHaveLength(2);
  });

  it("returns empty for no items", () => {
    expect(extractSources([])).toEqual([]);
  });
});

describe("fetchAllNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTwitterAvailable.mockReturnValue(false);
  });

  it("combines RSS and Twitter results", async () => {
    const rssItem = makeItem({ id: "rss-1", publishedAt: "2026-03-01T10:00:00Z" });
    const tweetItem = makeItem({
      id: "tw-1",
      publishedAt: "2026-03-02T10:00:00Z",
      source: { name: "X (Twitter)", type: "twitter", url: "https://x.com" },
    });

    mockFetchRSS.mockResolvedValue({ items: [rssItem], errors: [] });
    mockFetchTweets.mockResolvedValue([tweetItem]);
    mockIsTwitterAvailable.mockReturnValue(true);

    const result = await fetchAllNews();
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("tw-1"); // Newer first
    expect(result.twitterAvailable).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("works with RSS only when Twitter unavailable", async () => {
    mockFetchRSS.mockResolvedValue({
      items: [makeItem()],
      errors: [],
    });
    mockFetchTweets.mockResolvedValue([]);

    const result = await fetchAllNews();
    expect(result.items).toHaveLength(1);
    expect(result.twitterAvailable).toBe(false);
  });

  it("handles RSS failure gracefully", async () => {
    mockFetchRSS.mockRejectedValue(new Error("RSS down"));
    mockFetchTweets.mockResolvedValue([]);

    const result = await fetchAllNews();
    expect(result.items).toHaveLength(0);
    expect(result.error).toContain("RSS fetch failed");
  });

  it("handles Twitter failure gracefully", async () => {
    mockFetchRSS.mockResolvedValue({ items: [makeItem()], errors: [] });
    mockFetchTweets.mockRejectedValue(new Error("Twitter down"));

    const result = await fetchAllNews();
    expect(result.items).toHaveLength(1);
    expect(result.error).toContain("Twitter fetch failed");
  });

  it("deduplicates items across sources", async () => {
    const item = makeItem({ id: "dup-1" });
    mockFetchRSS.mockResolvedValue({ items: [item], errors: [] });
    mockFetchTweets.mockResolvedValue([{ ...item }]);

    const result = await fetchAllNews();
    expect(result.items).toHaveLength(1);
  });

  it("includes lastUpdated timestamp", async () => {
    mockFetchRSS.mockResolvedValue({ items: [], errors: [] });
    mockFetchTweets.mockResolvedValue([]);

    const result = await fetchAllNews();
    expect(result.lastUpdated).toBeTruthy();
    expect(new Date(result.lastUpdated).getTime()).not.toBeNaN();
  });
});
