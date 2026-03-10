import type { PlayerStatSummary, StatMetric } from "~/lib/stat-corner/types";
import { formatStat, classifyFinishing } from "~/utils/stat-corner";

interface MetricLeaderboardProps {
  title: string;
  metric: StatMetric;
  players: PlayerStatSummary[];
  formatter?: (value: number) => string;
}

const POSITION_COLORS: Record<string, string> = {
  GKP: "bg-amber-100 text-amber-800",
  DEF: "bg-green-100 text-green-800",
  MID: "bg-blue-100 text-blue-800",
  FWD: "bg-red-100 text-red-800",
};

function getMetricDisplayValue(
  player: PlayerStatSummary,
  metric: StatMetric,
): number {
  switch (metric) {
    case "xg":
      return player.totalXg;
    case "npxg":
      return player.totalNpxg;
    case "xa":
      return player.totalXa;
    case "cbit":
      return player.totalCbit;
    case "overperformance":
      return player.overperformance;
    case "sca":
      return player.totalSca;
    case "progressive_carries":
      return player.totalProgressiveCarries;
    case "ball_recoveries":
      return player.totalBallRecoveries;
    case "fpl_points":
      return player.totalFplPoints;
    default:
      return 0;
  }
}

export function MetricLeaderboard({
  title,
  metric,
  players,
  formatter = (v) => formatStat(v),
}: MetricLeaderboardProps) {
  if (players.length === 0) {
    return (
      <div className="kit-card p-6">
        <h3 className="kit-headline text-lg text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-sm">No data available yet.</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...players.map((p) => Math.abs(getMetricDisplayValue(p, metric))),
    1,
  );

  return (
    <div className="kit-card p-6">
      <h3 className="kit-headline text-lg text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {players.map((player, index) => {
          const value = getMetricDisplayValue(player, metric);
          const barWidth = (Math.abs(value) / maxValue) * 100;
          const isOverperformance = metric === "overperformance";
          const barColor = isOverperformance
            ? value > 0
              ? "bg-emerald-500"
              : "bg-red-400"
            : "bg-teal-500";

          return (
            <div key={player.player.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 w-5 text-right">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {player.player.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      POSITION_COLORS[player.player.position] ?? ""
                    }`}
                  >
                    {player.player.position}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase">
                    {player.player.team}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-gray-700 w-14 text-right tabular-nums">
                {formatter(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
