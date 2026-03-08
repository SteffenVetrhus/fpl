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
        <p className="text-xl text-gray-400">
          No gameweeks yet. Season hasn't started or we're in a time loop!
        </p>
      </div>
    );
  }

  const totalWins = gameweeks.filter((gw) => {
    const winners = calculateGameweekWinner(allManagers, gw.event);
    return winners.includes(managerName);
  }).length;

  return (
    <div className="space-y-4">
      <h2 className="kit-headline text-xl text-gray-900 mb-4">
        Gameweek History
      </h2>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {gameweeks.map((gw, index) => {
          const winners = calculateGameweekWinner(allManagers, gw.event);
          const isWinner = winners.includes(managerName);

          return (
            <div
              key={gw.event}
              data-event={gw.event}
              className="kit-animate-slide-up"
              style={{ "--delay": `${index * 50}ms` } as React.CSSProperties}
            >
              <GameweekCard gameweek={gw} isWinner={isWinner} />
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 rounded-xl text-center" style={{ background: "var(--color-page-gameweeks, #1D4ED8)", color: "white" }}>
        <p className="text-sm font-medium">
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>{gameweeks.length}</strong> gameweeks played · <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>{totalWins}</strong>{" "}
          {totalWins === 1 ? "win" : "wins"}
        </p>
      </div>
    </div>
  );
}
