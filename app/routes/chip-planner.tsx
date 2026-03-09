import type { Route } from "./+types/chip-planner";
import { requireAuth } from "~/lib/pocketbase/auth";
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchLeagueStandings,
  fetchManagerHistory,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import {
  recommendChipWindows,
  getChipStatuses,
  buildRivalChipUsage,
  detectSpecialGameweeks,
} from "~/utils/chip-strategy";
import { Sparkles, Check, Clock, Users } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const config = getEnvConfig();
  const [bootstrap, fixtures, league] = await Promise.all([
    fetchBootstrapStatic(),
    fetchFixtures(),
    fetchLeagueStandings(config.fplLeagueId),
  ]);

  const currentGW =
    bootstrap.events.find((e) => e.is_current)?.id ??
    bootstrap.events.find((e) => e.is_next)?.id ??
    1;

  // Fetch all managers' history for chip usage
  const managersData = await Promise.all(
    league.standings.results.map(async (m) => {
      const history = await fetchManagerHistory(m.entry.toString());
      return {
        name: m.player_name,
        managerId: m.entry,
        chips: history.chips,
      };
    })
  );

  // Find the configured manager's chips, or the first manager
  const targetManagerId = config.fplManagerId
    ? parseInt(config.fplManagerId)
    : league.standings.results[0]?.entry;
  const myData = managersData.find((m) => m.managerId === targetManagerId) ?? managersData[0];

  const chipStatuses = getChipStatuses(myData?.chips ?? []);

  // Top players by form for TC recommendation
  const topPlayers = [...bootstrap.elements]
    .filter((p) => p.status === "a" && p.minutes > 270)
    .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 5);

  const recommendations = recommendChipWindows(
    fixtures,
    bootstrap.teams,
    bootstrap.events,
    myData?.chips ?? [],
    currentGW,
    topPlayers
  );

  const rivalChipUsage = buildRivalChipUsage(
    managersData.filter((m) => m.managerId !== targetManagerId)
  );

  // Detect DGW/BGW overview
  const totalGWs = bootstrap.events.length;
  const { doubleGWs, blankGWs } = detectSpecialGameweeks(
    fixtures,
    bootstrap.teams,
    currentGW + 1,
    totalGWs
  );

  return {
    chipStatuses,
    recommendations,
    rivalChipUsage,
    currentGW,
    totalGWs,
    managerName: myData?.name ?? "Unknown",
    doubleGWs: Object.fromEntries(doubleGWs),
    blankGWs: Object.fromEntries(blankGWs),
  };
}

