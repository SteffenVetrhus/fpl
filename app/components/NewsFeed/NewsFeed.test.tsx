import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NewsFeed from "./NewsFeed";
import type { NewsItem, NewsSource } from "~/lib/news/types";

function makeItems(): NewsItem[] {
  return [
    {
      id: "1",
      title: "RSS Article One",
      summary: "Summary one",
      url: "https://example.com/1",
      publishedAt: "2026-03-01T10:00:00Z",
      source: { name: "Feed A", type: "rss", url: "https://feeda.com/feed" },
    },
    {
      id: "2",
      title: "RSS Article Two",
      summary: "Summary two",
      url: "https://example.com/2",
      publishedAt: "2026-03-02T10:00:00Z",
      source: { name: "Feed B", type: "rss", url: "https://feedb.com/feed" },
    },
    {
      id: "tw-1",
      title: "Tweet about FPL",
      summary: "Tweetcontent",
      url: "https://x.com/status/1",
      publishedAt: "2026-03-03T10:00:00Z",
      source: { name: "X (Twitter)", type: "twitter", url: "https://x.com" },
    },
  ];
}

function makeSources(): NewsSource[] {
  return [
    { name: "Feed A", type: "rss", url: "https://feeda.com/feed" },
    { name: "Feed B", type: "rss", url: "https://feedb.com/feed" },
    { name: "X (Twitter)", type: "twitter", url: "https://x.com" },
  ];
}

describe("NewsFeed", () => {
  it("renders all items by default", () => {
    render(
      <NewsFeed items={makeItems()} sources={makeSources()} twitterAvailable />
    );
    expect(screen.getByText("RSS Article One")).toBeDefined();
    expect(screen.getByText("RSS Article Two")).toBeDefined();
    expect(screen.getByText("Tweet about FPL")).toBeDefined();
  });

  it("filters to RSS only when RSS button is clicked", () => {
    render(
      <NewsFeed items={makeItems()} sources={makeSources()} twitterAvailable />
    );
    fireEvent.click(screen.getByText(/^RSS \(/));
    expect(screen.getByText("RSS Article One")).toBeDefined();
    expect(screen.getByText("RSS Article Two")).toBeDefined();
    expect(screen.queryByText("Tweet about FPL")).toBeNull();
  });

  it("filters to Twitter only when Twitter button is clicked", () => {
    render(
      <NewsFeed items={makeItems()} sources={makeSources()} twitterAvailable />
    );
    fireEvent.click(screen.getByText(/X \/ Twitter/));
    expect(screen.queryByText("RSS Article One")).toBeNull();
    expect(screen.getByText("Tweet about FPL")).toBeDefined();
  });

  it("shows empty state when no items match filter", () => {
    const rssOnly = makeItems().filter((i) => i.source.type === "rss");
    const rssSources = makeSources().filter((s) => s.type === "rss");
    render(
      <NewsFeed items={rssOnly} sources={rssSources} twitterAvailable />
    );
    fireEvent.click(screen.getByText(/X \/ Twitter/));
    expect(screen.getByText("No news available")).toBeDefined();
  });

  it("shows Twitter not configured banner when unavailable", () => {
    render(
      <NewsFeed
        items={makeItems().filter((i) => i.source.type === "rss")}
        sources={makeSources().filter((s) => s.type === "rss")}
        twitterAvailable={false}
      />
    );
    expect(screen.getByText(/Twitter\/X integration is not configured/i)).toBeDefined();
    expect(screen.getByText("TWITTER_API_KEY")).toBeDefined();
  });

  it("disables Twitter filter button when unavailable", () => {
    render(
      <NewsFeed items={[]} sources={[]} twitterAvailable={false} />
    );
    const twitterBtn = screen.getByText(/X \/ Twitter/);
    expect(twitterBtn).toHaveProperty("disabled", true);
  });

  it("shows empty state with no items", () => {
    render(<NewsFeed items={[]} sources={[]} twitterAvailable={false} />);
    expect(screen.getByText("No news available")).toBeDefined();
  });
});
