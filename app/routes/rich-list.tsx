import { useLoaderData } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/rich-list";
import { requireAuth } from "~/lib/pocketbase/auth";

interface RichListEntry {
  managerName: string;
  teamName: string;
  currentValue: number;
  currentBank: number;
  totalSquadValue: number;
  startingValue: number;
  valueChange: number;
  valueChangePercent: number;
  peakValue: { value: number; gameweek: number };
  lowestValue: { value: number; gameweek: number };
  pointsPerMillion: number;
  totalPoints: number;
  highestBank: { bank: number; gameweek: number };
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  const richListData: RichListEntry[] = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      const gws = history.current;

      if (gws.length === 0) {
        return {
          managerName: manager.player_name,
          teamName: manager.entry_name,
          currentValue: 0,
          currentBank: 0,
          totalSquadValue: 0,
          startingValue: 0,
          valueChange: 0,
          valueChangePercent: 0,
          peakValue: { value: 0, gameweek: 0 },
          lowestValue: { value: 0, gameweek: 0 },
          pointsPerMillion: 0,
          totalPoints: 0,
          highestBank: { bank: 0, gameweek: 0 },
        };
      }

      const latest = gws[gws.length - 1];
      const first = gws[0];
      const currentValue = latest.value / 10;
      const currentBank = latest.bank / 10;
      const totalSquadValue = currentValue + currentBank;
      const startingValue = (first.value + first.bank) / 10;
      const valueChange = totalSquadValue - startingValue;

      const peakValue = gws.reduce(
        (peak, gw) => {
          const total = (gw.value + gw.bank) / 10;
          return total > peak.value ? { value: total, gameweek: gw.event } : peak;
        },
        { value: 0, gameweek: 0 }
      );

      const lowestValue = gws.reduce(
        (low, gw) => {
          const total = (gw.value + gw.bank) / 10;
          return total < low.value ? { value: total, gameweek: gw.event } : low;
        },
        { value: Infinity, gameweek: 0 }
      );

      const highestBank = gws.reduce(
        (high, gw) => {
          const bank = gw.bank / 10;
          return bank > high.bank ? { bank, gameweek: gw.event } : high;
        },
        { bank: 0, gameweek: 0 }
      );

      return {
        managerName: manager.player_name,
        teamName: manager.entry_name,
        currentValue,
        currentBank,
        totalSquadValue,
        startingValue,
        valueChange,
        valueChangePercent: startingValue > 0 ? (valueChange / startingValue) * 100 : 0,
        peakValue,
        lowestValue,
        pointsPerMillion: totalSquadValue > 0 ? latest.total_points / totalSquadValue : 0,
        totalPoints: latest.total_points,
        highestBank,
      };
    })
  );

  richListData.sort((a, b) => b.totalSquadValue - a.totalSquadValue);

  return { richListData };
}

export default function RichList({ loaderData }: Route.ComponentProps) {
  const { richListData } = useLoaderData<typeof loader>();

  const bestROI = [...richListData].sort((a, b) => b.pointsPerMillion - a.pointsPerMillion)[0];
  const biggestGrowth = [...richListData].sort((a, b) => b.valueChange - a.valueChange)[0];
  const cashHoarder = [...richListData].sort((a, b) => b.highestBank.bank - a.highestBank.bank)[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-richlist)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-richlist)" }}>
        <div className="kit-watermark">£</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-richlist-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Follow the money, expose the hoarders
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Rich List &<br />Poverty Report
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Award cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {biggestGrowth && (
            <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">📈</div>
              <h3 className="kit-headline text-sm text-gray-900">Warren Buffett</h3>
              <p className="font-bold text-green-600 text-lg mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {biggestGrowth.managerName}
              </p>
              <p className="text-xs text-gray-400">+£{biggestGrowth.valueChange.toFixed(1)}m growth</p>
            </div>
          )}
          {bestROI && (
            <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "250ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="kit-headline text-sm text-gray-900">Best ROI</h3>
              <p className="font-bold text-green-600 text-lg mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {bestROI.managerName}
              </p>
              <p className="text-xs text-gray-400">{bestROI.pointsPerMillion.toFixed(1)} pts/£m</p>
            </div>
          )}
          {cashHoarder && (
            <div className="kit-card p-5 text-center kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">🐉</div>
              <h3 className="kit-headline text-sm text-gray-900">Cash Hoarder</h3>
              <p className="font-bold text-green-600 text-lg mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {cashHoarder.managerName}
              </p>
              <p className="text-xs text-gray-400">£{cashHoarder.highestBank.bank.toFixed(1)}m in bank (GW{cashHoarder.highestBank.gameweek})</p>
            </div>
          )}
        </div>

        {/* Rich List Table */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "350ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-richlist-dark)" }}>
            <h2 className="kit-headline text-xl text-white">Squad Value Rankings</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {richListData.map((manager, index) => (
              <div
                key={manager.managerName}
                className={`p-5 kit-table-row ${
                  index === 0 ? "bg-green-50 border-l-4 border-l-green-500" : ""
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
                        <span className="kit-badge bg-green-100 text-green-700">Richest</span>
                      )}
                      {index === richListData.length - 1 && richListData.length > 1 && (
                        <span className="kit-badge bg-red-100 text-red-700">Broke</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 italic">{manager.teamName}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span>
                        Squad: <strong>£{manager.currentValue.toFixed(1)}m</strong>
                      </span>
                      <span>
                        Bank: <strong>£{manager.currentBank.toFixed(1)}m</strong>
                      </span>
                      <span className={manager.valueChange >= 0 ? "text-green-600" : "text-red-600"}>
                        {manager.valueChange >= 0 ? "+" : ""}£{manager.valueChange.toFixed(1)}m ({manager.valueChangePercent.toFixed(1)}%)
                      </span>
                      <span className="hidden sm:inline">
                        ROI: <strong>{manager.pointsPerMillion.toFixed(1)}</strong> pts/£m
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", lineHeight: 1 }}>
                      £{manager.totalSquadValue.toFixed(1)}m
                    </div>
                    <div className="kit-stat-label text-gray-400">total value</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            <p>
              Money can't buy you class, but it can buy you a really expensive
              bench warmer.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
