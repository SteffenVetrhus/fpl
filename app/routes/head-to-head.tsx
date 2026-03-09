import { useLoaderData } from "react-router";
import { useState } from "react";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/head-to-head";
import { requireAuth } from "~/lib/pocketbase/auth";

interface H2HRecord {
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  longestWinStreak: number;
  currentStreak: number;
  currentStreakType: "W" | "D" | "L" | "";
}

interface H2HData {
  managers: string[];
  matrix: Record<string, Record<string, H2HRecord>>;
  totalGameweeks: number;
  dominanceAward: { winner: string; loser: string; record: H2HRecord } | null;
  closestRivalry: { m1: string; m2: string; record: H2HRecord } | null;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  const allManagers = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        gameweeks: history.current,
      };
    })
  );

  const managerNames = allManagers.map((m) => m.name);
  const matrix: Record<string, Record<string, H2HRecord>> = {};

  // Initialize matrix
  managerNames.forEach((m1) => {
    matrix[m1] = {};
    managerNames.forEach((m2) => {
      if (m1 !== m2) {
        matrix[m1][m2] = {
          wins: 0,
          draws: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          longestWinStreak: 0,
          currentStreak: 0,
          currentStreakType: "",
        };
      }
    });
  });

  // Calculate H2H records
  const totalGWs = allManagers[0]?.gameweeks.length ?? 0;

  for (let gwIdx = 0; gwIdx < totalGWs; gwIdx++) {
    for (let i = 0; i < allManagers.length; i++) {
      for (let j = i + 1; j < allManagers.length; j++) {
        const m1 = allManagers[i];
        const m2 = allManagers[j];
        const p1 = m1.gameweeks[gwIdx]?.points ?? 0;
        const p2 = m2.gameweeks[gwIdx]?.points ?? 0;

        // Update m1 vs m2
        matrix[m1.name][m2.name].pointsFor += p1;
        matrix[m1.name][m2.name].pointsAgainst += p2;
        matrix[m2.name][m1.name].pointsFor += p2;
        matrix[m2.name][m1.name].pointsAgainst += p1;

        if (p1 > p2) {
          matrix[m1.name][m2.name].wins++;
          matrix[m2.name][m1.name].losses++;
          // Streak tracking for m1 vs m2
          if (matrix[m1.name][m2.name].currentStreakType === "W") {
            matrix[m1.name][m2.name].currentStreak++;
          } else {
            matrix[m1.name][m2.name].currentStreakType = "W";
            matrix[m1.name][m2.name].currentStreak = 1;
          }
          matrix[m1.name][m2.name].longestWinStreak = Math.max(
            matrix[m1.name][m2.name].longestWinStreak,
            matrix[m1.name][m2.name].currentStreak
          );
          // Reset opponent streak
          if (matrix[m2.name][m1.name].currentStreakType === "L") {
            matrix[m2.name][m1.name].currentStreak++;
          } else {
            matrix[m2.name][m1.name].currentStreakType = "L";
            matrix[m2.name][m1.name].currentStreak = 1;
          }
        } else if (p2 > p1) {
          matrix[m2.name][m1.name].wins++;
          matrix[m1.name][m2.name].losses++;
          if (matrix[m2.name][m1.name].currentStreakType === "W") {
            matrix[m2.name][m1.name].currentStreak++;
          } else {
            matrix[m2.name][m1.name].currentStreakType = "W";
            matrix[m2.name][m1.name].currentStreak = 1;
          }
          matrix[m2.name][m1.name].longestWinStreak = Math.max(
            matrix[m2.name][m1.name].longestWinStreak,
            matrix[m2.name][m1.name].currentStreak
          );
          if (matrix[m1.name][m2.name].currentStreakType === "L") {
            matrix[m1.name][m2.name].currentStreak++;
          } else {
            matrix[m1.name][m2.name].currentStreakType = "L";
            matrix[m1.name][m2.name].currentStreak = 1;
          }
        } else {
          matrix[m1.name][m2.name].draws++;
          matrix[m2.name][m1.name].draws++;
          matrix[m1.name][m2.name].currentStreakType = "D";
          matrix[m1.name][m2.name].currentStreak = 1;
          matrix[m2.name][m1.name].currentStreakType = "D";
          matrix[m2.name][m1.name].currentStreak = 1;
        }
      }
    }
  }

  // Find most dominant pair
  let dominanceAward: H2HData["dominanceAward"] = null;
  let closestRivalry: H2HData["closestRivalry"] = null;
  let maxWinRate = 0;
  let minDiff = Infinity;

  managerNames.forEach((m1) => {
    managerNames.forEach((m2) => {
      if (m1 === m2) return;
      const record = matrix[m1][m2];
      const total = record.wins + record.draws + record.losses;
      if (total === 0) return;

      const winRate = record.wins / total;
      if (winRate > maxWinRate) {
        maxWinRate = winRate;
        dominanceAward = { winner: m1, loser: m2, record };
      }

      // Closest rivalry (smallest win difference, only count each pair once)
      if (m1 < m2) {
        const diff = Math.abs(record.wins - record.losses);
        if (diff < minDiff) {
          minDiff = diff;
          closestRivalry = { m1, m2, record };
        }
      }
    });
  });

  return {
    managers: managerNames,
    matrix,
    totalGameweeks: totalGWs,
    dominanceAward,
    closestRivalry,
  } as H2HData;
}

