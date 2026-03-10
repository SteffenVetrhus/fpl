import { BarChart2, RefreshCw, TrendingUp, Shield, Sparkles, Target } from "lucide-react";
import { requireAuth } from "~/lib/pocketbase/auth";
import { fetchTopPerformers, fetchSyncStatus } from "~/lib/stat-corner/client";
import type { PlayerStatSummary, SyncLogEntry } from "~/lib/stat-corner/types";
import { MetricLeaderboard } from "~/components/StatCorner/MetricLeaderboard";
import { formatStat } from "~/utils/stat-corner";
import type { Route } from "./+types/stat-corner";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const [clinical, topXg, topXa, topCbit, topSca, syncStatus] =
    await Promise.all([
      fetchTopPerformers(request, "overperformance", 10).catch((e) => {
        console.error("[stat-corner] fetchTopPerformers(overperformance) failed:", e);
        return [] as PlayerStatSummary[];
      }),
      fetchTopPerformers(request, "xg", 10).catch((e) => {
        console.error("[stat-corner] fetchTopPerformers(xg) failed:", e);
        return [] as PlayerStatSummary[];
      }),
      fetchTopPerformers(request, "xa", 10).catch((e) => {
        console.error("[stat-corner] fetchTopPerformers(xa) failed:", e);
        return [] as PlayerStatSummary[];
      }),
      fetchTopPerformers(request, "cbit", 10).catch((e) => {
        console.error("[stat-corner] fetchTopPerformers(cbit) failed:", e);
        return [] as PlayerStatSummary[];
      }),
      fetchTopPerformers(request, "sca", 10).catch((e) => {
        console.error("[stat-corner] fetchTopPerformers(sca) failed:", e);
        return [] as PlayerStatSummary[];
      }),
      fetchSyncStatus(request).catch((e) => {
        console.error("[stat-corner] fetchSyncStatus failed:", e);
        return [] as SyncLogEntry[];
      }),
    ]);

  return { clinical, topXg, topXa, topCbit, topSca, syncStatus };
}

function SyncStatusBadge({ entries }: { entries: SyncLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <span className="text-xs text-white/40">No sync data yet</span>
    );
  }

  const latest = entries[0];
  const isOk = latest.status === "success";
  const timeAgo = getTimeAgo(latest.created);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        isOk ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
      }`}
    >
      <RefreshCw size={10} />
      {isOk ? "Synced" : "Error"} {timeAgo}
    </span>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function StatCornerPage({ loaderData }: Route.ComponentProps) {
  const { clinical, topXg, topXa, topCbit, topSca, syncStatus } = loaderData;

  const hasData =
    clinical.length > 0 ||
    topXg.length > 0 ||
    topXa.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#0D9488" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "#0D9488" }}>
        <div className="kit-watermark">STATS</div>
        <div className="kit-stripe" style={{ background: "#14B8A6" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium kit-animate-slide-up">
              Advanced Metrics · Underlying Data
            </p>
            <SyncStatusBadge entries={syncStatus} />
          </div>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            Stat Corner
          </h1>
          <p
            className="text-white/70 text-lg mt-2 kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            xG, xA, Defensive Contributions & more
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="px-4 pb-16 -mt-6 relative z-10 max-w-7xl mx-auto">
        {!hasData ? (
          <div className="kit-card p-12 text-center">
            <BarChart2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="kit-headline text-xl text-gray-700 mb-2">
              No Stat Data Yet
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              The data scrapers haven't run yet. Once the daily sync completes,
              you'll see xG, xA, CBIT, and more advanced metrics here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section: Clinical XI */}
            <section
              className="kit-animate-slide-up"
              style={{ "--delay": "300ms" } as React.CSSProperties}
            >
              <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-white" />
                <h2 className="kit-headline text-xl text-white">
                  Clinical XI
                </h2>
                <span className="text-xs text-white/50 ml-2">
                  Goals above Expected (G - xG)
                </span>
              </div>
              <MetricLeaderboard
                title="Most Clinical Finishers"
                metric="overperformance"
                players={clinical}
                formatter={(v) =>
                  `${v > 0 ? "+" : ""}${formatStat(v)}`
                }
              />
            </section>

            {/* Two-column grid */}
            <div
              className="grid md:grid-cols-2 gap-6 kit-animate-slide-up"
              style={{ "--delay": "400ms" } as React.CSSProperties}
            >
              {/* Top xG */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">Top xG</h2>
                </div>
                <MetricLeaderboard
                  title="Expected Goals Leaders"
                  metric="xg"
                  players={topXg}
                />
              </section>

              {/* Top xA */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">Top xA</h2>
                </div>
                <MetricLeaderboard
                  title="Expected Assists Leaders"
                  metric="xa"
                  players={topXa}
                />
              </section>
            </div>

            {/* Defensive & Creative */}
            <div
              className="grid md:grid-cols-2 gap-6 kit-animate-slide-up"
              style={{ "--delay": "500ms" } as React.CSSProperties}
            >
              {/* CBIT */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    Defensive Heroes
                  </h2>
                  <span className="text-xs text-white/50 ml-2">CBIT</span>
                </div>
                <MetricLeaderboard
                  title="Top Defensive Contributors"
                  metric="cbit"
                  players={topCbit}
                  formatter={(v) => String(Math.round(v))}
                />
              </section>

              {/* SCA */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    Creative Engines
                  </h2>
                  <span className="text-xs text-white/50 ml-2">
                    Shot-Creating Actions
                  </span>
                </div>
                <MetricLeaderboard
                  title="Top Shot Creators"
                  metric="sca"
                  players={topSca}
                  formatter={(v) => String(Math.round(v))}
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
