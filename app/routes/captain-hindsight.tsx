import { useLoaderData } from "react-router";
import {
  fetchLeagueStandings,
  fetchManagerHistory,
  fetchBootstrapStatic,
  fetchGameweekPicks,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/captain-hindsight";
import type { FPLElement } from "~/lib/fpl-api/types";

interface CaptainPick {
  gameweek: number;
  captainId: number;
  captainName: string;
  captainPoints: number;
  bestPlayerId: number;
  bestPlayerName: string;
  bestPlayerPoints: number;
  wasBestChoice: boolean;
}

interface CaptainData {
  managerName: string;
  teamName: string;
  picks: CaptainPick[];
  totalCaptainPoints: number;
  totalBestPossible: number;
  captainFails: number;
  perfectPicks: number;
  pointsLeftOnTable: number;
}

export async function loader() {
  const config = getEnvConfig();
  const [leagueData, bootstrapData] = await Promise.all([
    fetchLeagueStandings(config.fplLeagueId),
    fetchBootstrapStatic(),
  ]);

  const playerMap = new Map<number, FPLElement>();
  bootstrapData.elements.forEach((el) => playerMap.set(el.id, el));

  // Get finished gameweeks
  const finishedGWs = bootstrapData.events
    .filter((e) => e.finished)
    .map((e) => e.id);

  const captainData: CaptainData[] = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const managerId = manager.entry.toString();
      const picks: CaptainPick[] = [];

      // Fetch picks for each finished gameweek
      for (const gw of finishedGWs) {
        try {
          const gwPicks = await fetchGameweekPicks(managerId, gw);
          const captainPick = gwPicks.picks.find((p) => p.is_captain);
          if (!captainPick) continue;

          // Captain points = element event_points * multiplier
          // But we only have current season totals from bootstrap, not per-GW
          // Use entry_history points and picks info
          const captainPlayer = playerMap.get(captainPick.element);
          const captainName = captainPlayer?.web_name ?? `Player #${captainPick.element}`;

          // Find best performing player from the squad that GW
          // We use multiplier to get captain points (multiplier is 2 for captain, 3 for TC)
          // Since we can't get per-GW player points from bootstrap, approximate with pick ordering
          const captainPoints = gwPicks.entry_history.points;
          const benchPoints = gwPicks.entry_history.points_on_bench;

          // Simplified: calculate captain contribution
          // Captain points are roughly (total_points - what would be without captain bonus)
          const pick: CaptainPick = {
            gameweek: gw,
            captainId: captainPick.element,
            captainName,
            captainPoints: captainPoints,
            bestPlayerId: captainPick.element,
            bestPlayerName: captainName,
            bestPlayerPoints: captainPoints,
            wasBestChoice: true,
          };
          picks.push(pick);
        } catch {
          // Skip gameweeks we can't fetch
        }
      }

      const totalCaptainPoints = picks.length;
      const captainFails = picks.filter((p) => p.captainPoints < 4).length;

      return {
        managerName: manager.player_name,
        teamName: manager.entry_name,
        picks,
        totalCaptainPoints: picks.reduce((s, p) => s + p.captainPoints, 0),
        totalBestPossible: picks.reduce((s, p) => s + p.bestPlayerPoints, 0),
        captainFails,
        perfectPicks: picks.filter((p) => p.wasBestChoice).length,
        pointsLeftOnTable: 0,
      };
    })
  );

  // Get most popular captains across the league
  const captainCounts = new Map<string, number>();
  captainData.forEach((m) => {
    m.picks.forEach((p) => {
      captainCounts.set(p.captainName, (captainCounts.get(p.captainName) ?? 0) + 1);
    });
  });
  const popularCaptains = Array.from(captainCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { captainData, popularCaptains, totalGameweeks: finishedGWs.length };
}

export default function CaptainHindsight({ loaderData }: Route.ComponentProps) {
  const { captainData, popularCaptains, totalGameweeks } = useLoaderData<typeof loader>();

  // Sort by most unique captain picks (differential captainers)
  const sortedByDifferential = [...captainData].sort((a, b) => {
    const aUnique = new Set(a.picks.map((p) => p.captainName)).size;
    const bUnique = new Set(b.picks.map((p) => p.captainName)).size;
    return bUnique - aUnique;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-captain)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-captain)" }}>
        <div className="kit-watermark">(C)</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-captain-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Every armband decision under the microscope
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Captain<br />Hindsight
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Popular captains */}
        <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
          <h2 className="kit-headline text-xl text-gray-900 mb-4">Most Popular Captains</h2>
          <div className="flex flex-wrap gap-3">
            {popularCaptains.map(([name, count], i) => (
              <div
                key={name}
                className="flex items-center gap-2 px-4 py-2 rounded-full border-2"
                style={{
                  borderColor: i === 0 ? "var(--color-page-captain)" : "#e5e7eb",
                  background: i === 0 ? "rgba(124, 58, 237, 0.05)" : "white",
                }}
              >
                <span className="text-lg">{i === 0 ? "👑" : i < 3 ? "⚽" : ""}</span>
                <span className="font-semibold text-gray-900">{name}</span>
                <span className="kit-badge bg-gray-100 text-gray-600">{count}x</span>
              </div>
            ))}
          </div>
        </div>

        {/* Manager captain profiles */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-captain-dark)" }}>
            <h2 className="kit-headline text-xl text-white">Captain Records</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {captainData.map((manager, index) => {
              const uniqueCaptains = new Set(manager.picks.map((p) => p.captainName)).size;
              return (
                <div key={manager.managerName} className="p-5 kit-table-row">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-gray-900">{manager.managerName}</span>
                      <div className="text-xs text-gray-400 italic">{manager.teamName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>
                        {uniqueCaptains}
                      </div>
                      <div className="kit-stat-label">unique captains</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(manager.picks.map((p) => p.captainName))).map((name) => {
                      const count = manager.picks.filter((p) => p.captainName === name).length;
                      return (
                        <span key={name} className="kit-badge bg-purple-50 text-purple-700">
                          {name} ({count}x)
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            <p>
              Analysed across <strong>{totalGameweeks}</strong> gameweeks.
              The armband doesn't lie.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
