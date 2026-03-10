import { BarChart2, RefreshCw, TrendingUp, Shield, Sparkles, Target, Crosshair, Swords, Zap, CircleOff, Hand } from "lucide-react";
import { requireAuth } from "~/lib/pocketbase/auth";
import { fetchAllLeaderboards, fetchSyncStatus } from "~/lib/stat-corner/client";
import type { PlayerStatSummary, SyncLogEntry } from "~/lib/stat-corner/types";
import { MetricLeaderboard } from "~/components/StatCorner/MetricLeaderboard";
import { formatStat } from "~/utils/stat-corner";
import type { Route } from "./+types/stat-corner";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const [leaderboards, syncStatus] = await Promise.all([
    fetchAllLeaderboards(request, 10).catch((e) => {
      console.error("[stat-corner] fetchAllLeaderboards failed:", e);
      return null;
    }),
    fetchSyncStatus(request).catch((e) => {
      console.error("[stat-corner] fetchSyncStatus failed:", e);
      return [] as SyncLogEntry[];
    }),
  ]);

  const empty: PlayerStatSummary[] = [];

  return {
    clinical: leaderboards?.overperformance ?? empty,
    topXg: leaderboards?.xg ?? empty,
    topXa: leaderboards?.xa ?? empty,
    topCbit: leaderboards?.cbit ?? empty,
    topSca: leaderboards?.chances_created ?? empty,
    boxThreat: leaderboards?.touches_opposition_box ?? empty,
    duelMasters: leaderboards?.duels_won ?? empty,
    dribbleKings: leaderboards?.successful_dribbles ?? empty,
    ballWinners: leaderboards?.recoveries ?? empty,
    aerialDominance: leaderboards?.aerial_duels_won ?? empty,
    gkWall: leaderboards?.goals_prevented ?? empty,
    bigChanceWasters: leaderboards?.big_chances_missed ?? empty,
    syncStatus,
  };
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
  const {
    clinical, topXg, topXa, topCbit, topSca,
    boxThreat, duelMasters, dribbleKings, ballWinners,
    aerialDominance, gkWall, bigChanceWasters,
    syncStatus,
  } = loaderData;

  const hasData =
    clinical.length > 0 ||
    topXg.length > 0 ||
    topXa.length > 0;

  const intFormatter = (v: number) => String(Math.round(v));
  const signedFormatter = (v: number) =>
    `${v > 0 ? "+" : ""}${formatStat(v)}`;

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
                formatter={signedFormatter}
              />
            </section>

            {/* Attacking: xG & xA */}
            <div
              className="grid md:grid-cols-2 gap-6 kit-animate-slide-up"
              style={{ "--delay": "400ms" } as React.CSSProperties}
            >
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

            {/* Creative: Chance Creators & Box Threat */}
            <div
              className="grid md:grid-cols-2 gap-6 kit-animate-slide-up"
              style={{ "--delay": "500ms" } as React.CSSProperties}
            >
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    Creative Engines
                  </h2>
                  <span className="text-xs text-white/50 ml-2">
                    Chances Created
                  </span>
                </div>
                <MetricLeaderboard
                  title="Top Chance Creators"
                  metric="chances_created"
                  players={topSca}
                  formatter={intFormatter}
                />
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Crosshair size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    Box Threat
                  </h2>
                  <span className="text-xs text-white/50 ml-2">
                    Touches in Opposition Box
                  </span>
                </div>
                <MetricLeaderboard
                  title="Most Dangerous in the Box"
                  metric="touches_opposition_box"
                  players={boxThreat}
                  formatter={intFormatter}
                />
              </section>
            </div>

            {/* Defensive: CBIT & Ball Winners */}
            <div
              className="grid md:grid-cols-2 gap-6 kit-animate-slide-up"
              style={{ "--delay": "600ms" } as React.CSSProperties}
            >
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
                  formatter={intFormatter}
                />
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Hand size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    Ball Winners
                  </h2>
                  <span className="text-xs text-white/50 ml-2">
                    Recoveries
                  </span>
                </div>
                <MetricLeaderboard
                  title="Top Ball Recoverers"
                  metric="recoveries"
                  players={ballWinners}
                  formatter={intFormatter}
                />
              </section>
            </div>

            {/* Physical: Duel Masters & Dribble Kings */}
            <div
              className="grid md:grid-cols-2 gap-6 kit-animate-slide-up"
              style={{ "--delay": "700ms" } as React.CSSProperties}
            >
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Swords size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    Duel Masters
                  </h2>
                  <span className="text-xs text-white/50 ml-2">
                    Duels Won
                  </span>
                </div>
                <MetricLeaderboard
                  title="Top Duel Winners"
                  metric="duels_won"
                  players={duelMasters}
                  formatter={intFormatter}
                />
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    Dribble Kings
                  </h2>
                  <span className="text-xs text-white/50 ml-2">
                    Successful Dribbles
                  </span>
                </div>
                <MetricLeaderboard
                  title="Top Dribblers"
                  metric="successful_dribbles"
                  players={dribbleKings}
                  formatter={intFormatter}
                />
              </section>
            </div>

            {/* Aerial & GK */}
            <div
              className="grid md:grid-cols-2 gap-6 kit-animate-slide-up"
              style={{ "--delay": "800ms" } as React.CSSProperties}
            >
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    Aerial Dominance
                  </h2>
                  <span className="text-xs text-white/50 ml-2">
                    Aerial Duels Won
                  </span>
                </div>
                <MetricLeaderboard
                  title="Heading Specialists"
                  metric="aerial_duels_won"
                  players={aerialDominance}
                  formatter={intFormatter}
                />
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={20} className="text-white" />
                  <h2 className="kit-headline text-lg text-white">
                    GK Wall
                  </h2>
                  <span className="text-xs text-white/50 ml-2">
                    Goals Prevented (xGOT - GC)
                  </span>
                </div>
                <MetricLeaderboard
                  title="Shot-Stopping Heroes"
                  metric="goals_prevented"
                  players={gkWall}
                  formatter={signedFormatter}
                />
              </section>
            </div>

            {/* Fun: Big Chance Wasters */}
            <section
              className="kit-animate-slide-up"
              style={{ "--delay": "900ms" } as React.CSSProperties}
            >
              <div className="flex items-center gap-2 mb-4">
                <CircleOff size={20} className="text-white" />
                <h2 className="kit-headline text-xl text-white">
                  Big Chance Wasters
                </h2>
                <span className="text-xs text-white/50 ml-2">
                  Clear-Cut Chances Missed
                </span>
              </div>
              <MetricLeaderboard
                title="Most Big Chances Missed"
                metric="big_chances_missed"
                players={bigChanceWasters}
                formatter={intFormatter}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
