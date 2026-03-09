import { useState } from "react";
import type { Route } from "./+types/rival-spy";
import { requireAuth } from "~/lib/pocketbase/auth";
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchLeagueStandings,
  fetchGameweekPicks,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { compareTeams } from "~/utils/rival-analysis";
import { getDifficultyColor } from "~/utils/fixture-difficulty";
import { Crosshair, Shield, AlertTriangle, Swords } from "lucide-react";

interface ManagerPicks {
  managerId: number;
  managerName: string;
  teamName: string;
  picks: { element: number; position: number; multiplier: number; is_captain: boolean; is_vice_captain: boolean }[];
}

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
  const nextGW = bootstrap.events.find((e) => e.is_next)?.id ?? currentGW + 1;

  // Fetch all managers' picks
  const managers = league.standings.results;
  const allManagerPicks: ManagerPicks[] = [];

  for (const manager of managers) {
    try {
      const picks = await fetchGameweekPicks(manager.entry.toString(), currentGW);
      allManagerPicks.push({
        managerId: manager.entry,
        managerName: manager.player_name,
        teamName: manager.entry_name,
        picks: picks.picks,
      });
    } catch {
      // Skip if picks not available
    }
  }

  // Pre-compute all pairwise comparisons
  const comparisons: Record<string, ReturnType<typeof compareTeams>> = {};
  for (let i = 0; i < allManagerPicks.length; i++) {
    for (let j = i + 1; j < allManagerPicks.length; j++) {
      const m1 = allManagerPicks[i];
      const m2 = allManagerPicks[j];
      const key = `${m1.managerId}-${m2.managerId}`;
      comparisons[key] = compareTeams(
        m1.picks,
        m2.picks,
        bootstrap.elements,
        fixtures,
        bootstrap.teams,
        nextGW
      );
    }
  }

  return {
    managers: allManagerPicks.map((m) => ({
      id: m.managerId,
      name: m.managerName,
      teamName: m.teamName,
    })),
    comparisons,
    nextGW,
    defaultManagerId: config.fplManagerId
      ? parseInt(config.fplManagerId)
      : allManagerPicks[0]?.managerId ?? 0,
  };
}

