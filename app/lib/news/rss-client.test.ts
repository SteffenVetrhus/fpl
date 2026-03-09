import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  stripHtml,
  generateId,
  parseRSSItem,
  fetchRSSFeeds,
  clearRSSCache,
  DEFAULT_RSS_FEEDS,
} from "./rss-client";
import type { NewsSource } from "./types";

vi.mock("~/config/env", () => ({
  getEnvConfig: vi.fn(() => ({
    enableCache: false,
    newsCacheDuration: 900,
  })),
}));

vi.mock("rss-parser", () => {
  const MockParser = vi.fn();
  MockParser.prototype.parseURL = vi.fn();
  return { default: MockParser };
});

import Parser from "rss-parser";

const mockParseURL = Parser.prototype.parseURL as ReturnType<typeof vi.fn>;

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("replaces HTML entities with spaces", () => {
    expect(stripHtml("Hello&nbsp;world")).toBe("Hello world");
  });

  it("handles plain text", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId("https://example.com", "Title")).toBe("string");
  });

  it("returns same ID for same inputs", () => {
    const id1 = generateId("https://example.com", "Title");
    const id2 = generateId("https://example.com", "Title");
    expect(id1).toBe(id2);
  });

  it("returns different IDs for different inputs", () => {
    const id1 = generateId("https://example.com/a", "Title A");
    const id2 = generateId("https://example.com/b", "Title B");
    expect(id1).not.toBe(id2);
  });
});

describe("parseRSSItem", () => {
  const source: NewsSource = {
    name: "Test Feed",
    type: "rss",
    url: "https://example.com/feed",
  };

  it("parses a full RSS item", () => {
    const item = {
      title: "FPL GW25 Preview",
      link: "https://example.com/gw25",
      contentSnippet: "This week features key players...",
      isoDate: "2026-03-01T10:00:00Z",
      creator: "FPL Writer",
      categories: ["Gameweek", "Preview"],
    };

    const result = parseRSSItem(item, source);
    expect(result.title).toBe("FPL GW25 Preview");
    expect(result.url).toBe("https://example.com/gw25");
    expect(result.summary).toBe("This week features key players...");
    expect(result.publishedAt).toBe("2026-03-01T10:00:00Z");
    expect(result.author).toBe("FPL Writer");
    expect(result.categories).toEqual(["Gameweek", "Preview"]);
    expect(result.source).toBe(source);
    expect(result.id).toBeTruthy();
  });

  it("handles missing fields with defaults", () => {
    const item = {};
    const result = parseRSSItem(item, source);
    expect(result.title).toBe("Untitled");
    expect(result.url).toBe("");
    expect(result.summary).toBe("");
    expect(result.publishedAt).toBeTruthy();
  });

  it("strips HTML from content", () => {
    const item = {
      title: "Test",
      link: "https://example.com",
      content: "<p>Some <strong>bold</strong> text</p>",
    };
    const result = parseRSSItem(item, source);
    expect(result.summary).toBe("Some bold text");
  });

  it("truncates long summaries to 200 characters", () => {
    const longContent = "A".repeat(300);
    const item = {
      title: "Test",
      link: "https://example.com",
      contentSnippet: longContent,
    };
    const result = parseRSSItem(item, source);
    expect(result.summary.length).toBe(200);
  });
});

describe("fetchRSSFeeds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRSSCache();
  });

  it("fetches and combines items from multiple feeds", async () => {
    mockParseURL.mockResolvedValue({
      items: [
        {
          title: "Article 1",
          link: "https://example.com/1",
          contentSnippet: "Summary 1",
          isoDate: "2026-03-01T10:00:00Z",
        },
      ],
    });

    const feeds = [
      { name: "Feed A", url: "https://feeda.com/rss" },
      { name: "Feed B", url: "https://feedb.com/rss" },
    ];

    const result = await fetchRSSFeeds(feeds);
    expect(result.items).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(mockParseURL).toHaveBeenCalledTimes(2);
  });

  it("handles individual feed failures gracefully", async () => {
    mockParseURL
      .mockResolvedValueOnce({
        items: [
          {
            title: "Good Article",
            link: "https://example.com/good",
            contentSnippet: "Content",
            isoDate: "2026-03-01T10:00:00Z",
          },
        ],
      })
      .mockRejectedValueOnce(new Error("Network error"));

    const feeds = [
      { name: "Good Feed", url: "https://good.com/rss" },
      { name: "Bad Feed", url: "https://bad.com/rss" },
    ];

    const result = await fetchRSSFeeds(feeds);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Good Article");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Bad Feed");
  });

  it("returns empty results when all feeds fail", async () => {
    mockParseURL.mockRejectedValue(new Error("All down"));

    const feeds = [{ name: "Feed", url: "https://feed.com/rss" }];
    const result = await fetchRSSFeeds(feeds);
    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("has default feeds configured", () => {
    expect(DEFAULT_RSS_FEEDS.length).toBeGreaterThan(0);
    for (const feed of DEFAULT_RSS_FEEDS) {
      expect(feed.name).toBeTruthy();
      expect(feed.url).toMatch(/^https?:\/\//);
    }
  });
});
