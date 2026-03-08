import { useLoaderData } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/bench-shame";

interface BenchData {
  managerName: string;
  teamName: string;
  totalBenchPoints: number;
  worstBenchGW: { gameweek: number; points: number };
  avgBenchPoints: number;
  gameweeksWithHighBench: number;
  couldHaveWonGWs: number;
}

export async function loader() {
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  const allManagerData = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        gameweeks: history.current,
      };
    })
  );

  // Calculate bench shame data
  const benchData: BenchData[] = allManagerData.map((manager) => {
    const totalBenchPoints = manager.gameweeks.reduce(
      (sum, gw) => sum + gw.points_on_bench,
      0
    );

    const worstBench = manager.gameweeks.reduce(
      (worst, gw) =>
        gw.points_on_bench > worst.points
          ? { gameweek: gw.event, points: gw.points_on_bench }
          : worst,
      { gameweek: 0, points: 0 }
    );

    const avgBenchPoints =
      manager.gameweeks.length > 0
        ? totalBenchPoints / manager.gameweeks.length
        : 0;

    const gameweeksWithHighBench = manager.gameweeks.filter(
      (gw) => gw.points_on_bench >= 10
    ).length;

    // Check how many GWs bench points would have made them the winner
    let couldHaveWonGWs = 0;
    manager.gameweeks.forEach((gw) => {
      if (gw.points_on_bench > 0) {
        const actualPoints = gw.points;
        const potentialPoints = actualPoints + gw.points_on_bench;
        // Check if adding bench points would beat all other managers
        const otherManagersBest = allManagerData
          .filter((m) => m.name !== manager.name)
          .map((m) => {
            const otherGw = m.gameweeks.find((g) => g.event === gw.event);
            return otherGw?.points ?? 0;
          });
        const maxOther = Math.max(...otherManagersBest, 0);
        // They didn't win but would have with bench points
        if (actualPoints <= maxOther && potentialPoints > maxOther) {
          couldHaveWonGWs++;
        }
      }
    });

    return {
      managerName: manager.name,
      teamName: manager.teamName,
      totalBenchPoints,
      worstBenchGW: worstBench,
      avgBenchPoints,
      gameweeksWithHighBench,
      couldHaveWonGWs,
    };
  });

  benchData.sort((a, b) => b.totalBenchPoints - a.totalBenchPoints);

  return { benchData };
}

export default function BenchShame({ loaderData }: Route.ComponentProps) {
  const { benchData } = useLoaderData<typeof loader>();

  const worstOverall = benchData.reduce((worst, m) =>
    m.worstBenchGW.points > worst.worstBenchGW.points ? m : worst
  );

  const totalWasted = benchData.reduce((sum, m) => sum + m.totalBenchPoints, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-bench)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-bench)" }}>
        <div className="kit-watermark">BENCH</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-bench-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Points left to rot on the bench
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Bench Warmer<br />Hall of Shame
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
            <div className="kit-stat-number text-red-600">{totalWasted}</div>
            <div className="kit-stat-label">Total wasted points</div>
          </div>
          <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "250ms" } as React.CSSProperties}>
            <div className="kit-stat-number text-red-600">{worstOverall.worstBenchGW.points}</div>
            <div className="kit-stat-label">Worst single bench</div>
            <div className="text-xs text-gray-400 mt-1">
              {worstOverall.managerName} · GW{worstOverall.worstBenchGW.gameweek}
            </div>
          </div>
          <div className="kit-card p-5 text-center col-span-2 md:col-span-1 kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
            <div className="kit-stat-number text-red-600">
              {benchData.reduce((sum, m) => sum + m.couldHaveWonGWs, 0)}
            </div>
            <div className="kit-stat-label">GWs lost to benching</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "350ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-bench-dark)" }}>
            <h2 className="kit-headline text-xl text-white">The Shame Rankings</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {benchData.map((manager, index) => (
              <div
                key={manager.managerName}
                className={`p-5 flex items-center gap-4 kit-table-row ${
                  index === 0 ? "bg-red-50 border-l-4 border-l-red-500" : ""
                }`}
              >
                <div className="text-2xl font-bold text-gray-300 w-8 text-center" style={{ fontFamily: "var(--font-display)" }}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{manager.managerName}</span>
                    {index === 0 && (
                      <span className="kit-badge bg-red-100 text-red-700">Chief Bench Warmer</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 italic truncate">{manager.teamName}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                    <span>Worst GW: <strong className="text-red-600">{manager.worstBenchGW.points}pts</strong> (GW{manager.worstBenchGW.gameweek})</span>
                    <span className="hidden sm:inline">Avg: <strong>{manager.avgBenchPoints.toFixed(1)}</strong>/wk</span>
                    {manager.couldHaveWonGWs > 0 && (
                      <span className="text-red-600 font-semibold">
                        Could've won {manager.couldHaveWonGWs} GW{manager.couldHaveWonGWs > 1 ? "s" : ""}!
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-red-600" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 5vw, 2rem)", lineHeight: 1 }}>
                    {manager.totalBenchPoints}
                  </div>
                  <div className="kit-stat-label text-gray-400">wasted pts</div>
                </div>
              </div>
            ))}
          </div>

          {/* Banter footer */}
          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            {benchData[0] && (
              <p>
                <strong>{benchData[0].managerName}</strong> left{" "}
                <strong>{benchData[0].totalBenchPoints}</strong> points gathering
                dust. That's not a bench, that's a graveyard.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
