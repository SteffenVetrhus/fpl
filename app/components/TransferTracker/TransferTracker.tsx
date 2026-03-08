interface TransferSummary {
  managerName: string;
  teamName: string;
  transferCount: number;
  lastTransferGW: number;
}

interface TransferTrackerProps {
  transfers: TransferSummary[];
}

export function TransferTracker({ transfers }: TransferTrackerProps) {
  if (transfers.length === 0) {
    return (
      <div className="kit-card p-12 text-center">
        <p className="text-xl text-gray-400">
          No transfer activity yet. Everyone's being patient... or lazy!
        </p>
      </div>
    );
  }

  const maxTransfers = Math.max(...transfers.map((t) => t.transferCount));

  const getActivityLevel = (count: number) => {
    if (count === maxTransfers && count > 5) return "Most Active";
    if (count > 8) return "Very Active";
    if (count > 4) return "Active";
    return "Quiet";
  };

  const getActivityColor = (count: number) => {
    if (count === maxTransfers && count > 5)
      return "border-orange-400 bg-orange-50";
    if (count > 8) return "border-blue-400 bg-blue-50";
    return "border-gray-200 bg-white";
  };

  const sortedTransfers = [...transfers].sort(
    (a, b) => b.transferCount - a.transferCount
  );

  return (
    <div className="space-y-4">
      <div className="kit-card p-6 md:p-8">
        <h2 className="kit-headline text-xl text-gray-900 mb-6">
          Transfer Activity
        </h2>

        <div className="space-y-3">
          {sortedTransfers.map((transfer, index) => (
            <div
              key={transfer.managerName}
              data-manager={transfer.managerName}
              className={`rounded-xl border-2 p-4 transition-all hover:shadow-md kit-animate-slide-up ${getActivityColor(
                transfer.transferCount
              )}`}
              style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {transfer.managerName}
                  </h3>
                  <p className="text-sm text-gray-400 italic">
                    {transfer.teamName}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-gray-900" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", lineHeight: 1 }}>
                    {transfer.transferCount}
                  </div>
                  <div className="kit-stat-label text-gray-400">
                    {transfer.transferCount === 1 ? "transfer" : "transfers"}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {getActivityLevel(transfer.transferCount)}
                </span>
                <span className="text-gray-400 text-xs">
                  Last: GW {transfer.lastTransferGW}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 rounded-xl text-center text-white" style={{ background: "var(--color-page-transfers, #EA580C)" }}>
          <p className="text-sm font-medium">
            Total transfers:{" "}
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
              {transfers.reduce((sum, t) => sum + t.transferCount, 0)}
            </strong>{" "}
            · Most active:{" "}
            <strong>{sortedTransfers[0]?.managerName || "Nobody"}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
