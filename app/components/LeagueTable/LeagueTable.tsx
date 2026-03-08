import type { FPLStandingsResult } from "~/lib/fpl-api/types";

interface LeagueTableProps {
  standings: FPLStandingsResult[];
}

export function LeagueTable({ standings }: LeagueTableProps) {
  if (standings.length === 0) {
    return (
      <div className="kit-card p-12 text-center">
        <p className="text-xl text-gray-400">
          No managers found. Did everyone rage quit?
        </p>
      </div>
    );
  }

  const getRankChangeIcon = (rank: number, lastRank: number) => {
    if (rank < lastRank) {
      return <span className="text-green-600">↑</span>;
    } else if (rank > lastRank) {
      return <span className="text-red-600">↓</span>;
    }
    return <span className="text-gray-300">-</span>;
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
      "border-b border-gray-100 hover:bg-gray-50 transition-colors";

    if (index === 0) {
      return `${baseClasses} bg-yellow-50 font-semibold border-l-4 border-l-yellow-400`;
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
    <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left" style={{ background: "var(--color-page-league-dark, #3B0F7A)" }}>
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
                GW
              </th>
              <th className="px-3 sm:px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider text-right">
                Total
              </th>
              <th className="hidden sm:table-cell px-5 py-4 text-xs font-semibold text-white/80 uppercase tracking-wider text-center">
                Form
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((manager, index) => (
              <tr
                key={manager.entry}
                className={getRowClassName(index)}
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <td className="px-3 sm:px-5 py-4 text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-display text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                      {manager.rank}
                    </span>
                    <span className="text-lg" role="img" aria-label="rank emoji">
                      {getManagerEmoji(index)}
                    </span>
                  </div>
                </td>
                <td className="px-3 sm:px-5 py-4 text-sm">
                  <div className="lg:hidden">
                    <div className="font-semibold text-gray-900">
                      {manager.player_name}
                    </div>
                    <div className="text-xs text-gray-400 italic mt-0.5">
                      {manager.entry_name}
                    </div>
                  </div>
                  <div className="hidden lg:block font-semibold text-gray-900">
                    {manager.player_name}
                  </div>
                </td>
                <td className="hidden lg:table-cell px-5 py-4 text-sm">
                  <div className="text-gray-400 italic">
                    {manager.entry_name}
                  </div>
                </td>
                <td className="px-3 sm:px-5 py-4 text-sm text-right">
                  <span
                    className={`font-bold ${
                      manager.event_total >= 80
                        ? "text-green-600"
                        : manager.event_total >= 60
                        ? "text-gray-900"
                        : "text-red-600"
                    }`}
                  >
                    {manager.event_total}
                  </span>
                </td>
                <td className="px-3 sm:px-5 py-4 text-sm text-right">
                  <span className="font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
                    {formatPoints(manager.total)}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-5 py-4 text-sm text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getRankChangeIcon(manager.rank, manager.last_rank)}
                    <span className="text-xs text-gray-400">
                      {getRankChangeText(manager.rank, manager.last_rank)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Banter footer */}
      <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
        {standings[0] && (
          <p>
            <strong>{standings[0].player_name}</strong> is living their best
            life at the top!
            {standings.length > 1 &&
              ` ${standings[standings.length - 1].player_name} might need a hug.`}
          </p>
        )}
      </div>
    </div>
  );
}