export default function ChipPlannerPage({ loaderData }: Route.ComponentProps) {
  const {
    chipStatuses,
    recommendations,
    rivalChipUsage,
    currentGW,
    managerName,
    doubleGWs,
    blankGWs,
  } = loaderData;

  const chipColors: Record<string, string> = {
    wildcard: "#10B981",
    "3xc": "#F59E0B",
    bboost: "#3B82F6",
    freehit: "#EF4444",
  };

  return (
    <main className="min-h-screen" style={{ background: "#D97706" }}>
      {/* Hero */}
      <section
        className="kit-hero kit-diagonal-cut relative"
        style={{ background: "linear-gradient(135deg, #D97706, #92400E)" }}
      >
        <div className="kit-stripe" style={{ background: "#F59E0B" }} />
        <span className="kit-watermark">CHIPS</span>
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Sparkles size={24} color="white" />
            </div>
            <p className="text-white/70 text-sm font-medium tracking-wider uppercase">
              Strategic Planning
            </p>
          </div>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            Chip Planner
          </h1>
          <p className="text-white/60 mt-3 max-w-lg">
            Time your chips for maximum impact. Don&apos;t waste them.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 pb-16 space-y-6">
        {/* Your chip status */}
        <div
          className="kit-card p-6 kit-animate-slide-up"
          style={{ "--delay": "0ms" } as React.CSSProperties}
        >
          <h2 className="kit-headline text-lg text-gray-900 mb-1">
            Your Chips — {managerName}
          </h2>
          <p className="text-sm text-gray-500 mb-4">Current chip availability</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {chipStatuses.map((chip) => (
              <div
                key={chip.chip}
                className={`p-4 rounded-xl border-2 text-center ${
                  chip.used
                    ? "border-gray-200 bg-gray-50"
                    : "border-current bg-white"
                }`}
                style={{
                  color: chip.used ? "#9CA3AF" : chipColors[chip.chip],
                }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  {chip.used ? (
                    <Check size={16} className="text-gray-400" />
                  ) : (
                    <Clock size={16} />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {chip.used ? "Used" : "Available"}
                  </span>
                </div>
                <p className="kit-headline text-lg">
                  {chip.chipLabel}
                </p>
                {chip.used && chip.usedInGW && (
                  <p className="text-xs text-gray-400 mt-1">
                    GW{chip.usedInGW}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Special gameweek calendar */}
        {(Object.keys(doubleGWs).length > 0 ||
          Object.keys(blankGWs).length > 0) && (
          <div
            className="kit-card p-6 kit-animate-slide-up"
            style={{ "--delay": "50ms" } as React.CSSProperties}
          >
            <h2 className="kit-headline text-lg text-gray-900 mb-4">
              Special Gameweeks Ahead
            </h2>
            <div className="space-y-3">
              {Object.entries(doubleGWs).map(([gw, teams]) => (
                <div
                  key={`dgw-${gw}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                >
                  <span className="kit-headline text-xl text-blue-600 shrink-0 w-12">
                    GW{gw}
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Double Gameweek
                    </span>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {(teams as string[]).join(", ")}
                    </p>
                  </div>
                </div>
              ))}
              {Object.entries(blankGWs).map(([gw, teams]) => (
                <div
                  key={`bgw-${gw}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <span className="kit-headline text-xl text-red-600 shrink-0 w-12">
                    GW{gw}
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                      Blank Gameweek
                    </span>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {(teams as string[]).join(", ")} don&apos;t play
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div
          className="kit-card p-6 kit-animate-slide-up"
          style={{ "--delay": "100ms" } as React.CSSProperties}
        >
          <h2 className="kit-headline text-lg text-gray-900 mb-1">
            Recommendations
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Best windows for your remaining chips
          </p>
          {recommendations.length === 0 ? (
            <p className="text-gray-400 italic">
              No special gameweeks detected yet — check back as the schedule
              updates.
            </p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, i) => (
                <div
                  key={`${rec.chip}-${rec.gameweek}`}
                  className="p-4 rounded-xl border-2"
                  style={{
                    borderColor: chipColors[rec.chip] ?? "#D1D5DB",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="kit-headline text-2xl"
                      style={{ color: chipColors[rec.chip] }}
                    >
                      GW{rec.gameweek}
                    </span>
                    <span
                      className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white"
                      style={{ background: chipColors[rec.chip] }}
                    >
                      {rec.chipLabel}
                    </span>
                    {rec.isDoubleGameweek && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        DGW
                      </span>
                    )}
                    {rec.isBlankGameweek && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        BGW
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {rec.reasons.map((reason, j) => (
                      <li
                        key={j}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="text-gray-400 mt-0.5">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rival chip usage */}
        <div
          className="kit-card p-6 kit-animate-slide-up"
          style={{ "--delay": "150ms" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-amber-600" />
            <h2 className="kit-headline text-lg text-gray-900">
              Rival Chip Intel
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            What chips your rivals have left — plan accordingly.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-2 text-gray-500 font-medium">Manager</th>
                  <th className="pb-2 text-gray-500 font-medium">Used</th>
                  <th className="pb-2 text-gray-500 font-medium">
                    Remaining
                  </th>
                </tr>
              </thead>
              <tbody>
                {rivalChipUsage.map((rival) => (
                  <tr
                    key={rival.managerName}
                    className="kit-table-row border-b border-gray-100"
                  >
                    <td className="py-3 font-medium text-gray-900">
                      {rival.managerName}
                    </td>
                    <td className="py-3">
                      {rival.chipsUsed.length === 0 ? (
                        <span className="text-gray-400 text-xs">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {rival.chipsUsed.map((c, i) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {c.chip} (GW{c.gameweek})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {rival.chipsRemaining.map((chip) => (
                          <span
                            key={chip}
                            className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
