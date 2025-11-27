import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

interface GameweekHistoryProps {
  gameweeks: FPLManagerGameweek[];
}

export function GameweekHistory({ gameweeks }: GameweekHistoryProps) {
  if (gameweeks.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-xl text-gray-500 dark:text-gray-400">
          📅 No gameweeks yet. Season hasn't started or we're in a time loop! ⏰
        </p>
      </div>
    );
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank <= 5) return "⭐";
    return "";
  };

  const getPerformanceColor = (points: number) => {
    if (points >= 80) return "text-green-600 dark:text-green-400";
    if (points >= 60) return "text-gray-900 dark:text-gray-100";
    return "text-red-600 dark:text-red-400";
  };

  const getCardClassName = (rank: number) => {
    const baseClasses =
      "rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-900";

    if (rank === 1) {
      return `${baseClasses} ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/10`;
    }

    return baseClasses;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        🗓️ Gameweek History
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gameweeks.map((gw) => (
          <div
            key={gw.event}
            data-event={gw.event}
            className={getCardClassName(gw.rank)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Gameweek {gw.event}
              </h3>
              <span className="text-2xl" role="img" aria-label="rank emoji">
                {getRankEmoji(gw.rank)}
              </span>
            </div>

            {/* Points */}
            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-bold ${getPerformanceColor(
                    gw.points
                  )}`}
                >
                  {gw.points}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  pts
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total: <span className="font-medium">{gw.total_points}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  Rank
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  #{gw.rank}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  Bench
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {gw.points_on_bench}
                </div>
              </div>

              {gw.event_transfers > 0 && (
                <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                  <div className="text-blue-600 dark:text-blue-400 text-xs">
                    🔄{" "}
                    {gw.event_transfers === 1
                      ? "1 transfer"
                      : `${gw.event_transfers} transfers`}
                    {gw.event_transfers_cost > 0 &&
                      ` (-${gw.event_transfers_cost} pts)`}
                  </div>
                </div>
              )}
            </div>

            {/* Win badge */}
            {gw.rank === 1 && (
              <div className="mt-3 text-center text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                ⭐ GAMEWEEK WINNER ⭐
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          🎯 <strong>{gameweeks.length}</strong> gameweeks played •{" "}
          <strong>
            {gameweeks.filter((gw) => gw.rank === 1).length}
          </strong>{" "}
          {gameweeks.filter((gw) => gw.rank === 1).length === 1
            ? "win"
            : "wins"}{" "}
          🏆
        </p>
      </div>
    </div>
  );
}
