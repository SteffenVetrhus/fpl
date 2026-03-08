import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

interface GameweekCardProps {
  gameweek: FPLManagerGameweek;
  isWinner: boolean;
}

export function GameweekCard({ gameweek, isWinner }: GameweekCardProps) {
  const netPoints = gameweek.points - gameweek.event_transfers_cost;

  const getRankEmoji = (rank: number) => {
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank <= 5) return "⭐";
    return "";
  };

  const getPerformanceColor = (points: number) => {
    if (points >= 80) return "text-green-600";
    if (points >= 60) return "text-gray-900";
    return "text-red-600";
  };

  const cardClassName = isWinner
    ? "rounded-xl border-2 border-yellow-400 p-5 bg-yellow-50 relative overflow-hidden"
    : "rounded-xl border border-gray-200 p-5 bg-white relative overflow-hidden";

  return (
    <div className={cardClassName}>
      {/* Winner Badge */}
      {isWinner && (
        <div className="mb-3 text-center">
          <span className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full uppercase tracking-wider">
            GAMEWEEK WINNER
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Gameweek {gameweek.event}
        </h3>
        <span className="text-2xl" role="img" aria-label="rank emoji">
          {getRankEmoji(gameweek.rank)}
        </span>
      </div>

      {/* Points — oversized poster style */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-bold ${getPerformanceColor(netPoints)}`}
            style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", lineHeight: 1 }}
          >
            {netPoints}
          </span>
          <span className="kit-stat-label text-gray-400">pts</span>
        </div>
        {gameweek.event_transfers_cost > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            {gameweek.points} - {gameweek.event_transfers_cost} hit
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="kit-stat-label text-gray-400">Rank</div>
          <div className="font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>
            #{gameweek.rank}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="kit-stat-label text-gray-400">Bench</div>
          <div className="font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>
            {gameweek.points_on_bench}
          </div>
        </div>
      </div>

      {/* Transfers */}
      {gameweek.event_transfers > 0 && (
        <div className={`mt-3 rounded-lg p-2 text-xs font-medium ${
          gameweek.event_transfers_cost > 0
            ? "bg-red-50 text-red-700"
            : "bg-blue-50 text-blue-700"
        }`}>
          {gameweek.event_transfers === 1
            ? "1 transfer"
            : `${gameweek.event_transfers} transfers`}
          {gameweek.event_transfers_cost > 0 &&
            ` (-${gameweek.event_transfers_cost} pts hit)`}
        </div>
      )}
    </div>
  );
}
