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
      <div className="text-center py-12 px-4">
        <p className="text-xl text-gray-500 dark:text-gray-400">
          🤐 No transfer activity yet. Everyone's being patient... or lazy! 😴
        </p>
      </div>
    );
  }

  const maxTransfers = Math.max(...transfers.map((t) => t.transferCount));

  const getActivityLevel = (count: number) => {
    if (count === maxTransfers && count > 5) return "🔥 Most Active";
    if (count > 8) return "⚡ Very Active";
    if (count > 4) return "📈 Active";
    return "💤 Quiet";
  };

  const getActivityColor = (count: number) => {
    if (count === maxTransfers && count > 5)
      return "border-orange-400 bg-orange-50 dark:bg-orange-900/10";
    if (count > 8) return "border-blue-400 bg-blue-50 dark:bg-blue-900/10";
    return "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900";
  };

  // Sort by transfer count (most active first)
  const sortedTransfers = [...transfers].sort(
    (a, b) => b.transferCount - a.transferCount
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        🔄 Transfer Activity
      </h2>

      <div className="space-y-3">
        {sortedTransfers.map((transfer) => (
          <div
            key={transfer.managerName}
            data-manager={transfer.managerName}
            className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${getActivityColor(
              transfer.transferCount
            )}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {transfer.managerName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {transfer.teamName}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {transfer.transferCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {transfer.transferCount === 1 ? "transfer" : "transfers"}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {getActivityLevel(transfer.transferCount)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Last: GW {transfer.lastTransferGW}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Fun Summary */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          🎯 Total transfers:{" "}
          <strong>
            {transfers.reduce((sum, t) => sum + t.transferCount, 0)}
          </strong>{" "}
          • Most active:{" "}
          <strong>{sortedTransfers[0]?.managerName || "Nobody"}</strong> 🔥
        </p>
      </div>
    </div>
  );
}
