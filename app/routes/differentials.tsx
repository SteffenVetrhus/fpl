import type { Route } from "./+types/differentials";
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchLeagueStandings,
  fetchGameweekPicks,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { findDifferentials } from "~/utils/differential-score";
import { getDifficultyColor } from "~/utils/fixture-difficulty";
import { Gem, TrendingUp, Eye } from "lucide-react";

export async function loader() {
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
  const nextGW = bootstrap.events.find((e) => e.is_next)?.id ?? currentGW + 1;

  // Fetch all league managers' picks to find league-specific differentials
  let leaguePlayerIds: Set<number> | undefined;
  try {
    const allPicks = await Promise.all(
      league.standings.results.map((m) =>
        fetchGameweekPicks(m.entry.toString(), currentGW)
      )
    );
    leaguePlayerIds = new Set<number>();
    for (const picks of allPicks) {
      for (const pick of picks.picks) {
        leaguePlayerIds.add(pick.element);
      }
    }
  } catch {
    // If picks fetch fails (e.g. GW hasn't started), skip league filtering
  }

  const globalDifferentials = findDifferentials(
    bootstrap.elements,
    fixtures,
    bootstrap.teams,
    nextGW,
    10
  );

  const leagueDifferentials = leaguePlayerIds
    ? findDifferentials(
        bootstrap.elements,
        fixtures,
        bootstrap.teams,
        nextGW,
        15,
        leaguePlayerIds
      )
    : null;

  return {
    globalDifferentials,
    leagueDifferentials,
    nextGW,
    leagueName: league.league.name,
    managerCount: league.standings.results.length,
  };
}

export default function DifferentialsPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    globalDifferentials,
    leagueDifferentials,
    nextGW,
    leagueName,
  } = loaderData;

  return (
    <main className="min-h-screen" style={{ background: "#7C3AED" }}>
      {/* Hero */}
      <section
        className="kit-hero kit-diagonal-cut relative"
        style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
      >
        <div className="kit-stripe" style={{ background: "#8B5CF6" }} />
        <span className="kit-watermark">GEMS</span>
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Gem size={24} color="white" />
            </div>
            <p className="text-white/70 text-sm font-medium tracking-wider uppercase">
              GW{nextGW} Differentials
            </p>
          </div>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            Hidden Gems
          </h1>
          <p className="text-white/60 mt-3 max-w-lg">
            Low-ownership players with high upside. The picks your rivals
            don&apos;t have.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 pb-16 space-y-8">
        {/* League-specific differentials */}
        {leagueDifferentials && (
          <div
            className="kit-card p-6 kit-animate-slide-up"
            style={{ "--delay": "0ms" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-4">
              <Eye size={20} className="text-purple-600" />
              <h2 className="kit-headline text-xl text-gray-900">
                Nobody In {leagueName} Owns These
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Players not owned by anyone in your league — maximum differential
              potential.
            </p>
            {leagueDifferentials.map((group) => (
              <div key={group.position} className="mb-6 last:mb-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-3">
                  {group.position === "GKP"
                    ? "Goalkeepers"
                    : group.position === "DEF"
                      ? "Defenders"
                      : group.position === "MID"
                        ? "Midfielders"
                        : "Forwards"}
                </h3>
                {group.players.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No standout differentials in this position
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.players.map((player) => (
                      <DifferentialCard
                        key={player.id}
                        player={player}
                        isLeagueDiff
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Global differentials */}
        <div
          className="kit-card p-6 kit-animate-slide-up"
          style={{ "--delay": "100ms" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 mb-4">
            <Gem size={20} className="text-purple-600" />
            <h2 className="kit-headline text-xl text-gray-900">
              Global Differentials (&lt;10% owned)
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Under-the-radar players with strong form, easy fixtures, and good
            underlying stats.
          </p>
          {globalDifferentials.map((group) => (
            <div key={group.position} className="mb-6 last:mb-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-3">
                {group.position === "GKP"
                  ? "Goalkeepers"
                  : group.position === "DEF"
                    ? "Defenders"
                    : group.position === "MID"
                      ? "Midfielders"
                      : "Forwards"}
              </h3>
              {group.players.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No standout differentials
                </p>
              ) : (
                <div className="space-y-2">
                  {group.players.map((player) => (
                    <DifferentialCard key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function DifferentialCard({
  player,
  isLeagueDiff,
}: {
  player: {
    id: number;
    webName: string;
    teamShort: string;
    position: string;
    cost: number;
    ownership: number;
    form: number;
    expectedPoints: number;
    xGI90: number;
    differentialScore: number;
    upcomingFixtures: string[];
    avgFixtureDifficulty: number;
    isRising: boolean;
    transfersInEvent: number;
  };
  isLeagueDiff?: boolean;
}) {
  const scoreWidth = Math.min(100, (player.differentialScore / 8) * 100);

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      {/* Score */}
      <div className="w-12 text-center shrink-0 pt-0.5">
        <div className="kit-headline text-2xl text-purple-700">
          {player.differentialScore.toFixed(1)}
        </div>
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        {/* Name and team/position */}
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-gray-900 text-base">
            {player.webName}
          </span>
          <span className="text-xs text-gray-500 shrink-0">
            {player.teamShort} · {player.position}
          </span>
        </div>

        {/* Badges */}
        {(player.isRising || isLeagueDiff) && (
          <div className="flex items-center gap-2 mt-1">
            {player.isRising && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-600">
                <TrendingUp size={12} /> Rising
              </span>
            )}
            {isLeagueDiff && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                League diff
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-500">
          <span>£{player.cost.toFixed(1)}m</span>
          <span>{player.ownership}% owned</span>
          <span>Form: {player.form}</span>
          <span>xGI/90: {player.xGI90}</span>
          <span>EP: {player.expectedPoints.toFixed(1)}</span>
        </div>

        {/* Score bar */}
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
            style={{ width: `${scoreWidth}%` }}
          />
        </div>
      </div>

      {/* Upcoming fixtures */}
      <div className="flex gap-1 shrink-0 max-sm:hidden mt-1">
        {player.upcomingFixtures.slice(0, 4).map((fix, i) => {
          const isBGW = fix === "BGW";
          const difficultyGuess = isBGW
            ? 0
            : player.avgFixtureDifficulty <= 2
              ? 2
              : player.avgFixtureDifficulty <= 3
                ? 3
                : 4;
          return (
            <span
              key={i}
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${getDifficultyColor(difficultyGuess)}`}
            >
              {fix}
            </span>
          );
        })}
      </div>
    </div>
  );
}
