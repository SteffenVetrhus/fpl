/**
 * MiniGameLeaderboard - Season standings table for mini games
 */

import type { MiniGameLeaderboardEntry } from "~/lib/mini-games/types";

export interface MiniGameLeaderboardProps {
  entries: MiniGameLeaderboardEntry[];
  currentManagerId?: number;
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

export function MiniGameLeaderboard({ entries, currentManagerId }: MiniGameLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="kit-card p-8 text-center">
        <p className="text-gray-500">No results yet. Play some mini games first!</p>
      </div>
    );
  }

  return (
    <div className="kit-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 kit-stat-label text-gray-500 w-12">#</th>
              <th className="px-4 py-3 kit-stat-label text-gray-500">Player</th>
              <th className="px-4 py-3 kit-stat-label text-gray-500 text-center">Pts</th>
              <th className="px-4 py-3 kit-stat-label text-gray-500 text-center hidden sm:table-cell">W</th>
              <th className="px-4 py-3 kit-stat-label text-gray-500 text-center hidden sm:table-cell">D</th>
              <th className="px-4 py-3 kit-stat-label text-gray-500 text-center hidden sm:table-cell">L</th>
              <th className="px-4 py-3 kit-stat-label text-gray-500 text-center hidden md:table-cell">Played</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.managerId === currentManagerId;
              const isLeader = rank === 1;

              return (
                <tr
                  key={entry.managerId}
                  className={`border-b border-gray-50 transition-colors ${
                    isCurrentUser
                      ? "bg-purple-50"
                      : isLeader
                        ? "bg-yellow-50"
                        : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-600">
                    {getRankDisplay(rank)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${isCurrentUser ? "text-purple-700" : "text-gray-900"}`}>
                      {entry.managerName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="kit-stat-number text-lg" style={{ color: "var(--color-page-minigames)" }}>
                      {entry.totalPoints}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium hidden sm:table-cell">
                    {entry.wins}
                  </td>
                  <td className="px-4 py-3 text-center text-yellow-600 font-medium hidden sm:table-cell">
                    {entry.draws}
                  </td>
                  <td className="px-4 py-3 text-center text-red-600 font-medium hidden sm:table-cell">
                    {entry.losses}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden md:table-cell">
                    {entry.gamesPlayed}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
