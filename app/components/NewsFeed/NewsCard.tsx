import type { NewsItem } from "~/lib/news/types";
import { Rss, Twitter } from "lucide-react";

interface NewsCardProps {
  item: NewsItem;
}

/** Format a date as relative time (e.g., "2 hours ago") */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export { formatRelativeTime };

export default function NewsCard({ item }: NewsCardProps) {
  const isTwitter = item.source.type === "twitter";
  const SourceIcon = isTwitter ? Twitter : Rss;

  return (
    <article className="border-l-4 pl-4 border-cyan-500">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="kit-badge text-white"
          style={{
            background: isTwitter ? "#1DA1F2" : "#06b6d4",
          }}
        >
          <SourceIcon className="w-3 h-3 inline-block mr-1" />
          {item.source.name}
        </span>
        <span className="text-gray-400 text-xs">
          {formatRelativeTime(item.publishedAt)}
        </span>
      </div>
      <h3 className="font-bold text-gray-900 text-lg leading-tight">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cyan-700 transition-colors"
        >
          {item.title}
        </a>
      </h3>
      {item.summary && (
        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
          {item.summary}
        </p>
      )}
      {item.author && (
        <p className="text-gray-400 text-xs mt-1">by {item.author}</p>
      )}
      {item.categories && item.categories.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {item.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
