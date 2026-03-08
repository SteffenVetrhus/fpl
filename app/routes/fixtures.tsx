import { Calendar } from "lucide-react";
import { fetchBootstrapStatic, fetchFixtures } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { buildFixtureGrid, getDifficultyColor } from "~/utils/fixture-difficulty";
import type { Route } from "./+types/fixtures";
import type { FPLFixture, FPLTeam } from "~/lib/fpl-api/types";
import type { TeamFixtureRun } from "~/utils/fixture-difficulty";

interface DoubleFixture {
  opponentShort: string;
  difficulty: number;
}

interface CellData {
  gameweek: number;
  primary: {
    opponentShort: string;
    difficulty: number;
  };
  extra: DoubleFixture | null;
  isBlank: boolean;
}

/**
 * Build enriched cell data that includes double gameweek second fixtures
 */
function buildCellData(
  grid: TeamFixtureRun[],
  allFixtures: FPLFixture[],
  teams: FPLTeam[],
  targetGWs: number[]
): Map<number, CellData[]> {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const cellMap = new Map<number, CellData[]>();

  for (const row of grid) {
    const cells: CellData[] = targetGWs.map((gw) => {
      const gwFixtures = allFixtures.filter(
        (f) =>
          f.event === gw &&
          (f.team_h === row.teamId || f.team_a === row.teamId)
      );

      if (gwFixtures.length === 0) {
        return {
          gameweek: gw,
          primary: { opponentShort: "BGW", difficulty: 0 },
          extra: null,
          isBlank: true,
        };
      }

      const first = gwFixtures[0];
      const isHome1 = first.team_h === row.teamId;
      const opp1 = teamMap.get(isHome1 ? first.team_a : first.team_h);
      const diff1 = isHome1 ? first.team_h_difficulty : first.team_a_difficulty;

      let extra: DoubleFixture | null = null;
      if (gwFixtures.length > 1) {
        const second = gwFixtures[1];
        const isHome2 = second.team_h === row.teamId;
        const opp2 = teamMap.get(isHome2 ? second.team_a : second.team_h);
        const diff2 = isHome2
          ? second.team_h_difficulty
          : second.team_a_difficulty;
        extra = {
          opponentShort: `${opp2?.short_name ?? "???"}${isHome2 ? " (H)" : " (A)"}`,
          difficulty: diff2,
        };
      }

      return {
        gameweek: gw,
        primary: {
          opponentShort: `${opp1?.short_name ?? "???"}${isHome1 ? " (H)" : " (A)"}`,
          difficulty: diff1,
        },
        extra,
        isBlank: false,
      };
    });

    cellMap.set(row.teamId, cells);
  }

  return cellMap;
}

export async function loader() {
  getEnvConfig();
  const [bootstrap, allFixtures] = await Promise.all([
    fetchBootstrapStatic(),
    fetchFixtures(),
  ]);

  const currentEvent = bootstrap.events.find((e) => e.is_current);
  const nextEvent = bootstrap.events.find((e) => e.is_next);
  const currentGW = currentEvent?.id ?? nextEvent?.id ?? 1;

  const lookAhead = 6;
  const grid = buildFixtureGrid(allFixtures, bootstrap.teams, currentGW, lookAhead);
  const targetGWs = Array.from({ length: lookAhead }, (_, i) => currentGW + i + 1);

  const cellData = buildCellData(grid, allFixtures, bootstrap.teams, targetGWs);

  const serializedCellData: Record<number, CellData[]> = {};
  for (const [teamId, cells] of cellData) {
    serializedCellData[teamId] = cells;
  }

  return {
    grid,
    cellData: serializedCellData,
    targetGWs,
    currentGW,
  };
}

const LEGEND_ITEMS = [
  { difficulty: 1, label: "FDR 1", description: "Very Easy" },
  { difficulty: 2, label: "FDR 2", description: "Easy" },
  { difficulty: 3, label: "FDR 3", description: "Medium" },
  { difficulty: 4, label: "FDR 4", description: "Hard" },
  { difficulty: 5, label: "FDR 5", description: "Very Hard" },
  { difficulty: 0, label: "BGW", description: "Blank" },
];

