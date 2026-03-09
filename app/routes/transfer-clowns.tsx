import { useLoaderData } from "react-router";
import {
  fetchLeagueStandings,
  fetchManagerHistory,
  fetchManagerTransfers,
  fetchBootstrapStatic,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/transfer-clowns";
import { requireAuth } from "~/lib/pocketbase/auth";

interface ClownAward {
  managerName: string;
  teamName: string;
  totalTransfers: number;
  totalHits: number;
  hitsCost: number;
  freeTransfers: number;
  wildcardsUsed: number;
  mostExpensiveIn: { name: string; cost: number } | null;
  cheapestIn: { name: string; cost: number } | null;
  transfersPerGW: number;
  biggestHitGW: { gameweek: number; cost: number };
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const config = getEnvConfig();
  const [leagueData, bootstrapData] = await Promise.all([
    fetchLeagueStandings(config.fplLeagueId),
    fetchBootstrapStatic(),
  ]);

  const playerMap = new Map<number, string>();
  const playerCostMap = new Map<number, number>();
  bootstrapData.elements.forEach((el) => {
    playerMap.set(el.id, el.web_name);
    playerCostMap.set(el.id, el.now_cost);
  });

  const clownData: ClownAward[] = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const managerId = manager.entry.toString();
      const [history, transfers] = await Promise.all([
        fetchManagerHistory(managerId),
        fetchManagerTransfers(managerId),
      ]);

      const totalTransfers = transfers.length;
      const totalHitsCost = history.current.reduce(
        (sum, gw) => sum + gw.event_transfers_cost,
        0
      );
      const freeTransfersUsed = totalTransfers - totalHitsCost / 4;

      // Find the biggest hit gameweek
      const biggestHitGW = history.current.reduce(
        (worst, gw) =>
          gw.event_transfers_cost > worst.cost
            ? { gameweek: gw.event, cost: gw.event_transfers_cost }
            : worst,
        { gameweek: 0, cost: 0 }
      );

      // Most expensive player brought in
      let mostExpensiveIn: { name: string; cost: number } | null = null;
      let cheapestIn: { name: string; cost: number } | null = null;
      transfers.forEach((t) => {
        const name = playerMap.get(t.element_in) ?? `Player #${t.element_in}`;
        const cost = t.element_in_cost / 10;
        if (!mostExpensiveIn || cost > mostExpensiveIn.cost) {
          mostExpensiveIn = { name, cost };
        }
        if (!cheapestIn || cost < cheapestIn.cost) {
          cheapestIn = { name, cost };
        }
      });

      const wildcards = history.chips.filter((c) => c.name === "wildcard").length;
      const gwsPlayed = history.current.length;

      return {
        managerName: manager.player_name,
        teamName: manager.entry_name,
        totalTransfers,
        totalHits: totalHitsCost / 4,
        hitsCost: totalHitsCost,
        freeTransfers: Math.max(0, Math.round(freeTransfersUsed)),
        wildcardsUsed: wildcards,
        mostExpensiveIn,
        cheapestIn,
        transfersPerGW: gwsPlayed > 0 ? totalTransfers / gwsPlayed : 0,
        biggestHitGW: biggestHitGW,
      };
    })
  );

  clownData.sort((a, b) => b.hitsCost - a.hitsCost);

  return { clownData };
}

export default function TransferClowns({ loaderData }: Route.ComponentProps) {
  const { clownData } = useLoaderData<typeof loader>();

  const totalHitPoints = clownData.reduce((sum, m) => sum + m.hitsCost, 0);
  const mostTransfers = clownData.reduce((max, m) =>
    m.totalTransfers > max.totalTransfers ? m : max
  );
  const biggestSingleHit = clownData.reduce((max, m) =>
    m.biggestHitGW.cost > max.biggestHitGW.cost ? m : max
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-clowns)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-clowns)" }}>
        <div className="kit-watermark">-4</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-clowns-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Hits taken, money wasted, knees jerked
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Transfer Market<br />Clown Awards
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Award cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
            <div className="text-3xl mb-2">🤡</div>
            <div className="kit-stat-number text-amber-600">{totalHitPoints}</div>
            <div className="kit-stat-label">Total hit points lost</div>
          </div>
          <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "250ms" } as React.CSSProperties}>
            <div className="text-3xl mb-2">🏃</div>
            <div className="kit-stat-number text-amber-600">{mostTransfers.totalTransfers}</div>
            <div className="kit-stat-label">Most transfers</div>
            <div className="text-xs text-gray-400 mt-1">{mostTransfers.managerName}</div>
          </div>
          <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
            <div className="text-3xl mb-2">💥</div>
            <div className="kit-stat-number text-amber-600">-{biggestSingleHit.biggestHitGW.cost}</div>
            <div className="kit-stat-label">Biggest single hit</div>
            <div className="text-xs text-gray-400 mt-1">
              {biggestSingleHit.managerName} · GW{biggestSingleHit.biggestHitGW.gameweek}
            </div>
          </div>
        </div>

        {/* Clown Rankings */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "350ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-clowns-dark)" }}>
            <h2 className="kit-headline text-xl text-white">Clown Rankings (by points lost to hits)</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {clownData.map((manager, index) => (
              <div
                key={manager.managerName}
                className={`p-5 kit-table-row ${
                  index === 0 ? "bg-amber-50 border-l-4 border-l-amber-500" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-300 w-8 text-center" style={{ fontFamily: "var(--font-display)" }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{manager.managerName}</span>
                      {index === 0 && (
                        <span className="kit-badge bg-amber-100 text-amber-700">Head Clown</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 italic">{manager.teamName}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span>{manager.totalTransfers} transfers ({manager.transfersPerGW.toFixed(1)}/gw)</span>
                      <span className="text-red-600 font-semibold">-{manager.hitsCost} from hits ({manager.totalHits} hits)</span>
                      {manager.wildcardsUsed > 0 && (
                        <span>{manager.wildcardsUsed} wildcard{manager.wildcardsUsed > 1 ? "s" : ""}</span>
                      )}
                      {manager.mostExpensiveIn && (
                        <span className="hidden sm:inline">
                          Splurge: {manager.mostExpensiveIn.name} (£{manager.mostExpensiveIn.cost}m)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-600" style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: 1 }}>
                      -{manager.hitsCost}
                    </div>
                    <div className="kit-stat-label text-gray-400">pts lost</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            <p>
              A combined <strong>{totalHitPoints}</strong> points thrown away on hits.
              That's not transfer strategy, that's panic buying.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
