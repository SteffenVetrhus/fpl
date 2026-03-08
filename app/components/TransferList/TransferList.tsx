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
      <div className="kit-card p-12 text-center">
        <p className="text-xl text-gray-400">
          Crickets... Nobody's made any transfers yet! Set and forget?
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
      <h2 className="kit-headline text-xl text-gray-900 mb-4">
        Transfer List
      </h2>

      {sortedGameweeks.map((gameweek) => (
        <div key={gameweek} className="space-y-3">
          {/* Gameweek Header */}
          <h3 className="kit-headline text-lg text-gray-700 border-b-2 border-gray-200 pb-2">
            {gameweek}
          </h3>

          {/* Transfers for this gameweek */}
          <div className="space-y-2">
            {groupedByGameweek[gameweek].map((transfer, idx) => (
              <div
                key={`${gameweek}-${transfer.managerName}-${idx}`}
                className={`rounded-xl border p-4 ${
                  transfer.cost > 0
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Manager Name */}
                  <div className="font-semibold text-gray-900 min-w-[120px]">
                    {transfer.managerName}
                  </div>

                  {/* Transfer Details */}
                  <div className="flex items-center gap-3 flex-1 justify-center">
                    <div className="text-right">
                      <div className="kit-stat-label text-gray-400">
                        Out
                      </div>
                      <div className="font-medium text-red-600">
                        {transfer.playerOut}
                      </div>
                    </div>

                    <div className="text-2xl text-gray-300" style={{ fontFamily: "var(--font-display)" }}>→</div>

                    <div className="text-left">
                      <div className="kit-stat-label text-gray-400">
                        In
                      </div>
                      <div className="font-medium text-green-600">
                        {transfer.playerIn}
                      </div>
                    </div>
                  </div>

                  {/* Cost */}
                  {transfer.cost > 0 && (
                    <div className="min-w-[60px] text-right">
                      <div className="kit-stat-label text-gray-400">
                        Hit
                      </div>
                      <div className="font-bold text-red-600" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
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
      <div className="mt-6 p-4 rounded-xl text-center text-white" style={{ background: "var(--color-page-transfers, #EA580C)" }}>
        <p className="text-sm font-medium">
          Total transfers: <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>{transfers.length}</strong> ·{" "}
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
            {transfers.filter((t) => t.cost > 0).length}
          </strong>{" "}
          with point hits
        </p>
      </div>
    </div>
  );
}
