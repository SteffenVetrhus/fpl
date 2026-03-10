import type { PriceSnapshot } from "~/lib/stat-corner/types";

interface PriceChartProps {
  snapshots: PriceSnapshot[];
  playerName: string;
}

export function PriceChart({ snapshots, playerName }: PriceChartProps) {
  if (snapshots.length === 0) {
    return (
      <div className="kit-card p-6">
        <h3 className="kit-headline text-lg text-gray-800 mb-2">Price Trend</h3>
        <p className="text-gray-500 text-sm">No price data available.</p>
      </div>
    );
  }

  const prices = snapshots.map((s) => s.price / 10);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 0.1;
  const currentPrice = prices[prices.length - 1];
  const startPrice = prices[0];
  const priceChange = currentPrice - startPrice;

  return (
    <div className="kit-card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="kit-headline text-lg text-gray-800">{playerName}</h3>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-900">
            £{currentPrice.toFixed(1)}m
          </span>
          {priceChange !== 0 && (
            <span
              className={`ml-2 text-sm font-semibold ${
                priceChange > 0 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {priceChange > 0 ? "+" : ""}
              {priceChange.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* CSS sparkline */}
      <div className="flex items-end gap-px h-16">
        {snapshots.map((snapshot, i) => {
          const height = ((prices[i] - minPrice) / range) * 100;
          const isLast = i === snapshots.length - 1;
          return (
            <div
              key={snapshot.id}
              className={`flex-1 rounded-t-sm transition-all ${
                isLast ? "bg-teal-500" : "bg-teal-300"
              }`}
              style={{ height: `${Math.max(height, 4)}%` }}
              title={`£${prices[i].toFixed(1)}m — ${new Date(snapshot.snapshot_date).toLocaleDateString()}`}
            />
          );
        })}
      </div>

      {/* Ownership */}
      {snapshots[snapshots.length - 1]?.ownership > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Ownership: {snapshots[snapshots.length - 1].ownership.toFixed(1)}%
        </p>
      )}
    </div>
  );
}
