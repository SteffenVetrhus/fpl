import type { Route } from "./+types/price-tracker";
import { fetchBootstrapStatic } from "~/lib/fpl-api/client";
import type { FPLElement } from "~/lib/fpl-api/types";
import { TrendingUp, TrendingDown } from "lucide-react";

const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

/**
 * Predict price changes based on transfer velocity
 */
function predictPriceChanges(players: FPLElement[]) {
  const withVelocity = players
    .filter((p) => p.status === "a" && p.minutes > 0)
    .map((p) => ({
      player: p,
      netTransfers: p.transfers_in_event - p.transfers_out_event,
      velocity:
        (p.transfers_in_event - p.transfers_out_event) /
        Math.max(p.transfers_in_event + p.transfers_out_event, 1),
    }));

  const likelyRisers = withVelocity
    .filter((p) => p.netTransfers > 5000 && p.velocity > 0.3)
    .sort((a, b) => b.netTransfers - a.netTransfers)
    .slice(0, 10);

  const likelyFallers = withVelocity
    .filter((p) => p.netTransfers < -5000 && p.velocity < -0.3)
    .sort((a, b) => a.netTransfers - b.netTransfers)
    .slice(0, 10);

  return { likelyRisers, likelyFallers };
}

export async function loader() {
  const bootstrap = await fetchBootstrapStatic();
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const predictions = predictPriceChanges(bootstrap.elements);

  const risers = predictions.likelyRisers.map((r) => ({
    id: r.player.id,
    webName: r.player.web_name,
    teamShort: teamMap.get(r.player.team)?.short_name ?? "???",
    position: POSITION_MAP[r.player.element_type] ?? "???",
    cost: r.player.now_cost / 10,
    netTransfers: r.netTransfers,
    velocity: Math.round(r.velocity * 100),
    ownership: parseFloat(r.player.selected_by_percent),
    form: parseFloat(r.player.form),
  }));

  const fallers = predictions.likelyFallers.map((f) => ({
    id: f.player.id,
    webName: f.player.web_name,
    teamShort: teamMap.get(f.player.team)?.short_name ?? "???",
    position: POSITION_MAP[f.player.element_type] ?? "???",
    cost: f.player.now_cost / 10,
    netTransfers: f.netTransfers,
    velocity: Math.round(f.velocity * 100),
    ownership: parseFloat(f.player.selected_by_percent),
    form: parseFloat(f.player.form),
  }));

  return { risers, fallers };
}

export default function PriceTrackerPage({ loaderData }: Route.ComponentProps) {
  const { risers, fallers } = loaderData;

  return (
    <main className="min-h-screen" style={{ background: "#059669" }}>
      {/* Hero */}
      <section
        className="kit-hero kit-diagonal-cut relative"
        style={{ background: "linear-gradient(135deg, #059669, #065F46)" }}
      >
        <div className="kit-stripe" style={{ background: "#10B981" }} />
        <span className="kit-watermark">£££</span>
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <TrendingUp size={24} color="white" />
            </div>
            <p className="text-white/70 text-sm font-medium tracking-wider uppercase">
              Price Intelligence
            </p>
          </div>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            Price Tracker
          </h1>
          <p className="text-white/60 mt-3 max-w-lg">
            Buy before the rise. Sell before the fall. Stay ahead of the market.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 pb-16 space-y-6">
        {/* Predicted risers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="kit-card p-6 kit-animate-slide-up"
            style={{ "--delay": "50ms" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-green-600" />
              <h2 className="kit-headline text-lg text-gray-900">
                Likely Price Rises
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              High net transfers in — buy before they rise
            </p>
            {risers.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No significant risers detected
              </p>
            ) : (
              <div className="space-y-2">
                {risers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {p.webName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {p.teamShort} · {p.position}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>£{p.cost.toFixed(1)}m</span>
                        <span>{p.ownership}%</span>
                        <span>Form: {p.form}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-green-600">
                        +{(p.netTransfers / 1000).toFixed(1)}k
                      </p>
                      <p className="text-xs text-gray-400">net transfers</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="kit-card p-6 kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={20} className="text-red-600" />
              <h2 className="kit-headline text-lg text-gray-900">
                Likely Price Falls
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              High net transfers out — sell before they drop
            </p>
            {fallers.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No significant fallers detected
              </p>
            ) : (
              <div className="space-y-2">
                {fallers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-red-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {p.webName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {p.teamShort} · {p.position}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>£{p.cost.toFixed(1)}m</span>
                        <span>{p.ownership}%</span>
                        <span>Form: {p.form}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-red-600">
                        {(p.netTransfers / 1000).toFixed(1)}k
                      </p>
                      <p className="text-xs text-gray-400">net transfers</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
