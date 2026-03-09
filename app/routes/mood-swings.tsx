import { useLoaderData } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/mood-swings";
import { requireAuth } from "~/lib/pocketbase/auth";

interface MoodData {
  managerName: string;
  teamName: string;
  stdDev: number;
  avgPoints: number;
  bestWeek: { gameweek: number; points: number };
  worstWeek: { gameweek: number; points: number };
  longestWinStreak: number;
  longestLossStreak: number;
  biggestRise: { from: number; to: number; gameweek: number };
  biggestFall: { from: number; to: number; gameweek: number };
  consistencyRating: string;
}

function calcStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  const allManagers = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        gameweeks: history.current,
      };
    })
  );

  const moodData: MoodData[] = allManagers.map((manager) => {
    const points = manager.gameweeks.map((gw) => gw.points);
    const stdDev = calcStdDev(points);
    const avgPoints = points.length > 0 ? points.reduce((s, p) => s + p, 0) / points.length : 0;

    const bestWeek = manager.gameweeks.reduce(
      (best, gw) => (gw.points > best.points ? { gameweek: gw.event, points: gw.points } : best),
      { gameweek: 0, points: -Infinity }
    );
    const worstWeek = manager.gameweeks.reduce(
      (worst, gw) => (gw.points < worst.points ? { gameweek: gw.event, points: gw.points } : worst),
      { gameweek: 0, points: Infinity }
    );

    // Win/loss streaks: "win" = above league average for that GW
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let currentWin = 0;
    let currentLoss = 0;

    manager.gameweeks.forEach((gw) => {
      // Compare against league avg for that GW
      const leagueAvg =
        allManagers
          .map((m) => m.gameweeks.find((g) => g.event === gw.event)?.points ?? 0)
          .reduce((s, p) => s + p, 0) / allManagers.length;

      if (gw.points >= leagueAvg) {
        currentWin++;
        currentLoss = 0;
        longestWinStreak = Math.max(longestWinStreak, currentWin);
      } else {
        currentLoss++;
        currentWin = 0;
        longestLossStreak = Math.max(longestLossStreak, currentLoss);
      }
    });

    // Biggest rank changes
    let biggestRise = { from: 0, to: 0, gameweek: 0 };
    let biggestFall = { from: 0, to: 0, gameweek: 0 };

    for (let i = 1; i < manager.gameweeks.length; i++) {
      const prev = manager.gameweeks[i - 1].rank;
      const curr = manager.gameweeks[i].rank;
      const change = prev - curr; // positive = moved up

      if (change > (biggestRise.from - biggestRise.to)) {
        biggestRise = { from: prev, to: curr, gameweek: manager.gameweeks[i].event };
      }
      if (change < (biggestFall.from - biggestFall.to)) {
        biggestFall = { from: prev, to: curr, gameweek: manager.gameweeks[i].event };
      }
    }

    const range = bestWeek.points - worstWeek.points;
    let consistencyRating: string;
    if (stdDev < 10) consistencyRating = "Mr. Reliable";
    else if (stdDev < 15) consistencyRating = "Steady Eddie";
    else if (stdDev < 20) consistencyRating = "Mood Swinger";
    else consistencyRating = "Absolute Chaos";

    return {
      managerName: manager.name,
      teamName: manager.teamName,
      stdDev,
      avgPoints,
      bestWeek,
      worstWeek,
      longestWinStreak,
      longestLossStreak,
      biggestRise,
      biggestFall,
      consistencyRating,
    };
  });

  moodData.sort((a, b) => b.stdDev - a.stdDev);

  return { moodData };
}

export default function MoodSwings({ loaderData }: Route.ComponentProps) {
  const { moodData } = useLoaderData<typeof loader>();

  const mostChaotic = moodData[0];
  const mostConsistent = moodData[moodData.length - 1];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-mood)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-mood)" }}>
        <div className="kit-watermark">~</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-mood-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            How consistent (or chaotic) are you really?
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            The Mood<br />Swings Index
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Awards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mostChaotic && (
            <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">🌪️</div>
              <h3 className="kit-headline text-lg text-gray-900">Chaos Merchant</h3>
              <p className="text-2xl font-bold text-cyan-600 mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {mostChaotic.managerName}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Std dev: {mostChaotic.stdDev.toFixed(1)} · Range: {mostChaotic.worstWeek.points}-{mostChaotic.bestWeek.points}
              </p>
            </div>
          )}
          {mostConsistent && (
            <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "250ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">🧘</div>
              <h3 className="kit-headline text-lg text-gray-900">Mr. Reliable</h3>
              <p className="text-2xl font-bold text-cyan-600 mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {mostConsistent.managerName}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Std dev: {mostConsistent.stdDev.toFixed(1)} · Range: {mostConsistent.worstWeek.points}-{mostConsistent.bestWeek.points}
              </p>
            </div>
          )}
        </div>

        {/* All managers */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-mood-dark)" }}>
            <h2 className="kit-headline text-xl text-white">Volatility Rankings</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {moodData.map((manager, index) => (
              <div
                key={manager.managerName}
                className={`p-5 kit-table-row ${
                  index === 0 ? "bg-cyan-50 border-l-4 border-l-cyan-500" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-300 w-8 text-center" style={{ fontFamily: "var(--font-display)" }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{manager.managerName}</span>
                      <span className={`kit-badge ${
                        manager.consistencyRating === "Absolute Chaos"
                          ? "bg-red-100 text-red-700"
                          : manager.consistencyRating === "Mood Swinger"
                          ? "bg-amber-100 text-amber-700"
                          : manager.consistencyRating === "Steady Eddie"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {manager.consistencyRating}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 italic">{manager.teamName}</div>

                    {/* Heartbeat visualization */}
                    <div className="mt-3 flex items-end gap-0.5 h-8">
                      {/* Simplified bar chart showing relative performance */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Low: <strong>{manager.worstWeek.points}</strong> (GW{manager.worstWeek.gameweek})</span>
                        <span className="text-gray-300 mx-1">|</span>
                        <span>Avg: <strong>{manager.avgPoints.toFixed(0)}</strong></span>
                        <span className="text-gray-300 mx-1">|</span>
                        <span>High: <strong>{manager.bestWeek.points}</strong> (GW{manager.bestWeek.gameweek})</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                      <span>Win streak: <strong className="text-green-600">{manager.longestWinStreak}</strong> GWs</span>
                      <span>Loss streak: <strong className="text-red-600">{manager.longestLossStreak}</strong> GWs</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-600" style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: 1 }}>
                      {manager.stdDev.toFixed(1)}
                    </div>
                    <div className="kit-stat-label text-gray-400">volatility</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            <p>
              Higher volatility = more chaotic. Your season is either a
              thrilling drama or a horror movie. There's no in-between.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
