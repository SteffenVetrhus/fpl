import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isTwitterAvailable,
  getTwitterConfig,
  mapTweetToNewsItem,
  fetchFPLTweets,
  clearTwitterCache,
} from "./twitter-client";

vi.mock("~/config/env", () => ({
  getEnvConfig: vi.fn(() => ({
    enableCache: false,
    newsCacheDuration: 900,
  })),
}));

describe("isTwitterAvailable", () => {
  beforeEach(() => {
    delete process.env.TWITTER_API_KEY;
  });

  it("returns false when no API key is set", () => {
    expect(isTwitterAvailable()).toBe(false);
  });

  it("returns true when API key is set", () => {
    process.env.TWITTER_API_KEY = "test-key";
    expect(isTwitterAvailable()).toBe(true);
  });
});

describe("getTwitterConfig", () => {
  beforeEach(() => {
    delete process.env.TWITTER_API_KEY;
    delete process.env.TWITTER_API_BASE_URL;
  });

  it("returns null when no API key is set", () => {
    expect(getTwitterConfig()).toBeNull();
  });

  it("returns config with defaults when API key is set", () => {
    process.env.TWITTER_API_KEY = "test-key";
    const config = getTwitterConfig();
    expect(config).not.toBeNull();
    expect(config!.apiKey).toBe("test-key");
    expect(config!.apiBaseUrl).toBe("https://api.sociavault.com/v1");
    expect(config!.searchQuery).toContain("#FPL");
    expect(config!.maxResults).toBe(20);
  });

  it("uses custom base URL when provided", () => {
    process.env.TWITTER_API_KEY = "test-key";
    process.env.TWITTER_API_BASE_URL = "https://custom-api.example.com";
    const config = getTwitterConfig();
    expect(config!.apiBaseUrl).toBe("https://custom-api.example.com");
  });
});

describe("mapTweetToNewsItem", () => {
  it("maps a tweet to a NewsItem", () => {
    const tweet = {
      id: "12345",
      text: "Salah is the must-have for GW25! #FPL",
      created_at: "2026-03-01T10:00:00Z",
      author_name: "FPLExpert",
      url: "https://x.com/FPLExpert/status/12345",
    };

    const item = mapTweetToNewsItem(tweet);
    expect(item.id).toBe("tw-12345");
    expect(item.title).toBe("Salah is the must-have for GW25! #FPL");
    expect(item.summary).toBe("Salah is the must-have for GW25! #FPL");
    expect(item.url).toBe("https://x.com/FPLExpert/status/12345");
    expect(item.publishedAt).toBe("2026-03-01T10:00:00Z");
    expect(item.author).toBe("FPLExpert");
    expect(item.source.type).toBe("twitter");
  });

  it("truncates long tweet text in title", () => {
    const longText = "A".repeat(150);
    const tweet = {
      id: "1",
      text: longText,
      created_at: "2026-03-01T10:00:00Z",
    };

    const item = mapTweetToNewsItem(tweet);
    expect(item.title.length).toBeLessThanOrEqual(103); // 100 + "..."
  });

  it("generates fallback URL when tweet URL is missing", () => {
    const tweet = {
      id: "67890",
      text: "Test tweet",
      created_at: "2026-03-01T10:00:00Z",
    };

    const item = mapTweetToNewsItem(tweet);
    expect(item.url).toBe("https://x.com/i/status/67890");
  });
});

describe("fetchFPLTweets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTwitterCache();
    delete process.env.TWITTER_API_KEY;
  });

  it("returns empty array when Twitter is not configured", async () => {
    const items = await fetchFPLTweets();
    expect(items).toEqual([]);
  });

  it("fetches tweets when configured", async () => {
    process.env.TWITTER_API_KEY = "test-key";

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: [
          {
            id: "1",
            text: "FPL tip of the day",
            created_at: "2026-03-01T10:00:00Z",
            author_name: "FPLGuru",
          },
        ],
      }),
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse as unknown as Response
    );

    const items = await fetchFPLTweets();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("FPL tip of the day");
    expect(items[0].source.type).toBe("twitter");
  });

  it("throws on API error", async () => {
    process.env.TWITTER_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    await expect(fetchFPLTweets()).rejects.toThrow("Twitter API error: 401");
  });
});
