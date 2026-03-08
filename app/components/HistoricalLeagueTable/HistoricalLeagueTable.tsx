import type { GameweekLeagueData } from "~/utils/historical-standings";

interface HistoricalLeagueTableProps {
  data: GameweekLeagueData;
}

export function HistoricalLeagueTable({ data }: HistoricalLeagueTableProps) {
  if (data.standings.length === 0) {
    return (
      <div className="kit-card p-12 text-center">
        <p className="text-xl text-gray-400">
          No data available for this gameweek
        </p>
      </div>
    );
  }

  const getRankChangeIcon = (rankChange: number) => {
    if (rankChange > 0) {
      return <span className="text-green-600">↑</span>;
    } else if (rankChange < 0) {
      return <span className="text-red-600">↓</span>;
    }
    return <span className="text-gray-300">-</span>;
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
      "border-b border-gray-100 hover:bg-gray-50 transition-colors";

    if (standing.isGameweekWinner) {
      return `${baseClasses} bg-yellow-50 border-l-4 border-l-yellow-400`;
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
      <div className="kit-card p-5 kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
        <h3 className="kit-headline text-lg text-gray-900 mb-4">
          Gameweek Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-4" style={{ background: "var(--color-page-standings, #059669)" }}>
            <div className="kit-stat-label text-white/70">
              Average Points
            </div>
            <div className="text-white mt-1" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", lineHeight: 1 }}>
              {data.averagePoints.toFixed(1)}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--color-page-standings, #059669)" }}>
            <div className="kit-stat-label text-white/70">
              Highest Points
            </div>
            <div className="text-white mt-1" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", lineHeight: 1 }}>
              {data.highestPoints}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--color-page-standings, #059669)" }}>
            <div className="kit-stat-label text-white/70">
              Lowest Points
            </div>
            <div className="text-white mt-1" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", lineHeight: 1 }}>
              {data.lowestPoints}
            </div>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "400ms" } as React.CSSProperties}>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left" style={{ background: "var(--color-page-standings-dark, #065F46)" }}>
                <th className="px-3 sm:px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-3 sm:px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Manager
                </th>
                <th className="hidden lg:table-cell px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-3 sm:px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider text-right">
                  GW Pts
                </th>
                <th className="hidden sm:table-cell px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider text-right">
                  Hits
                </th>
                <th className="px-3 sm:px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider text-right">
                  Total
                </th>
                <th className="hidden sm:table-cell px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider text-center">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {data.standings.map((standing, index) => (
                <tr key={standing.managerName} className={getRowClassName(standing)}>
                  <td className="px-3 sm:px-5 py-4 text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
                        {standing.rank}
                      </span>
                      <span className="text-lg" role="img" aria-label="rank emoji">
                        {getRankEmoji(standing.rank, index)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-5 py-4 text-sm">
                    <div className="lg:hidden">
                      <div className="flex items-center gap-1">
                        <div className="font-semibold text-gray-900">
                          {standing.managerName}
                        </div>
                        {standing.isGameweekWinner && (
                          <span className="text-yellow-500" aria-label="gameweek winner">
                            ⭐
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 italic mt-0.5">
                        {standing.teamName}
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-1">
                      <div className="font-semibold text-gray-900">
                        {standing.managerName}
                      </div>
                      {standing.isGameweekWinner && (
                        <span className="text-yellow-500" aria-label="gameweek winner">
                          ⭐
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-5 py-4 text-sm">
                    <div className="text-gray-400 italic">
                      {standing.teamName}
                    </div>
                  </td>
                  <td className="px-3 sm:px-5 py-4 text-sm text-right">
                    <div>
                      <span
                        className={`font-bold ${
                          standing.isGameweekWinner
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        {standing.gameweekPoints}
                      </span>
                      {standing.transferCost > 0 && (
                        <div className="text-xs text-red-500 font-medium sm:hidden">
                          -{standing.transferCost} hit
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-4 text-sm text-right">
                    {standing.transferCost > 0 ? (
                      <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-full">
                        -{standing.transferCost}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-5 py-4 text-sm text-right">
                    <span className="font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem" }}>
                      {formatPoints(standing.totalPoints)}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getRankChangeIcon(standing.rankChange)}
                      <span className="text-xs text-gray-400">
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
    </div>
  );
}
