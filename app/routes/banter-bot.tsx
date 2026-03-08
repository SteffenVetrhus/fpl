import { useLoaderData } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/banter-bot";

interface ManagerRoastData {
  name: string;
  teamName: string;
  rank: number;
  totalPoints: number;
  benchPoints: number;
  hitsCost: number;
  bestGW: { gw: number; points: number };
  worstGW: { gw: number; points: number };
  avgPoints: number;
  consistency: number;
  totalTransfers: number;
}

interface RoastLine {
  target: string;
  category: string;
  roast: string;
}

function generateRoasts(managers: ManagerRoastData[]): RoastLine[] {
  const roasts: RoastLine[] = [];
  const sorted = [...managers].sort((a, b) => a.rank - b.rank);
  const last = sorted[sorted.length - 1];
  const first = sorted[0];

  // Last place roast
  if (last && sorted.length > 1) {
    roasts.push({
      target: last.name,
      category: "Bottom Feeder",
      roast: `${last.name} is in last place with ${last.totalPoints} points. Even a random team generator would be embarrassed.`,
    });
  }

  // Leader roast
  if (first) {
    const gap = sorted.length > 1 ? first.totalPoints - sorted[1].totalPoints : 0;
    if (gap > 50) {
      roasts.push({
        target: first.name,
        category: "Runaway Leader",
        roast: `${first.name} leads by ${gap} points. At this point, everyone else is just playing for second. Congrats on ruining the competition.`,
      });
    } else if (gap < 10 && sorted.length > 1) {
      roasts.push({
        target: first.name,
        category: "Barely Hanging On",
        roast: `${first.name} is "winning" by just ${gap} points. That's not a lead, that's a rounding error. ${sorted[1].name} is breathing down your neck.`,
      });
    }
  }

  // Bench warmer roast
  const worstBench = [...managers].sort((a, b) => b.benchPoints - a.benchPoints)[0];
  if (worstBench && worstBench.benchPoints > 30) {
    roasts.push({
      target: worstBench.name,
      category: "Bench Scholar",
      roast: `${worstBench.name} left ${worstBench.benchPoints} points on the bench this season. That's not a bench, it's a five-star squad having a holiday.`,
    });
  }

  // Hits cost roast
  const mostHits = [...managers].sort((a, b) => b.hitsCost - a.hitsCost)[0];
  if (mostHits && mostHits.hitsCost > 0) {
    roasts.push({
      target: mostHits.name,
      category: "Knee-Jerk King",
      roast: `${mostHits.name} has spent ${mostHits.hitsCost} points on transfer hits. That's not a strategy, that's a panic attack with a login.`,
    });
  }

  // Inconsistency roast
  const chaotic = [...managers].sort((a, b) => b.consistency - a.consistency)[0];
  if (chaotic) {
    const range = chaotic.bestGW.points - chaotic.worstGW.points;
    if (range > 50) {
      roasts.push({
        target: chaotic.name,
        category: "Chaos Agent",
        roast: `${chaotic.name} scored ${chaotic.bestGW.points} in GW${chaotic.bestGW.gw} and ${chaotic.worstGW.points} in GW${chaotic.worstGW.gw}. That's not a season, that's a mood disorder.`,
      });
    }
  }

  // Best single GW but still losing
  const bestSingleGW = [...managers].sort((a, b) => b.bestGW.points - a.bestGW.points)[0];
  if (bestSingleGW && bestSingleGW.rank > 1 && sorted.length > 1) {
    roasts.push({
      target: bestSingleGW.name,
      category: "One-Hit Wonder",
      roast: `${bestSingleGW.name} had the league's best gameweek (${bestSingleGW.bestGW.points} in GW${bestSingleGW.bestGW.gw}) but is still ranked #${bestSingleGW.rank}. Peak followed by freefall.`,
    });
  }

  // Transfer addict
  const mostTransfers = [...managers].sort((a, b) => b.totalTransfers - a.totalTransfers)[0];
  if (mostTransfers && mostTransfers.totalTransfers > managers[0].totalTransfers * 1.5) {
    roasts.push({
      target: mostTransfers.name,
      category: "Transfer Addict",
      roast: `${mostTransfers.name} made ${mostTransfers.totalTransfers} transfers. At this point, the FPL app should require a prescription.`,
    });
  }

  // Worst GW overall
  const worstSingle = [...managers].sort((a, b) => a.worstGW.points - b.worstGW.points)[0];
  if (worstSingle && worstSingle.worstGW.points < 30) {
    roasts.push({
      target: worstSingle.name,
      category: "Rock Bottom",
      roast: `${worstSingle.name} scored just ${worstSingle.worstGW.points} points in GW${worstSingle.worstGW.gw}. Most people score more than that by accident.`,
    });
  }

  // Generic comparison roasts between managers
  if (sorted.length >= 2) {
    const gap = sorted[sorted.length - 1].totalPoints - sorted[sorted.length - 2].totalPoints;
    if (gap > 20) {
      roasts.push({
        target: sorted[sorted.length - 1].name,
        category: "Lonely at the Bottom",
        roast: `${sorted[sorted.length - 1].name} is ${gap} points behind ${sorted[sorted.length - 2].name}. Even the relegation battle has been lost.`,
      });
    }
  }

  return roasts;
}

