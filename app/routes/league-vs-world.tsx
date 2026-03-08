import { useLoaderData } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/league-vs-world";

interface WorldData {
  managerName: string;
  teamName: string;
  currentGlobalRank: number;
  currentLeagueRank: number;
  bestGlobalRank: { rank: number; gameweek: number };
  worstGlobalRank: { rank: number; gameweek: number };
  avgGlobalRank: number;
  totalPoints: number;
  globalRankHistory: Array<{ gameweek: number; rank: number }>;
}

function formatRank(rank: number): string {
  if (rank >= 1_000_000) return `${(rank / 1_000_000).toFixed(1)}M`;
  if (rank >= 1_000) return `${(rank / 1_000).toFixed(0)}K`;
  return rank.toString();
}

function getPercentile(rank: number, totalPlayers: number): number {
  return ((totalPlayers - rank) / totalPlayers) * 100;
}

export async function loader() {
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  const worldData: WorldData[] = await Promise.all(
    leagueData.standings.results.map(async (manager, leagueIndex) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      const gws = history.current;

      const bestGlobalRank = gws.reduce(
        (best, gw) =>
          gw.overall_rank < best.rank
            ? { rank: gw.overall_rank, gameweek: gw.event }
            : best,
        { rank: Infinity, gameweek: 0 }
      );

      const worstGlobalRank = gws.reduce(
        (worst, gw) =>
          gw.overall_rank > worst.rank
            ? { rank: gw.overall_rank, gameweek: gw.event }
            : worst,
        { rank: 0, gameweek: 0 }
      );

      const avgGlobalRank =
        gws.length > 0
          ? gws.reduce((sum, gw) => sum + gw.overall_rank, 0) / gws.length
          : 0;

      const latest = gws[gws.length - 1];

      return {
        managerName: manager.player_name,
        teamName: manager.entry_name,
        currentGlobalRank: latest?.overall_rank ?? 0,
        currentLeagueRank: manager.rank,
        bestGlobalRank,
        worstGlobalRank,
        avgGlobalRank,
        totalPoints: latest?.total_points ?? 0,
        globalRankHistory: gws.map((gw) => ({
          gameweek: gw.event,
          rank: gw.overall_rank,
        })),
      };
    })
  );

  worldData.sort((a, b) => a.currentGlobalRank - b.currentGlobalRank);

  // Estimate total players (~11M typical)
  const totalPlayers = 11_000_000;

  return { worldData, totalPlayers };
}

export default function LeagueVsWorld({ loaderData }: Route.ComponentProps) {
  const { worldData, totalPlayers } = useLoaderData<typeof loader>();

  const leagueAvgRank =
    worldData.length > 0
      ? worldData.reduce((sum, m) => sum + m.currentGlobalRank, 0) / worldData.length
      : 0;

  // Find "Big Fish Small Pond" - best global rank but worst league rank
  const bigFish = [...worldData].sort(
    (a, b) => a.currentGlobalRank - b.currentGlobalRank
  )[0];

  // Find "Local Legend" - best league rank but worst global rank
  const localLegend = [...worldData].sort(
    (a, b) => {
      // Best league rank (lowest number) but worst global rank (highest number)
      return a.currentLeagueRank - b.currentLeagueRank || b.currentGlobalRank - a.currentGlobalRank;
    }
  )[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-world)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-world)" }}>
        <div className="kit-watermark">11M</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-world-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Where does your league rank among 11 million managers?
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            League vs<br />The World
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
            <div className="kit-stat-number text-blue-600">{formatRank(Math.round(leagueAvgRank))}</div>
            <div className="kit-stat-label">League avg rank</div>
            <div className="text-xs text-gray-400 mt-1">
              Top {getPercentile(leagueAvgRank, totalPlayers).toFixed(1)}%
            </div>
          </div>
          {bigFish && (
            <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "250ms" } as React.CSSProperties}>
              <div className="text-2xl mb-1">🐟</div>
              <div className="font-bold text-gray-900">{bigFish.managerName}</div>
              <div className="kit-stat-label">Best in the world</div>
              <div className="text-xs text-blue-600 font-semibold mt-1">{formatRank(bigFish.currentGlobalRank)}</div>
            </div>
          )}
          {worldData.length > 1 && (
            <div className="kit-card p-5 text-center col-span-2 md:col-span-1 kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
              <div className="text-2xl mb-1">🌍</div>
              <div className="font-bold text-gray-900">{worldData[worldData.length - 1].managerName}</div>
              <div className="kit-stat-label">Worst globally</div>
              <div className="text-xs text-red-600 font-semibold mt-1">{formatRank(worldData[worldData.length - 1].currentGlobalRank)}</div>
            </div>
          )}
        </div>

        {/* Global Rankings */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "350ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-world-dark)" }}>
            <h2 className="kit-headline text-xl text-white">Global Rankings</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {worldData.map((manager, index) => {
              const percentile = getPercentile(manager.currentGlobalRank, totalPlayers);
              return (
                <div
                  key={manager.managerName}
                  className={`p-5 kit-table-row ${
                    index === 0 ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-300 w-8 text-center" style={{ fontFamily: "var(--font-display)" }}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{manager.managerName}</span>
                        <span className="kit-badge bg-blue-100 text-blue-700">
                          Top {percentile.toFixed(1)}%
                        </span>
                        {manager.currentLeagueRank === 1 && worldData.length > 1 && index > 0 && (
                          <span className="kit-badge bg-amber-100 text-amber-700">League #1 tho</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 italic">{manager.teamName}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span>Best: <strong className="text-green-600">{formatRank(manager.bestGlobalRank.rank)}</strong> (GW{manager.bestGlobalRank.gameweek})</span>
                        <span>Worst: <strong className="text-red-600">{formatRank(manager.worstGlobalRank.rank)}</strong> (GW{manager.worstGlobalRank.gameweek})</span>
                        <span className="hidden sm:inline">League rank: <strong>#{manager.currentLeagueRank}</strong></span>
                      </div>

                      {/* Percentile bar */}
                      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(percentile, 100)}%`,
                            background: percentile > 80 ? "#059669" : percentile > 50 ? "#2563EB" : percentile > 20 ? "#D97706" : "#DC2626",
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-600" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", lineHeight: 1 }}>
                        {formatRank(manager.currentGlobalRank)}
                      </div>
                      <div className="kit-stat-label text-gray-400">global rank</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            <p>
              Out of ~11 million managers worldwide. Your mini-league is a tiny
              pond in a very large ocean.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
