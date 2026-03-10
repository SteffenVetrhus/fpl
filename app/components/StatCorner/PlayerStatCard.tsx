import type { PlayerStatSummary } from "~/lib/stat-corner/types";
import { formatStat, classifyFinishing } from "~/utils/stat-corner";

interface PlayerStatCardProps {
  player: PlayerStatSummary;
}

const FINISHING_STYLES = {
  clinical: { label: "Clinical", bg: "bg-emerald-100", text: "text-emerald-700" },
  average: { label: "Average", bg: "bg-gray-100", text: "text-gray-600" },
  lucky: { label: "Overperforming xG", bg: "bg-amber-100", text: "text-amber-700" },
};

const POSITION_COLORS: Record<string, string> = {
  GKP: "bg-amber-500",
  DEF: "bg-green-500",
  MID: "bg-blue-500",
  FWD: "bg-red-500",
};

export function PlayerStatCard({ player }: PlayerStatCardProps) {
  const finishing = classifyFinishing(player.overperformance);
  const style = FINISHING_STYLES[finishing];

  return (
    <div className="kit-card p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
            POSITION_COLORS[player.player.position] ?? "bg-gray-500"
          }`}
        >
          {player.player.position}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {player.player.name}
          </h4>
          <p className="text-xs text-gray-500 uppercase">
            {player.player.team} · {player.gameweeks} GWs
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="xG" value={formatStat(player.totalXg)} />
        <StatBox label="npxG" value={formatStat(player.totalNpxg)} />
        <StatBox label="xA" value={formatStat(player.totalXa)} />
        <StatBox label="Goals" value={String(player.totalGoals)} />
        <StatBox
          label="G-xG"
          value={`${player.overperformance > 0 ? "+" : ""}${formatStat(player.overperformance)}`}
          highlight={player.overperformance > 1 ? "green" : player.overperformance < -1 ? "red" : undefined}
        />
        <StatBox label="FPL Pts" value={String(player.totalFplPoints)} />
      </div>

      {/* Advanced metrics (if available) */}
      {(player.totalCbit > 0 || player.totalSca > 0) && (
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
          {player.totalCbit > 0 && (
            <StatBox label="CBIT" value={String(player.totalCbit)} />
          )}
          {player.totalSca > 0 && (
            <StatBox label="SCA" value={String(player.totalSca)} />
          )}
          {player.totalProgressiveCarries > 0 && (
            <StatBox label="Prog. Carries" value={String(player.totalProgressiveCarries)} />
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "red";
}) {
  const highlightClass = highlight === "green"
    ? "text-emerald-600"
    : highlight === "red"
      ? "text-red-500"
      : "text-gray-900";

  return (
    <div className="text-center">
      <p className="kit-stat-label text-gray-400 text-[10px] uppercase mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-bold tabular-nums ${highlightClass}`}>
        {value}
      </p>
    </div>
  );
}
