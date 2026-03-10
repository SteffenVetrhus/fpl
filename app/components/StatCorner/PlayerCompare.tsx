import type { PlayerStatSummary } from "~/lib/stat-corner/types";
import { formatStat } from "~/utils/stat-corner";

interface PlayerCompareProps {
  players: PlayerStatSummary[];
}

interface CompareMetric {
  label: string;
  getValue: (p: PlayerStatSummary) => number;
  format?: (v: number) => string;
}

const COMPARE_METRICS: CompareMetric[] = [
  { label: "xG", getValue: (p) => p.totalXg },
  { label: "npxG", getValue: (p) => p.totalNpxg },
  { label: "xA", getValue: (p) => p.totalXa },
  { label: "Goals", getValue: (p) => p.totalGoals, format: (v) => String(v) },
  { label: "Assists", getValue: (p) => p.totalAssists, format: (v) => String(v) },
  {
    label: "G - xG",
    getValue: (p) => p.overperformance,
    format: (v) => `${v > 0 ? "+" : ""}${formatStat(v)}`,
  },
  { label: "xG/90", getValue: (p) => p.xgPer90 },
  { label: "xA/90", getValue: (p) => p.xaPer90 },
  { label: "CBIT", getValue: (p) => p.totalCbit, format: (v) => String(v) },
  { label: "SCA", getValue: (p) => p.totalSca, format: (v) => String(v) },
  { label: "FPL Pts", getValue: (p) => p.totalFplPoints, format: (v) => String(v) },
];

const PLAYER_COLORS = [
  { bar: "bg-teal-500", text: "text-teal-700", bg: "bg-teal-50" },
  { bar: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
  { bar: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
];

export function PlayerCompare({ players }: PlayerCompareProps) {
  if (players.length < 2) {
    return (
      <div className="kit-card p-6">
        <h3 className="kit-headline text-lg text-gray-800 mb-2">Compare Players</h3>
        <p className="text-gray-500 text-sm">Select at least 2 players to compare.</p>
      </div>
    );
  }

  return (
    <div className="kit-card p-6">
      <h3 className="kit-headline text-lg text-gray-800 mb-4">Head to Head</h3>

      {/* Player headers */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `120px repeat(${players.length}, 1fr)` }}>
        <div /> {/* Empty corner */}
        {players.map((p, i) => (
          <div key={p.player.id} className={`text-center p-2 rounded-lg ${PLAYER_COLORS[i]?.bg ?? "bg-gray-50"}`}>
            <p className="font-semibold text-sm text-gray-900">{p.player.name}</p>
            <p className="text-[10px] text-gray-500 uppercase">
              {p.player.team} · {p.player.position}
            </p>
          </div>
        ))}
      </div>

      {/* Metric rows */}
      <div className="space-y-3">
        {COMPARE_METRICS.map((metric) => {
          const values = players.map((p) => metric.getValue(p));
          const maxVal = Math.max(...values.map(Math.abs), 0.01);
          const bestIdx = values.indexOf(Math.max(...values));

          return (
            <div
              key={metric.label}
              className="grid gap-3 items-center"
              style={{ gridTemplateColumns: `120px repeat(${players.length}, 1fr)` }}
            >
              <span className="text-xs font-medium text-gray-500 uppercase">
                {metric.label}
              </span>
              {players.map((p, i) => {
                const value = values[i];
                const format = metric.format ?? ((v: number) => formatStat(v));
                const barWidth = (Math.abs(value) / maxVal) * 100;
                const isBest = i === bestIdx;

                return (
                  <div key={p.player.id} className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          PLAYER_COLORS[i]?.bar ?? "bg-gray-400"
                        }`}
                        style={{ width: `${Math.max(barWidth, 2)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold tabular-nums w-12 text-right ${
                        isBest ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {format(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
