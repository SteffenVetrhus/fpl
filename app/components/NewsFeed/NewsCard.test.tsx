import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NewsCard, { formatRelativeTime } from "./NewsCard";
import type { NewsItem } from "~/lib/news/types";

function makeNewsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: "1",
    title: "Salah injury update for GW25",
    summary: "Mo Salah trained separately ahead of the weekend fixture.",
    url: "https://example.com/salah-injury",
    publishedAt: new Date().toISOString(),
    source: { name: "All About FPL", type: "rss", url: "https://allaboutfpl.com/feed" },
    ...overrides,
  };
}

describe("formatRelativeTime", () => {
  it("shows 'just now' for very recent dates", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("shows minutes for recent dates", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("shows hours for older dates", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("shows days for dates older than 24h", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });
});

describe("NewsCard", () => {
  it("renders title as a link", () => {
    render(<NewsCard item={makeNewsItem()} />);
    const link = screen.getByRole("link", { name: /salah injury/i });
    expect(link).toHaveAttribute("href", "https://example.com/salah-injury");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders the source name", () => {
    render(<NewsCard item={makeNewsItem()} />);
    expect(screen.getByText("All About FPL")).toBeDefined();
  });

  it("renders the summary", () => {
    render(<NewsCard item={makeNewsItem()} />);
    expect(screen.getByText(/trained separately/)).toBeDefined();
  });

  it("renders the author when present", () => {
    render(<NewsCard item={makeNewsItem({ author: "FPL Writer" })} />);
    expect(screen.getByText(/FPL Writer/)).toBeDefined();
  });

  it("does not render author when absent", () => {
    render(<NewsCard item={makeNewsItem({ author: undefined })} />);
    expect(screen.queryByText(/^by /)).toBeNull();
  });

  it("renders categories when present", () => {
    render(
      <NewsCard
        item={makeNewsItem({ categories: ["Injury", "Preview", "Tips"] })}
      />
    );
    expect(screen.getByText("Injury")).toBeDefined();
    expect(screen.getByText("Preview")).toBeDefined();
    expect(screen.getByText("Tips")).toBeDefined();
  });

  it("limits displayed categories to 3", () => {
    render(
      <NewsCard
        item={makeNewsItem({
          categories: ["A", "B", "C", "D"],
        })}
      />
    );
    expect(screen.getByText("A")).toBeDefined();
    expect(screen.getByText("B")).toBeDefined();
    expect(screen.getByText("C")).toBeDefined();
    expect(screen.queryByText("D")).toBeNull();
  });

  it("renders twitter source badge for tweets", () => {
    render(
      <NewsCard
        item={makeNewsItem({
          source: { name: "X (Twitter)", type: "twitter", url: "https://x.com" },
        })}
      />
    );
    expect(screen.getByText("X (Twitter)")).toBeDefined();
  });
});