export async function loader() {
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  const managerData: ManagerRoastData[] = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      const gws = history.current;
      const points = gws.map((g) => g.points);
      const mean = points.length > 0 ? points.reduce((s, p) => s + p, 0) / points.length : 0;
      const variance = points.length > 0 ? points.reduce((s, p) => s + (p - mean) ** 2, 0) / points.length : 0;

      const bestGW = gws.reduce(
        (best, gw) => (gw.points > best.points ? { gw: gw.event, points: gw.points } : best),
        { gw: 0, points: -Infinity }
      );
      const worstGW = gws.reduce(
        (worst, gw) => (gw.points < worst.points ? { gw: gw.event, points: gw.points } : worst),
        { gw: 0, points: Infinity }
      );

      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        rank: manager.rank,
        totalPoints: manager.total,
        benchPoints: gws.reduce((s, g) => s + g.points_on_bench, 0),
        hitsCost: gws.reduce((s, g) => s + g.event_transfers_cost, 0),
        bestGW,
        worstGW,
        avgPoints: mean,
        consistency: Math.sqrt(variance),
        totalTransfers: gws.reduce((s, g) => s + g.event_transfers, 0),
      };
    })
  );

  const roasts = generateRoasts(managerData);

  return {
    managerData,
    roasts,
    leagueName: leagueData.league.name,
  };
}

export default function BanterBot({ loaderData }: Route.ComponentProps) {
  const { managerData, roasts, leagueName } = useLoaderData<typeof loader>();

  const CATEGORY_COLORS: Record<string, string> = {
    "Bottom Feeder": "bg-red-100 text-red-700",
    "Runaway Leader": "bg-green-100 text-green-700",
    "Barely Hanging On": "bg-amber-100 text-amber-700",
    "Bench Scholar": "bg-orange-100 text-orange-700",
    "Knee-Jerk King": "bg-purple-100 text-purple-700",
    "Chaos Agent": "bg-cyan-100 text-cyan-700",
    "One-Hit Wonder": "bg-blue-100 text-blue-700",
    "Transfer Addict": "bg-pink-100 text-pink-700",
    "Rock Bottom": "bg-red-100 text-red-700",
    "Lonely at the Bottom": "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-banter)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-banter)" }}>
        <div className="kit-watermark">LOL</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-banter-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Automated roasts based on your terrible decisions
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            The Banter<br />Bot
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Season Summary */}
        <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
          <h2 className="kit-headline text-xl text-gray-900 mb-2">
            {leagueName}: Season Verdict
          </h2>
          <p className="text-sm text-gray-500">
            {managerData.length} managers. {roasts.length} roasts. Zero mercy.
          </p>
        </div>

        {/* Roast Cards */}
        <div className="space-y-4">
          {roasts.map((roast, index) => (
            <div
              key={index}
              className="kit-card p-6 kit-animate-slide-up"
              style={{ "--delay": `${250 + index * 60}ms` } as React.CSSProperties}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔥</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-bold text-gray-900">{roast.target}</span>
                    <span className={`kit-badge ${CATEGORY_COLORS[roast.category] ?? "bg-gray-100 text-gray-700"}`}>
                      {roast.category}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{roast.roast}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {roasts.length === 0 && (
          <div className="kit-card p-12 text-center kit-animate-slide-up" style={{ "--delay": "250ms" } as React.CSSProperties}>
            <div className="text-4xl mb-4">🤷</div>
            <p className="text-xl text-gray-400">Not enough data to roast anyone yet. Play more gameweeks!</p>
          </div>
        )}

        {/* Manager snapshots */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": `${300 + roasts.length * 60}ms` } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-banter-dark)" }}>
            <h2 className="kit-headline text-xl text-white">Manager Rap Sheets</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[...managerData]
              .sort((a, b) => a.rank - b.rank)
              .map((manager) => (
                <div key={manager.name} className="p-5 kit-table-row">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-300 w-8 text-center" style={{ fontFamily: "var(--font-display)" }}>
                      {manager.rank}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{manager.name}</span>
                      <div className="text-xs text-gray-400 italic">{manager.teamName}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span>{manager.totalPoints} pts</span>
                        <span>Best: {manager.bestGW.points} (GW{manager.bestGW.gw})</span>
                        <span>Worst: {manager.worstGW.points} (GW{manager.worstGW.gw})</span>
                        <span>Bench: {manager.benchPoints}</span>
                        <span className="text-red-600">Hits: -{manager.hitsCost}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="text-center text-white/30 text-xs pb-8">
          <p>All roasts generated from cold, hard data. Don't shoot the messenger.</p>
        </div>
      </main>
    </div>
  );
}
