import {
  fetchLeagueStandings,
  fetchBootstrapStatic,
  fetchFixtures,
  fetchGameweekPicks,
  fetchManagerEntry,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import {
  identifySellCandidates,
  suggestTransfers,
} from "~/utils/transfer-score";
import type { Route } from "./+types/transfer-hub";
import type {
  SellCandidate,
  TransferSuggestion,
} from "~/utils/transfer-score";
import { ArrowRightLeft } from "lucide-react";

interface LoaderData {
  managerName: string | null;
  teamName: string | null;
  bank: number;
  sellCandidates: SellCandidate[];
  suggestions: TransferSuggestion[];
  noManagerId: boolean;
  error: string | null;
}

export async function loader(): Promise<LoaderData> {
  const config = getEnvConfig();

  if (!config.fplManagerId) {
    return {
      managerName: null,
      teamName: null,
      bank: 0,
      sellCandidates: [],
      suggestions: [],
      noManagerId: true,
      error: null,
    };
  }

  try {
    const [leagueData, bootstrap, fixtures, entry] = await Promise.all([
      fetchLeagueStandings(config.fplLeagueId),
      fetchBootstrapStatic(),
      fetchFixtures(),
      fetchManagerEntry(config.fplManagerId),
    ]);

    const currentEvent = bootstrap.events.find((e) => e.is_current);
    const nextEvent = bootstrap.events.find((e) => e.is_next);
    const nextGW = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1);
    const picksGW = currentEvent?.id ?? 1;

    const picks = await fetchGameweekPicks(config.fplManagerId, picksGW);

    const sellCandidates = identifySellCandidates(
      picks.picks,
      bootstrap.elements,
      fixtures,
      bootstrap.teams,
      nextGW
    );

    const suggestions = suggestTransfers(
      picks.picks,
      picks.entry_history.bank,
      bootstrap.elements,
      fixtures,
      bootstrap.teams,
      nextGW
    );

    const manager = leagueData.standings.results.find(
      (m) => m.entry.toString() === config.fplManagerId
    );

    return {
      managerName: manager?.player_name ?? `${entry.player_first_name} ${entry.player_last_name}`,
      teamName: manager?.entry_name ?? entry.name,
      bank: picks.entry_history.bank / 10,
      sellCandidates,
      suggestions,
      noManagerId: false,
      error: null,
    };
  } catch (err) {
    return {
      managerName: null,
      teamName: null,
      bank: 0,
      sellCandidates: [],
      suggestions: [],
      noManagerId: false,
      error: err instanceof Error ? err.message : "Failed to load transfer data",
    };
  }
}

const CYAN = "#0891B2";
const CYAN_LIGHT = "#06B6D4";