export default function HeadToHead({ loaderData }: Route.ComponentProps) {
  const { managers, matrix, totalGameweeks, dominanceAward, closestRivalry } =
    useLoaderData<typeof loader>();

  const [selectedManager, setSelectedManager] = useState(managers[0] ?? "");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-h2h)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-h2h)" }}>
        <div className="kit-watermark">VS</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-h2h-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Every gameweek is a head-to-head battle
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Head to Head<br />Grudge Match
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Awards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dominanceAward && (
            <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">🏠</div>
              <h3 className="kit-headline text-lg text-gray-900">Landlord Award</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong className="text-rose-600">{dominanceAward.winner}</strong> owns{" "}
                <strong>{dominanceAward.loser}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {dominanceAward.record.wins}W {dominanceAward.record.draws}D {dominanceAward.record.losses}L
              </p>
            </div>
          )}
          {closestRivalry && (
            <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "250ms" } as React.CSSProperties}>
              <div className="text-3xl mb-2">🤝</div>
              <h3 className="kit-headline text-lg text-gray-900">Closest Rivalry</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong className="text-rose-600">{closestRivalry.m1}</strong> vs{" "}
                <strong className="text-rose-600">{closestRivalry.m2}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {closestRivalry.record.wins}W {closestRivalry.record.draws}D {closestRivalry.record.losses}L
              </p>
            </div>
          )}
        </div>

        {/* Manager selector */}
        <div className="kit-card p-6 kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
          <h2 className="kit-headline text-xl text-gray-900 mb-4">Select a Manager</h2>
          <div className="flex flex-wrap gap-2">
            {managers.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedManager(name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedManager === name
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={selectedManager === name ? { background: "var(--color-page-h2h)" } : {}}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* H2H records for selected manager */}
        {selectedManager && matrix[selectedManager] && (
          <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "350ms" } as React.CSSProperties}>
            <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-h2h-dark)" }}>
              <h2 className="kit-headline text-xl text-white">{selectedManager}'s Record</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {managers
                .filter((m) => m !== selectedManager)
                .sort((a, b) => {
                  const rA = matrix[selectedManager][a];
                  const rB = matrix[selectedManager][b];
                  return rB.wins - rB.losses - (rA.wins - rA.losses);
                })
                .map((opponent) => {
                  const record = matrix[selectedManager][opponent];
                  const total = record.wins + record.draws + record.losses;
                  const winPct = total > 0 ? (record.wins / total) * 100 : 0;

                  return (
                    <div key={opponent} className="p-5 kit-table-row">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">vs {opponent}</span>
                            {winPct >= 70 && (
                              <span className="kit-badge bg-green-100 text-green-700">Dominant</span>
                            )}
                            {winPct <= 30 && total > 0 && (
                              <span className="kit-badge bg-red-100 text-red-700">Bogey Manager</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {/* Win/Draw/Loss bar */}
                            <div className="flex-1 h-4 rounded-full overflow-hidden bg-gray-100 flex">
                              {total > 0 && (
                                <>
                                  <div
                                    className="h-full bg-green-500"
                                    style={{ width: `${(record.wins / total) * 100}%` }}
                                    title={`${record.wins} wins`}
                                  />
                                  <div
                                    className="h-full bg-gray-300"
                                    style={{ width: `${(record.draws / total) * 100}%` }}
                                    title={`${record.draws} draws`}
                                  />
                                  <div
                                    className="h-full bg-red-500"
                                    style={{ width: `${(record.losses / total) * 100}%` }}
                                    title={`${record.losses} losses`}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span className="text-green-600 font-semibold">{record.wins}W</span>
                            <span>{record.draws}D</span>
                            <span className="text-red-600 font-semibold">{record.losses}L</span>
                            {record.longestWinStreak > 1 && (
                              <span>Best streak: <strong>{record.longestWinStreak}</strong></span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={winPct >= 50 ? "text-green-600" : "text-red-600"}
                            style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", lineHeight: 1 }}
                          >
                            {winPct.toFixed(0)}%
                          </div>
                          <div className="kit-stat-label text-gray-400">win rate</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
              <p>
                Based on {totalGameweeks} gameweeks of head-to-head comparison.
                Numbers don't lie. Your excuses do.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
