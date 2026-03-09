import type { Route } from "./+types/news";
import { requireAuth } from "~/lib/pocketbase/auth";
import { fetchAllNews } from "~/lib/news/aggregator";
import NewsFeed from "~/components/NewsFeed/NewsFeed";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return await fetchAllNews();
}

export default function NewsPage({ loaderData }: Route.ComponentProps) {
  const { items, sources, lastUpdated, twitterAvailable, error } = loaderData;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-page-news)" }}
    >
      <section className="kit-hero kit-diagonal-cut">
        <div className="kit-watermark">NEWS</div>
        <div
          className="kit-stripe"
          style={{ background: "var(--color-page-news-light)" }}
        />
        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <p className="text-white/70 text-sm font-semibold tracking-widest uppercase mb-2">
            FPL Community
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            FPL News
          </h1>
          <p className="text-white/60 mt-3 text-sm md:text-base max-w-lg">
            The latest FPL tips, injury updates, and transfer news from across
            the community.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 -mt-8 pb-24">
        <div className="kit-card p-6 md:p-8 kit-animate-slide-up">
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
            <span
              className="kit-stat-number text-2xl"
              style={{ color: "var(--color-page-news)" }}
            >
              Latest Headlines
            </span>
            <span className="text-gray-400 text-xs">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          </div>

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-700">
              Some sources had issues: {error}
            </div>
          )}

          <NewsFeed
            items={items}
            sources={sources}
            twitterAvailable={twitterAvailable}
          />
        </div>
      </main>
    </div>
  );
}
