import type { FPLManagerGameweek } from "~/lib/fpl-api/types";
import type { CaptainRegretData } from "~/utils/captain-regret";
import { CaptainRegretBadge } from "~/components/CaptainRegretBadge/CaptainRegretBadge";

interface GameweekCardProps {
  gameweek: FPLManagerGameweek;
  isWinner: boolean;
  captainRegret?: CaptainRegretData;
}

export function GameweekCard({
  gameweek,
  isWinner,
  captainRegret,
}: GameweekCardProps) {
  const getRankEmoji = (rank: number) => {
    // Rank emojis based on overall league position, not gameweek winner
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

  // Winner styling based on highest gameweek points, not league rank
  const cardClassName = isWinner
    ? "rounded-lg border-2 border-yellow-400 p-4 bg-yellow-50 dark:bg-yellow-900/10"
    : "rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900";

  return (
    <div className={cardClassName}>
      {/* Winner Badge */}
      {isWinner && (
        <div className="mb-3 text-center">
          <span className="inline-block px-3 py-1 bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-950 text-xs font-bold rounded-full">
            ⭐ GAMEWEEK WINNER ⭐
          </span>
        </div>
      )}

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

      {/* Captain Regret */}
      {captainRegret && <CaptainRegretBadge regretData={captainRegret} />}
    </div>
  );
}
