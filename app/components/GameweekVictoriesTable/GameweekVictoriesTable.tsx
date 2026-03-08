import { calculateGameweekWinner, type ManagerGameweekData } from "~/utils/gameweek-winner";

interface GameweekVictoriesTableProps {
  managers: ManagerGameweekData[];
  onSelectPlayer: (name: string) => void;
}

interface ManagerVictoryRecord {
  name: string;
  victories: number;
  gameweeksPlayed: number;
}

/**
 * Calculate accumulated gameweek victories for all managers.
 * When two or more players tie for first place, each gets a victory.
 */
export function calculateVictoryRecords(
  managers: ManagerGameweekData[]
): ManagerVictoryRecord[] {
  if (managers.length === 0) return [];

  const maxGameweeks = Math.max(...managers.map((m) => m.gameweeks.length));
  const allGameweekNumbers = Array.from({ length: maxGameweeks }, (_, i) => i + 1);

  const victoryMap = new Map<string, number>();
  for (const manager of managers) {
    victoryMap.set(manager.name, 0);
  }

  for (const gw of allGameweekNumbers) {
    const winners = calculateGameweekWinner(managers, gw);
    for (const winner of winners) {
      victoryMap.set(winner, (victoryMap.get(winner) ?? 0) + 1);
    }
  }

  return managers
    .map((m) => ({
      name: m.name,
      victories: victoryMap.get(m.name) ?? 0,
      gameweeksPlayed: m.gameweeks.length,
    }))
    .sort((a, b) => b.victories - a.victories || a.name.localeCompare(b.name));
}

export function GameweekVictoriesTable({
  managers,
  onSelectPlayer,
}: GameweekVictoriesTableProps) {
  const records = calculateVictoryRecords(managers);

  if (records.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-xl text-gray-400">
          No gameweek data available yet.
        </p>
      </div>
    );
  }

  const maxVictories = records[0]?.victories ?? 0;

  return (
    <div className="space-y-4">
      <h2 className="kit-headline text-xl text-gray-900 mb-4">
        Gameweek Victories
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold w-12">
                #
              </th>
              <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Manager
              </th>
              <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold text-center">
                Victories
              </th>
              <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold text-center max-sm:hidden">
                Played
              </th>
              <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold text-center max-sm:hidden">
                Win %
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const winPct =
                record.gameweeksPlayed > 0
                  ? ((record.victories / record.gameweeksPlayed) * 100).toFixed(0)
                  : "0";
              const barWidth =
                maxVictories > 0
                  ? (record.victories / maxVictories) * 100
                  : 0;

              return (
                <tr
                  key={record.name}
                  onClick={() => onSelectPlayer(record.name)}
                  className="kit-table-row border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50"
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectPlayer(record.name);
                    }
                  }}
                >
                  <td className="py-3 px-4 font-semibold text-gray-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">
                      {record.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden max-sm:hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${barWidth}%`,
                            background: "var(--color-page-gameweeks)",
                          }}
                        />
                      </div>
                      <span
                        className="font-bold text-lg"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--color-page-gameweeks)",
                        }}
                      >
                        {record.victories}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500 max-sm:hidden">
                    {record.gameweeksPlayed}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500 max-sm:hidden">
                    {winPct}%
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
