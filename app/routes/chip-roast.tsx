import { useLoaderData } from "react-router";
import {
  fetchLeagueStandings,
  fetchManagerHistory,
  fetchBootstrapStatic,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/chip-roast";

interface ChipUsage {
  chipName: string;
  chipLabel: string;
  gameweek: number;
  pointsScored: number;
  leagueAvgThatGW: number;
  globalAvgThatGW: number;
  benchPointsThatGW: number;
  wasWorthIt: boolean;
}

interface ChipRoastData {
  managerName: string;
  teamName: string;
  chipsUsed: ChipUsage[];
  chipsRemaining: string[];
  totalChipBonus: number;
}

const CHIP_LABELS: Record<string, string> = {
  wildcard: "Wildcard",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
  freehit: "Free Hit",
};

const CHIP_EMOJIS: Record<string, string> = {
  wildcard: "🔄",
  bboost: "💺",
  "3xc": "👑",
  freehit: "🆓",
};

const ALL_CHIPS = ["wildcard", "bboost", "3xc", "freehit"];

export async function loader() {
  const config = getEnvConfig();
  const [leagueData, bootstrapData] = await Promise.all([
    fetchLeagueStandings(config.fplLeagueId),
    fetchBootstrapStatic(),
  ]);

  // Build gameweek average scores from bootstrap
  const gwAverages = new Map<number, number>();
  bootstrapData.events.forEach((e) => {
    if (e.finished) {
      gwAverages.set(e.id, e.average_entry_score);
    }
  });

  const allManagers = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        gameweeks: history.current,
        chips: history.chips,
      };
    })
  );

  const chipRoastData: ChipRoastData[] = allManagers.map((manager) => {
    const chipsUsed: ChipUsage[] = manager.chips.map((chip) => {
      const gw = manager.gameweeks.find((g) => g.event === chip.event);
      const pointsScored = gw?.points ?? 0;
      const benchPoints = gw?.points_on_bench ?? 0;

      // Calculate league average for that GW
      const leagueAvg =
        allManagers
          .map((m) => m.gameweeks.find((g) => g.event === chip.event)?.points ?? 0)
          .reduce((s, p) => s + p, 0) / allManagers.length;

      const globalAvg = gwAverages.get(chip.event) ?? 0;

      return {
        chipName: chip.name,
        chipLabel: CHIP_LABELS[chip.name] ?? chip.name,
        gameweek: chip.event,
        pointsScored,
        leagueAvgThatGW: leagueAvg,
        globalAvgThatGW: globalAvg,
        benchPointsThatGW: benchPoints,
        wasWorthIt: pointsScored > leagueAvg,
      };
    });

    const usedChipNames = manager.chips.map((c) => c.name);
    const chipsRemaining = ALL_CHIPS.filter(
      (c) => !usedChipNames.includes(c)
    );

    const totalChipBonus = chipsUsed.reduce(
      (sum, c) => sum + (c.pointsScored - c.leagueAvgThatGW),
      0
    );

    return {
      managerName: manager.name,
      teamName: manager.teamName,
      chipsUsed,
      chipsRemaining,
      totalChipBonus,
    };
  });

  chipRoastData.sort((a, b) => b.totalChipBonus - a.totalChipBonus);

  return { chipRoastData };
}

export default function ChipRoast({ loaderData }: Route.ComponentProps) {
  const { chipRoastData } = useLoaderData<typeof loader>();

  const bestChipUser = chipRoastData[0];
  const worstChipUser = chipRoastData[chipRoastData.length - 1];

  // Find worst single chip play
  const worstSingleChip = chipRoastData.reduce<{ manager: string; chip: ChipUsage } | null>(
    (worst, m) => {
      return m.chipsUsed.reduce<{ manager: string; chip: ChipUsage } | null>((w, c) => {
        const diff = c.pointsScored - c.leagueAvgThatGW;
        if (!w) return { manager: m.managerName, chip: c };
        const prevDiff = w.chip.pointsScored - w.chip.leagueAvgThatGW;
        return diff < prevDiff ? { manager: m.managerName, chip: c } : w;
      }, worst);
    },
    null
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-chips)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-chips)" }}>
        <div className="kit-watermark">CHIP</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-chips-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Did your chips actually help? Probably not.
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Chip Timing<br />Roast
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Awards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestChipUser && (
            <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">🎰</div>
              <h3 className="kit-headline text-lg text-gray-900">Best Chip Timing</h3>
              <p className="font-bold text-purple-600 text-lg mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {bestChipUser.managerName}
              </p>
              <p className="text-xs text-gray-400">+{bestChipUser.totalChipBonus.toFixed(0)} pts above avg with chips</p>
            </div>
          )}
          {worstSingleChip && (
            <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "250ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">💀</div>
              <h3 className="kit-headline text-lg text-gray-900">Worst Chip Play</h3>
              <p className="font-bold text-purple-600 text-lg mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {worstSingleChip.manager}
              </p>
              <p className="text-xs text-gray-400">
                {worstSingleChip.chip.chipLabel} in GW{worstSingleChip.chip.gameweek}: {worstSingleChip.chip.pointsScored}pts (avg was{" "}
                {worstSingleChip.chip.leagueAvgThatGW.toFixed(0)})
              </p>
            </div>
          )}
        </div>

        {/* Chip details per manager */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-chips-dark)" }}>
            <h2 className="kit-headline text-xl text-white">Chip Usage Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {chipRoastData.map((manager, index) => (
              <div
                key={manager.managerName}
                className={`p-5 kit-table-row ${
                  index === chipRoastData.length - 1 && chipRoastData.length > 1
                    ? "bg-red-50 border-l-4 border-l-red-500"
                    : index === 0
                    ? "bg-purple-50 border-l-4 border-l-purple-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{manager.managerName}</span>
                      <span className={`kit-badge ${
                        manager.totalChipBonus > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {manager.totalChipBonus > 0 ? "+" : ""}{manager.totalChipBonus.toFixed(0)} vs avg
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 italic">{manager.teamName}</div>
                  </div>
                </div>

                {/* Chips used */}
                <div className="space-y-2">
                  {manager.chipsUsed.map((chip, ci) => {
                    const diff = chip.pointsScored - chip.leagueAvgThatGW;
                    return (
                      <div
                        key={ci}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          diff >= 0 ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <span className="text-xl">{CHIP_EMOJIS[chip.chipName] ?? "🎫"}</span>
                        <div className="flex-1">
                          <span className="font-medium text-sm text-gray-900">{chip.chipLabel}</span>
                          <span className="text-xs text-gray-400 ml-2">GW{chip.gameweek}</span>
                        </div>
                        <div className="text-right text-sm">
                          <span className="font-bold text-gray-900">{chip.pointsScored}pts</span>
                          <span className={`ml-2 text-xs font-semibold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ({diff >= 0 ? "+" : ""}{diff.toFixed(0)} vs avg)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chips remaining */}
                {manager.chipsRemaining.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {manager.chipsRemaining.map((chip) => (
                      <span key={chip} className="kit-badge bg-gray-100 text-gray-500">
                        {CHIP_EMOJIS[chip] ?? "🎫"} {CHIP_LABELS[chip] ?? chip} left
                      </span>
                    ))}
                  </div>
                )}

                {manager.chipsUsed.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No chips played yet. Saving for the rapture?</p>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            <p>
              Chip timing is an art. Most of you are finger-painting.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
