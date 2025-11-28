import type { FPLManagerGameweek } from "~/lib/fpl-api/types";
import { GameweekCard } from "~/components/GameweekCard/GameweekCard";
import { calculateGameweekWinner, type ManagerGameweekData } from "~/utils/gameweek-winner";

interface GameweekHistoryProps {
  gameweeks: FPLManagerGameweek[];
  managerName: string;
  allManagers: ManagerGameweekData[];
}

export function GameweekHistory({ gameweeks, managerName, allManagers }: GameweekHistoryProps) {
  if (gameweeks.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-xl text-gray-500 dark:text-gray-400">
          📅 No gameweeks yet. Season hasn't started or we're in a time loop! ⏰
        </p>
      </div>
    );
  }

  // Calculate total wins for this manager
  const totalWins = gameweeks.filter((gw) => {
    const winners = calculateGameweekWinner(allManagers, gw.event);
    return winners.includes(managerName);
  }).length;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        🗓️ Gameweek History
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gameweeks.map((gw) => {
          // Determine if this player won this specific gameweek
          const winners = calculateGameweekWinner(allManagers, gw.event);
          const isWinner = winners.includes(managerName);

          return (
            <div key={gw.event} data-event={gw.event}>
              <GameweekCard gameweek={gw} isWinner={isWinner} />
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          🎯 <strong>{gameweeks.length}</strong> gameweeks played •{" "}
          <strong>{totalWins}</strong>{" "}
          {totalWins === 1 ? "win" : "wins"} 🏆
        </p>
      </div>
    </div>
  );
}