export default function FixturesPage({ loaderData }: Route.ComponentProps) {
  const { grid, cellData, targetGWs, currentGW } = loaderData;

  return (
    <div className="min-h-screen" style={{ background: "#0D9488" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "#0D9488" }}>
        <div className="kit-watermark">FDR</div>
        <div className="kit-stripe" style={{ background: "#14B8A6" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Plan ahead with fixture difficulty ratings
          </p>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            Fixture Ticker
          </h1>
          <div
            className="flex items-center gap-2 mt-4 text-white/70 kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              GW {targetGWs[0]} &ndash; GW {targetGWs[targetGWs.length - 1]}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Legend */}
        <div
          className="kit-card p-4 md:p-6 kit-animate-slide-up"
          style={{ "--delay": "300ms" } as React.CSSProperties}
        >
          <h2 className="kit-headline text-lg text-gray-900 mb-3">
            Difficulty Rating
          </h2>
          <div className="flex flex-wrap gap-2">
            {LEGEND_ITEMS.map((item) => (
              <div
                key={item.difficulty}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${getDifficultyColor(item.difficulty)}`}
              >
                <span>{item.label}</span>
                <span className="opacity-75">{item.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fixture Grid */}
        <div
          className="kit-card p-4 md:p-6 kit-animate-slide-up"
          style={{ "--delay": "400ms" } as React.CSSProperties}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="kit-headline text-xl md:text-2xl text-gray-900">
              FDR Planner
            </h2>
            <span className="text-xs text-gray-400 hidden sm:block">
              Sorted by easiest schedule
            </span>
          </div>

          {grid.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-lg">
              No fixture data available
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3 pr-3 sticky left-0 bg-white z-10 min-w-[100px]">
                      Team
                    </th>
                    {targetGWs.map((gw) => (
                      <th
                        key={gw}
                        className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3 px-1"
                      >
                        GW{gw}
                      </th>
                    ))}
                    <th className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3 px-2">
                      Avg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grid.map((team, idx) => {
                    const cells = cellData[team.teamId] ?? [];
                    return (
                      <tr
                        key={team.teamId}
                        className="kit-table-row kit-animate-slide-up"
                        style={
                          {
                            "--delay": `${450 + idx * 25}ms`,
                          } as React.CSSProperties
                        }
                      >
                        <td className="py-1.5 pr-3 sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5 text-right font-mono">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                              {team.teamShort}
                            </span>
                          </div>
                        </td>
                        {cells.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-0.5">
                            {cell.extra ? (
                              <div className="flex flex-col gap-0.5">
                                <div
                                  className={`rounded px-1.5 py-0.5 text-center text-[10px] font-bold leading-tight ${getDifficultyColor(cell.primary.difficulty)}`}
                                >
                                  {cell.primary.opponentShort}
                                </div>
                                <div
                                  className={`rounded px-1.5 py-0.5 text-center text-[10px] font-bold leading-tight ${getDifficultyColor(cell.extra.difficulty)}`}
                                >
                                  {cell.extra.opponentShort}
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`rounded px-1.5 py-2 text-center text-xs font-bold whitespace-nowrap ${getDifficultyColor(cell.primary.difficulty)} ${cell.isBlank ? "italic opacity-60" : ""}`}
                              >
                                {cell.isBlank ? "—" : cell.primary.opponentShort}
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="py-1.5 px-2 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                              team.avgDifficulty <= 2.5
                                ? "bg-emerald-100 text-emerald-700"
                                : team.avgDifficulty <= 3.5
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {team.avgDifficulty.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div
          className="kit-card p-4 md:p-6 kit-animate-slide-up"
          style={{ "--delay": "500ms" } as React.CSSProperties}
        >
          <h2 className="kit-headline text-lg text-gray-900 mb-4">
            Quick Picks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {grid.length > 0 && (
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wider text-emerald-600 font-semibold mb-1">
                  Easiest Run
                </p>
                <p className="kit-headline text-2xl text-emerald-900">
                  {grid[0].teamShort}
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  Avg FDR: {grid[0].avgDifficulty.toFixed(2)} &middot;{" "}
                  {grid[0].easyFixtureCount} easy fixture
                  {grid[0].easyFixtureCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {grid.length > 0 && (
              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs uppercase tracking-wider text-red-600 font-semibold mb-1">
                  Hardest Run
                </p>
                <p className="kit-headline text-2xl text-red-900">
                  {grid[grid.length - 1].teamShort}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Avg FDR:{" "}
                  {grid[grid.length - 1].avgDifficulty.toFixed(2)} &middot;{" "}
                  {grid[grid.length - 1].easyFixtureCount} easy fixture
                  {grid[grid.length - 1].easyFixtureCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-teal-50 p-4">
              <p className="text-xs uppercase tracking-wider text-teal-600 font-semibold mb-1">
                Viewing From
              </p>
              <p className="kit-headline text-2xl text-teal-900">
                GW {currentGW}
              </p>
              <p className="text-sm text-teal-700 mt-1">
                Showing next {targetGWs.length} gameweeks
              </p>
            </div>
          </div>
        </div>

        {/* How to read note */}
        <div
          className="kit-card p-4 kit-animate-slide-up"
          style={{ "--delay": "550ms" } as React.CSSProperties}
        >
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">How to read:</span>{" "}
            Teams are sorted by average fixture difficulty — easiest run of games at the top.
            Cells with two rows indicate a Double Gameweek (DGW). Grey cells marked with a dash are Blank Gameweeks
            where the team has no fixture. FDR ratings are sourced from the official FPL API.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-24 sm:pb-8 text-center">
        <p className="text-white/30 text-xs">
          Built with React Router v7 &middot; Data from FPL API
        </p>
      </footer>
    </div>
  );
}