export default function RivalSpyPage({ loaderData }: Route.ComponentProps) {
  const { managers, comparisons, nextGW, defaultManagerId } = loaderData;

  const [yourId, setYourId] = useState(defaultManagerId);
  const [rivalId, setRivalId] = useState(
    managers.find((m) => m.id !== defaultManagerId)?.id ?? 0
  );

  // Find comparison (works in either direction)
  const key1 = `${Math.min(yourId, rivalId)}-${Math.max(yourId, rivalId)}`;
  const comparison = comparisons[key1];
  const isReversed = yourId > rivalId;

  // If reversed, swap the perspective
  const shared = comparison?.shared ?? [];
  const onlyYours = isReversed
    ? comparison?.onlyTheirs ?? []
    : comparison?.onlyYours ?? [];
  const onlyTheirs = isReversed
    ? comparison?.onlyYours ?? []
    : comparison?.onlyTheirs ?? [];
  const yourCaptain = isReversed
    ? comparison?.theirCaptain
    : comparison?.yourCaptain;
  const theirCaptain = isReversed
    ? comparison?.yourCaptain
    : comparison?.theirCaptain;
  const exploits = comparison?.exploitOpportunities ?? [];

  const yourName = managers.find((m) => m.id === yourId)?.name ?? "You";
  const rivalName = managers.find((m) => m.id === rivalId)?.name ?? "Rival";

  return (
    <main className="min-h-screen" style={{ background: "#DC2626" }}>
      {/* Hero */}
      <section
        className="kit-hero kit-diagonal-cut relative"
        style={{ background: "linear-gradient(135deg, #DC2626, #991B1B)" }}
      >
        <div className="kit-stripe" style={{ background: "#EF4444" }} />
        <span className="kit-watermark">SPY</span>
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Crosshair size={24} color="white" />
            </div>
            <p className="text-white/70 text-sm font-medium tracking-wider uppercase">
              GW{nextGW} Intelligence
            </p>
          </div>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            Rival Spy
          </h1>
          <p className="text-white/60 mt-3 max-w-lg">
            Know thy enemy. Compare teams, find differentials, exploit
            weaknesses.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 pb-16 space-y-6">
        {/* Manager selectors */}
        <div
          className="kit-card p-6 kit-animate-slide-up"
          style={{ "--delay": "0ms" } as React.CSSProperties}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="kit-stat-label text-gray-500 block mb-1">
                Your Team
              </label>
              <select
                value={yourId}
                onChange={(e) => setYourId(parseInt(e.target.value))}
                className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-900 font-medium"
              >
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.teamName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <Swords size={24} className="text-red-400" />
            </div>
            <div className="flex-1 w-full">
              <label className="kit-stat-label text-gray-500 block mb-1">
                Rival Team
              </label>
              <select
                value={rivalId}
                onChange={(e) => setRivalId(parseInt(e.target.value))}
                className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-900 font-medium"
              >
                {managers
                  .filter((m) => m.id !== yourId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.teamName}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {comparison && (
          <>
            {/* Captain comparison */}
            <div
              className="kit-card p-6 kit-animate-slide-up"
              style={{ "--delay": "50ms" } as React.CSSProperties}
            >
              <h2 className="kit-headline text-lg text-gray-900 mb-4">
                Captain Battle
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-blue-50">
                  <p className="kit-stat-label text-blue-600 mb-1">
                    {yourName}
                  </p>
                  <p className="kit-headline text-2xl text-gray-900">
                    {yourCaptain?.webName ?? "Unknown"}
                  </p>
                  {yourCaptain && (
                    <p className="text-sm text-gray-500 mt-1">
                      {yourCaptain.teamShort} · EP{" "}
                      {yourCaptain.expectedPoints.toFixed(1)}
                    </p>
                  )}
                </div>
                <div className="text-center p-4 rounded-xl bg-red-50">
                  <p className="kit-stat-label text-red-600 mb-1">
                    {rivalName}
                  </p>
                  <p className="kit-headline text-2xl text-gray-900">
                    {theirCaptain?.webName ?? "Unknown"}
                  </p>
                  {theirCaptain && (
                    <p className="text-sm text-gray-500 mt-1">
                      {theirCaptain.teamShort} · EP{" "}
                      {theirCaptain.expectedPoints.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Exploit opportunities */}
            {exploits.length > 0 && (
              <div
                className="kit-card p-6 kit-animate-slide-up"
                style={{ "--delay": "100ms" } as React.CSSProperties}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={20} className="text-amber-500" />
                  <h2 className="kit-headline text-lg text-gray-900">
                    Exploit Opportunities
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Weaknesses in {rivalName}&apos;s team you can take advantage
                  of.
                </p>
                <div className="space-y-2">
                  {exploits.map((exploit, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        exploit.severity === "high"
                          ? "bg-red-50 border border-red-200"
                          : exploit.severity === "medium"
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          exploit.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : exploit.severity === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {exploit.severity}
                      </span>
                      <span className="text-sm text-gray-700">
                        {exploit.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Shared players */}
              <div
                className="kit-card p-6 kit-animate-slide-up"
                style={{ "--delay": "150ms" } as React.CSSProperties}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={18} className="text-gray-500" />
                  <h3 className="kit-headline text-base text-gray-900">
                    Shared ({shared.length})
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  These players cancel out — no differential.
                </p>
                <div className="space-y-1.5">
                  {shared.map((p) => (
                    <PlayerRow key={p.id} player={p} muted />
                  ))}
                </div>
              </div>

              {/* Only yours */}
              <div
                className="kit-card p-6 kit-animate-slide-up"
                style={{ "--delay": "200ms" } as React.CSSProperties}
              >
                <h3 className="kit-headline text-base text-blue-700 mb-4">
                  Only {yourName} ({onlyYours.length})
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Your differentials — you gain when these haul.
                </p>
                <div className="space-y-1.5">
                  {onlyYours.map((p) => (
                    <PlayerRow key={p.id} player={p} highlight="blue" />
                  ))}
                </div>
              </div>

              {/* Only theirs */}
              <div
                className="kit-card p-6 kit-animate-slide-up"
                style={{ "--delay": "250ms" } as React.CSSProperties}
              >
                <h3 className="kit-headline text-base text-red-700 mb-4">
                  Only {rivalName} ({onlyTheirs.length})
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Their differentials — you lose when these haul.
                </p>
                <div className="space-y-1.5">
                  {onlyTheirs.map((p) => (
                    <PlayerRow key={p.id} player={p} highlight="red" />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {!comparison && (
          <div className="kit-card p-8 text-center">
            <p className="text-gray-500">
              Select two different managers to compare teams.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function PlayerRow({
  player,
  muted,
  highlight,
}: {
  player: {
    id: number;
    webName: string;
    teamShort: string;
    position: string;
    form: number;
    expectedPoints: number;
    upcomingDifficulty: number;
    isCaptain: boolean;
    isOnBench: boolean;
    status: string;
  };
  muted?: boolean;
  highlight?: "blue" | "red";
}) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
        muted
          ? "bg-gray-50 text-gray-500"
          : highlight === "blue"
            ? "bg-blue-50 text-gray-800"
            : highlight === "red"
              ? "bg-red-50 text-gray-800"
              : "bg-gray-50 text-gray-700"
      }`}
    >
      <span className="font-medium flex-1 truncate">
        {player.webName}
        {player.isCaptain && " (C)"}
        {player.isOnBench && " [B]"}
      </span>
      <span className="text-xs text-gray-400">{player.teamShort}</span>
      <span
        className={`text-xs px-1.5 py-0.5 rounded ${getDifficultyColor(player.upcomingDifficulty)}`}
      >
        FDR {player.upcomingDifficulty}
      </span>
      {player.status !== "a" && (
        <span className="text-xs text-red-500 font-medium">
          {player.status === "i"
            ? "INJ"
            : player.status === "d"
              ? "DBT"
              : "OUT"}
        </span>
      )}
    </div>
  );
}
