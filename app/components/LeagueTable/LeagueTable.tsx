import type { FPLStandingsResult } from "~/lib/fpl-api/types";

interface LeagueTableProps {
  standings: FPLStandingsResult[];
}

export function LeagueTable({ standings }: LeagueTableProps) {
  if (standings.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-xl text-gray-500 dark:text-gray-400">
          🤷 No managers found. Did everyone rage quit?
        </p>
      </div>
    );
  }

  const getRankChangeIcon = (rank: number, lastRank: number) => {
    if (rank < lastRank) {
      return <span className="text-green-600 dark:text-green-400">↑</span>;
    } else if (rank > lastRank) {
      return <span className="text-red-600 dark:text-red-400">↓</span>;
    }
    return <span className="text-gray-400">-</span>;
  };

  const getRankChangeText = (rank: number, lastRank: number) => {
    const change = lastRank - rank;
    if (change === 0) return "";
    return change > 0 ? `+${change}` : `${change}`;
  };

  const formatPoints = (points: number) => {
    return points.toLocaleString();
  };

  const getRowClassName = (index: number) => {
    const baseClasses =
      "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors";

    if (index === 0) {
      return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 font-semibold border-l-4 border-l-yellow-500`;
    }

    return baseClasses;
  };

  const getManagerEmoji = (index: number) => {
    if (index === 0) return "👑";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    if (index === standings.length - 1) return "😅";
    return "";
  };

  return (
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
              GW
            </th>
            <th className="px-2 sm:px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">
              Total
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
              Form
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((manager, index) => (
            <tr key={manager.entry} className={getRowClassName(index)}>
              <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {manager.rank}
                  </span>
                  <span className="text-lg" role="img" aria-label="rank emoji">
                    {getManagerEmoji(index)}
                  </span>
                </div>
              </td>
              <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm">
                {/* Mobile: stacked name + team */}
                <div className="lg:hidden">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {manager.player_name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 italic mt-0.5">
                    {manager.entry_name}
                  </div>
                </div>
                {/* Desktop: name only */}
                <div className="hidden lg:block font-medium text-gray-900 dark:text-gray-100">
                  {manager.player_name}
                </div>
              </td>
              {/* Desktop only: separate team column */}
              <td className="hidden lg:table-cell px-4 py-4 text-sm">
                <div className="text-gray-600 dark:text-gray-400 italic">
                  {manager.entry_name}
                </div>
              </td>
              <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm text-right">
                <span
                  className={`font-semibold ${
                    manager.event_total >= 80
                      ? "text-green-600 dark:text-green-400"
                      : manager.event_total >= 60
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {manager.event_total}
                </span>
              </td>
              <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm text-right">
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatPoints(manager.total)}
                </span>
              </td>
              <td className="hidden sm:table-cell px-4 py-4 text-sm text-center">
                <div className="flex items-center justify-center gap-1">
                  {getRankChangeIcon(manager.rank, manager.last_rank)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getRankChangeText(manager.rank, manager.last_rank)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Fun banter footer */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
        {standings[0] && (
          <p>
            🎉 <strong>{standings[0].player_name}</strong> is living their best
            life at the top!
            {standings.length > 1 &&
              ` ${standings[standings.length - 1].player_name} might need a hug 💙`}
          </p>
        )}
      </div>
    </div>
  );
}