function urgencyColor(urgency: SellCandidate["urgency"]): string {
  switch (urgency) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200";
    case "medium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "low":
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function urgencyLabel(urgency: SellCandidate["urgency"]): string {
  switch (urgency) {
    case "high":
      return "Sell Now";
    case "medium":
      return "Monitor";
    case "low":
      return "Low Priority";
  }
}

export default function TransferHubPage({ loaderData }: Route.ComponentProps) {
  const {
    managerName,
    teamName,
    bank,
    sellCandidates,
    suggestions,
    noManagerId,
    error,
  } = loaderData;

  return (
    <div className="min-h-screen" style={{ background: CYAN }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: CYAN }}>
        <div className="kit-watermark">TRANSFERS</div>
        <div className="kit-stripe" style={{ background: CYAN_LIGHT }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Smart transfer recommendations
          </p>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            Transfer Hub
          </h1>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16">
        {/* No Manager ID Message */}
        {noManagerId && (
          <div
            className="kit-card p-6 md:p-8 kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 mb-4">
              <ArrowRightLeft className="w-6 h-6 text-cyan-600" />
              <h2 className="kit-headline text-2xl text-gray-900">
                Setup Required
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Set the <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">FPL_MANAGER_ID</code> environment
              variable to your FPL manager ID to get personalised transfer recommendations.
            </p>
            <p className="text-gray-500 text-sm">
              You can find your manager ID in the URL when viewing your team on the FPL website:
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono ml-1">
                fantasy.premierleague.com/entry/<strong>YOUR_ID</strong>/event/1
              </code>
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="kit-card p-6 md:p-8 kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 mb-4">
              <ArrowRightLeft className="w-6 h-6 text-red-500" />
              <h2 className="kit-headline text-2xl text-gray-900">
                Error Loading Data
              </h2>
            </div>
            <p className="text-gray-600">{error}</p>
          </div>
        )}

        {/* Manager Info Header */}
        {managerName && (
          <div
            className="kit-card p-6 md:p-8 mb-6 kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <ArrowRightLeft className="w-6 h-6 text-cyan-600" />
                  <h2 className="kit-headline text-2xl text-gray-900">
                    {managerName}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 italic ml-9">{teamName}</p>
              </div>
              <div className="flex items-center gap-2 ml-9 sm:ml-0">
                <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">Bank</span>
                <span className="kit-headline text-3xl text-cyan-600">
                  {bank.toFixed(1)}m
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 ml-9">
              Showing recommendations for the default manager. Set <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">FPL_MANAGER_ID</code> in your environment to change.
            </p>
          </div>
        )}

        {/* Sell Alerts */}
        {sellCandidates.length > 0 && (
          <div
            className="kit-card p-6 md:p-8 mb-6 kit-animate-slide-up"
            style={{ "--delay": "300ms" } as React.CSSProperties}
          >
            <h2 className="kit-headline text-2xl text-gray-900 mb-6">
              Sell Alerts
            </h2>
            <div className="space-y-4">
              {sellCandidates.map((candidate) => (
                <div
                  key={candidate.player.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50/50"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`kit-badge border ${urgencyColor(candidate.urgency)} mt-0.5`}
                    >
                      {urgencyLabel(candidate.urgency)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {candidate.player.webName}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {candidate.player.teamShort} &middot; {candidate.player.position}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {candidate.reasons.map((reason, i) => (
                          <span
                            key={i}
                            className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm ml-auto">
                    <div className="text-center">
                      <div className="kit-stat-label">Cost</div>
                      <div className="font-semibold text-gray-700">
                        {candidate.player.cost.toFixed(1)}m
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="kit-stat-label">Form</div>
                      <div className="font-semibold text-gray-700">
                        {candidate.player.form.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="kit-stat-label">xPts</div>
                      <div className="font-semibold text-gray-700">
                        {candidate.player.expectedPoints.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No sell candidates */}
        {managerName && sellCandidates.length === 0 && !error && (
          <div
            className="kit-card p-6 md:p-8 mb-6 kit-animate-slide-up"
            style={{ "--delay": "300ms" } as React.CSSProperties}
          >
            <h2 className="kit-headline text-2xl text-gray-900 mb-4">
              Sell Alerts
            </h2>
            <p className="text-gray-500">
              No sell candidates identified. Your squad looks solid!
            </p>
          </div>
        )}

        {/* Transfer Suggestions */}
        {suggestions.length > 0 && (
          <div
            className="kit-card p-6 md:p-8 kit-animate-slide-up"
            style={{ "--delay": "400ms" } as React.CSSProperties}
          >
            <h2 className="kit-headline text-2xl text-gray-900 mb-6">
              Transfer Suggestions
            </h2>
            <div className="space-y-4">
              {suggestions.map((suggestion: TransferSuggestion, idx: number) => (
                <div
                  key={`${suggestion.out.id}-${suggestion.in.player.id}`}
                  className="rounded-lg border border-gray-100 overflow-hidden kit-animate-slide-up"
                  style={{ "--delay": `${450 + idx * 50}ms` } as React.CSSProperties}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Player Out */}
                    <div className="flex-1 p-4 bg-red-50/50">
                      <div className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-2">
                        Out
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900 text-lg">
                          {suggestion.out.webName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {suggestion.out.teamShort} &middot; {suggestion.out.position}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {suggestion.out.cost.toFixed(1)}m
                      </div>
                      {sellCandidates
                        .find((s: SellCandidate) => s.player.id === suggestion.out.id)
                        ?.reasons.map((reason: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full mr-1 mb-1"
                          >
                            {reason}
                          </span>
                        ))}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center p-3 md:p-4 bg-gray-50">
                      <ArrowRightLeft className="w-5 h-5 text-cyan-600" />
                    </div>

                    {/* Player In */}
                    <div className="flex-1 p-4 bg-green-50/50">
                      <div className="text-xs text-green-500 uppercase tracking-wider font-semibold mb-2">
                        In
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900 text-lg">
                          {suggestion.in.player.webName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {suggestion.in.player.teamShort} &middot; {suggestion.in.player.position}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {suggestion.in.player.cost.toFixed(1)}m
                      </div>
                      {suggestion.in.reasons.map((reason: string, i: number) => (
                        <span
                          key={i}
                          className="inline-block text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full mr-1 mb-1"
                        >
                          {reason}
                        </span>
                      ))}
                      {suggestion.in.fixtureRun.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          Next fixtures: {suggestion.in.fixtureRun.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-400 mr-1">Net cost:</span>
                        <span
                          className={`font-semibold ${
                            suggestion.netCost > 0
                              ? "text-red-600"
                              : suggestion.netCost < 0
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          {suggestion.netCost > 0 ? "+" : ""}
                          {suggestion.netCost.toFixed(1)}m
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400 mr-1">Projected gain:</span>
                      <span
                        className={`font-semibold ${
                          suggestion.pointsGain > 0
                            ? "text-green-600"
                            : suggestion.pointsGain < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {suggestion.pointsGain > 0 ? "+" : ""}
                        {suggestion.pointsGain.toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No suggestions */}
        {managerName && suggestions.length === 0 && !error && (
          <div
            className="kit-card p-6 md:p-8 kit-animate-slide-up"
            style={{ "--delay": "400ms" } as React.CSSProperties}
          >
            <h2 className="kit-headline text-2xl text-gray-900 mb-4">
              Transfer Suggestions
            </h2>
            <p className="text-gray-500">
              No transfer suggestions right now. Your team is in good shape!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
