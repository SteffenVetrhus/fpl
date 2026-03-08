import type { Route } from "./+types/price-tracker";
import { fetchBootstrapStatic } from "~/lib/fpl-api/client";
import { isDatabaseAvailable } from "~/lib/db/client";
import { getPriceChanges, predictPriceChanges } from "~/lib/db/snapshots";
import { TrendingUp, TrendingDown, Database, AlertCircle } from "lucide-react";

const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

export async function loader() {
  const bootstrap = await fetchBootstrapStatic();
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const dbAvailable = await isDatabaseAvailable();

  let priceChanges: Awaited<ReturnType<typeof getPriceChanges>> = [];
  if (dbAvailable) {
    try {
      priceChanges = await getPriceChanges();
    } catch {
      // DB available but query failed — table might not exist yet
    }
  }

  // Always show predictions from live API data (no DB needed)
  const predictions = await predictPriceChanges(bootstrap.elements);

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

  const confirmedChanges = priceChanges.map((pc) => ({
    ...pc,
    teamShort: teamMap.get(pc.teamId)?.short_name ?? "???",
    position: POSITION_MAP[pc.elementType] ?? "???",
    costDisplay: pc.currentCost / 10,
    changeDisplay: pc.costChange / 10,
  }));

  return {
    risers,
    fallers,
    confirmedChanges,
    dbAvailable,
  };
}

export default function PriceTrackerPage({ loaderData }: Route.ComponentProps) {
  const { risers, fallers, confirmedChanges, dbAvailable } = loaderData;

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
        {/* DB Status */}
        {!dbAvailable && (
          <div
            className="kit-card p-4 kit-animate-slide-up flex items-center gap-3"
            style={{ "--delay": "0ms" } as React.CSSProperties}
          >
            <Database size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Database not connected
              </p>
              <p className="text-xs text-gray-500">
                Price predictions below use live transfer data. Connect
                PostgreSQL via docker-compose for confirmed price change
                history.
              </p>
            </div>
          </div>
        )}

        {/* Confirmed price changes (from DB) */}
        {confirmedChanges.length > 0 && (
          <div
            className="kit-card p-6 kit-animate-slide-up"
            style={{ "--delay": "0ms" } as React.CSSProperties}
          >
            <h2 className="kit-headline text-lg text-gray-900 mb-4">
              Confirmed Price Changes
            </h2>
            <div className="space-y-2">
              {confirmedChanges.map((pc) => (
                <div
                  key={pc.playerId}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    pc.costChange > 0 ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <span
                    className={`kit-headline text-xl ${
                      pc.costChange > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {pc.costChange > 0 ? "+" : ""}
                    £{pc.changeDisplay.toFixed(1)}m
                  </span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {pc.webName}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {pc.teamShort} · {pc.position}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    £{pc.costDisplay.toFixed(1)}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
