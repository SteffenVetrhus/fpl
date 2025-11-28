import type { GameweekLeagueData } from "~/utils/historical-standings";

interface HistoricalLeagueTableProps {
  data: GameweekLeagueData;
}

export function HistoricalLeagueTable({ data }: HistoricalLeagueTableProps) {
  if (data.standings.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-xl text-gray-500 dark:text-gray-400">
          📊 No data available for this gameweek
        </p>
      </div>
    );
  }

  const getRankChangeIcon = (rankChange: number) => {
    if (rankChange > 0) {
      return <span className="text-green-600 dark:text-green-400">↑</span>;
    } else if (rankChange < 0) {
      return <span className="text-red-600 dark:text-red-400">↓</span>;
    }
    return <span className="text-gray-400">-</span>;
  };

  const getRankChangeText = (rankChange: number) => {
    if (rankChange === 0) return "";
    return rankChange > 0 ? `+${rankChange}` : `${rankChange}`;
  };

  const formatPoints = (points: number) => {
    return points.toLocaleString();
  };

  const getRowClassName = (standing: typeof data.standings[0]) => {
    const baseClasses =
      "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors";

    if (standing.isGameweekWinner) {
      return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500`;
    }

    if (standing.rank === 1) {
      return `${baseClasses} font-semibold`;
    }

    return baseClasses;
  };

  const getRankEmoji = (rank: number, index: number) => {
    if (index === 0) return "👑";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Statistics Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          📊 Gameweek Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
              Average Points
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {data.averagePoints.toFixed(1)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
              Highest Points
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {data.highestPoints}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
              Lowest Points
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {data.lowestPoints}
            </div>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div className="w-full overflow-x-auto rounded-lg shadow-lg">
        <table className="w-full border-collapse bg-white dark:bg-gray-900">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-left">
              <th className="px-2 sm:px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Rank
              </th>
              <th className="px-2 sm:px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Manager
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Team
              </th>
              <th className="px-2 sm:px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">
                GW Pts
              </th>
              <th className="px-2 sm:px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">
                Total
              </th>
              <th className="hidden sm:table-cell px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {data.standings.map((standing, index) => (
              <tr key={standing.managerName} className={getRowClassName(standing)}>
                <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {standing.rank}
                    </span>
                    <span className="text-lg" role="img" aria-label="rank emoji">
                      {getRankEmoji(standing.rank, index)}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm">
                  {/* Mobile: stacked name + team */}
                  <div className="lg:hidden">
                    <div className="flex items-center gap-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {standing.managerName}
                      </div>
                      {standing.isGameweekWinner && (
                        <span className="text-yellow-500" aria-label="gameweek winner">
                          ⭐
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 italic mt-0.5">
                      {standing.teamName}
                    </div>
                  </div>
                  {/* Desktop: name only */}
                  <div className="hidden lg:flex items-center gap-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {standing.managerName}
                    </div>
                    {standing.isGameweekWinner && (
                      <span className="text-yellow-500" aria-label="gameweek winner">
                        ⭐
                      </span>
                    )}
                  </div>
                </td>
                {/* Desktop only: separate team column */}
                <td className="hidden lg:table-cell px-4 py-4 text-sm">
                  <div className="text-gray-600 dark:text-gray-400 italic">
                    {standing.teamName}
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm text-right">
                  <span
                    className={`font-semibold ${
                      standing.isGameweekWinner
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {standing.gameweekPoints}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm text-right">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {formatPoints(standing.totalPoints)}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-4 py-4 text-sm text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getRankChangeIcon(standing.rankChange)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getRankChangeText(standing.rankChange)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
