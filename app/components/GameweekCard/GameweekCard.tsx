import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

interface GameweekCardProps {
  gameweek: FPLManagerGameweek;
}

export function GameweekCard({ gameweek }: GameweekCardProps) {
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  const getPerformanceColor = (points: number) => {
    if (points >= 80) return "text-green-600 dark:text-green-400";
    if (points >= 60) return "text-gray-900 dark:text-gray-100";
    return "text-red-600 dark:text-red-400";
  };

  const cardClassName =
    gameweek.rank === 1
      ? "rounded-lg border-2 border-yellow-400 p-4 bg-yellow-50 dark:bg-yellow-900/10"
      : "rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900";

  return (
    <div className={cardClassName}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Gameweek {gameweek.event}
        </h3>
        <span className="text-2xl" role="img" aria-label="rank emoji">
          {getRankEmoji(gameweek.rank)}
        </span>
      </div>

      {/* Points */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-3xl font-bold ${getPerformanceColor(
              gameweek.points
            )}`}
          >
            {gameweek.points}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">pts</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="text-gray-500 dark:text-gray-400 text-xs">Rank</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            #{gameweek.rank}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="text-gray-500 dark:text-gray-400 text-xs">Bench</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {gameweek.points_on_bench}
          </div>
        </div>
      </div>

      {/* Transfers */}
      {gameweek.event_transfers > 0 && (
        <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-xs text-blue-600 dark:text-blue-400">
          🔄{" "}
          {gameweek.event_transfers === 1
            ? "1 transfer"
            : `${gameweek.event_transfers} transfers`}
          {gameweek.event_transfers_cost > 0 &&
            ` (-${gameweek.event_transfers_cost} pts)`}
        </div>
      )}
    </div>
  );
}
