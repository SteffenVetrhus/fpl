interface Transfer {
  gameweek: number;
  managerName: string;
  playerIn: string;
  playerOut: string;
  cost: number;
}

interface TransferListProps {
  transfers: Transfer[];
}

export function TransferList({ transfers }: TransferListProps) {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-xl text-gray-500 dark:text-gray-400">
          🦗 Crickets... Nobody's made any transfers yet! Set and forget? 📊
        </p>
      </div>
    );
  }

  // Group transfers by gameweek
  const groupedByGameweek = transfers.reduce((acc, transfer) => {
    const gw = `GW ${transfer.gameweek}`;
    if (!acc[gw]) {
      acc[gw] = [];
    }
    acc[gw].push(transfer);
    return acc;
  }, {} as Record<string, Transfer[]>);

  // Sort gameweeks descending (most recent first)
  const sortedGameweeks = Object.keys(groupedByGameweek).sort((a, b) => {
    const gwA = parseInt(a.split(" ")[1]);
    const gwB = parseInt(b.split(" ")[1]);
    return gwB - gwA;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        📝 Transfer List
      </h2>

      {sortedGameweeks.map((gameweek) => (
        <div key={gameweek} className="space-y-3">
          {/* Gameweek Header */}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
            {gameweek}
          </h3>

          {/* Transfers for this gameweek */}
          <div className="space-y-2">
            {groupedByGameweek[gameweek].map((transfer, idx) => (
              <div
                key={`${gameweek}-${transfer.managerName}-${idx}`}
                className={`rounded-lg border p-4 ${
                  transfer.cost > 0
                    ? "border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-700"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Manager Name */}
                  <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[120px]">
                    {transfer.managerName}
                  </div>

                  {/* Transfer Details */}
                  <div className="flex items-center gap-3 flex-1 justify-center">
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Out
                      </div>
                      <div className="font-medium text-red-600 dark:text-red-400">
                        {transfer.playerOut}
                      </div>
                    </div>

                    <div className="text-2xl text-gray-400">→</div>

                    <div className="text-left">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        In
                      </div>
                      <div className="font-medium text-green-600 dark:text-green-400">
                        {transfer.playerIn}
                      </div>
                    </div>
                  </div>

                  {/* Cost */}
                  {transfer.cost > 0 && (
                    <div className="min-w-[60px] text-right">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Hit
                      </div>
                      <div className="font-bold text-red-600 dark:text-red-400">
                        -{transfer.cost}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          🔢 Total transfers: <strong>{transfers.length}</strong> •{" "}
          <strong>
            {transfers.filter((t) => t.cost > 0).length}
          </strong>{" "}
          with point hits 💥
        </p>
      </div>
    </div>
  );
}
