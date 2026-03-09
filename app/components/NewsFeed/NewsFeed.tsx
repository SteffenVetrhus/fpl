import { useState } from "react";
import type { NewsItem, NewsSource } from "~/lib/news/types";
import NewsCard from "./NewsCard";

interface NewsFeedProps {
  items: NewsItem[];
  sources: NewsSource[];
  twitterAvailable: boolean;
}

type SourceFilter = "all" | "rss" | "twitter";

export default function NewsFeed({
  items,
  sources,
  twitterAvailable,
}: NewsFeedProps) {
  const [filter, setFilter] = useState<SourceFilter>("all");

  const filteredItems =
    filter === "all"
      ? items
      : items.filter((item) => item.source.type === filter);

  const hasRSS = sources.some((s) => s.type === "rss");
  const hasTwitter = sources.some((s) => s.type === "twitter");

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`kit-badge cursor-pointer transition-colors ${
            filter === "all"
              ? "bg-cyan-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({items.length})
        </button>
        {hasRSS && (
          <button
            onClick={() => setFilter("rss")}
            className={`kit-badge cursor-pointer transition-colors ${
              filter === "rss"
                ? "bg-cyan-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            RSS ({items.filter((i) => i.source.type === "rss").length})
          </button>
        )}
        <button
          onClick={() => setFilter("twitter")}
          disabled={!twitterAvailable}
          className={`kit-badge cursor-pointer transition-colors ${
            filter === "twitter"
              ? "bg-cyan-600 text-white"
              : !twitterAvailable
                ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          X / Twitter{" "}
          {hasTwitter
            ? `(${items.filter((i) => i.source.type === "twitter").length})`
            : "(not configured)"}
        </button>
      </div>

      {!twitterAvailable && filter === "all" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm text-blue-700">
          Twitter/X integration is not configured. Set{" "}
          <code className="bg-blue-100 px-1 rounded">TWITTER_API_KEY</code> in
          your environment to include tweets.
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-semibold">No news available</p>
          <p className="text-sm mt-1">
            {filter !== "all"
              ? "Try switching to a different source filter."
              : "News feeds may be temporarily unavailable."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredItems.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
