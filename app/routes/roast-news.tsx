import { fetchLeagueStandings } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/roast-news";
import { requireAuth } from "~/lib/pocketbase/auth";
import { customRoasts } from "~/data/custom-roasts";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const config = getEnvConfig();
  const standings = await fetchLeagueStandings(config.fplLeagueId);

  return {
    leagueName: standings.league.name,
    editions: customRoasts,
  };
}

const categoryColors: Record<string, string> = {
  "GW Overlord": "#15803D",
  "Captain Catastrophe": "#B91C1C",
  "Season Over": "#1F2937",
  "Wildcard Wasteman": "#7C3AED",
  "Haaland Truther": "#0891B2",
  "João Pedro Enjoyer": "#D97706",
  "Bald Fraud": "#6B7280",
  "Ali Why-a": "#92400E",
  "Benchwarmer's Curse": "#D97706",
  "Dúbravka Disrespect": "#2563EB",
  "Erling Disappointment": "#0891B2",
};

export default function RoastNews({ loaderData }: Route.ComponentProps) {
  const { leagueName, editions } = loaderData;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-page-roast)" }}
    >
      <section className="kit-hero kit-diagonal-cut">
        <div className="kit-watermark">ROAST</div>
        <div
          className="kit-stripe"
          style={{ background: "var(--color-page-roast-light)" }}
        />
        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <p className="text-white/70 text-sm font-semibold tracking-widest uppercase mb-2">
            {leagueName}
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            Roast News
          </h1>
          <p className="text-white/60 mt-3 text-sm md:text-base max-w-lg">
            Every gameweek, somebody gets burned. Hand-crafted match reports
            nobody asked for.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 -mt-8 pb-24">
        {editions.map((edition, edIdx) => (
          <div
            key={edition.gameweek}
            className="kit-card p-6 md:p-8 mb-6 kit-animate-slide-up"
            style={{ "--delay": `${edIdx * 100}ms` } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
              <span
                className="kit-stat-number text-4xl"
                style={{ color: "var(--color-page-roast)" }}
              >
                GW{edition.gameweek}
              </span>
              <span className="kit-stat-label text-gray-400">
                Match Report
              </span>
            </div>

            {edition.summary && (
              <p className="text-gray-500 text-sm italic mb-5 border-l-2 border-gray-200 pl-3">
                {edition.summary}
              </p>
            )}

            <div className="space-y-5">
              {edition.roasts.map((roast, rIdx) => (
                <article
                  key={rIdx}
                  className="border-l-4 pl-4"
                  style={{
                    borderColor:
                      categoryColors[roast.category] || "#6B7280",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="kit-badge text-white"
                      style={{
                        background:
                          categoryColors[roast.category] || "#6B7280",
                      }}
                    >
                      {roast.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {roast.headline}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                    {roast.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
