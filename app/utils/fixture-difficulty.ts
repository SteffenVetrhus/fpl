/**
 * Fixture difficulty calculation utilities
 * Computes FDR scores from team strength ratings and fixture data
 */

import type { FPLFixture, FPLTeam } from "~/lib/fpl-api/types";

export interface TeamFixture {
  gameweek: number;
  opponent: string;
  opponentShort: string;
  isHome: boolean;
  difficulty: number;
  kickoffTime: string | null;
}

export interface TeamFixtureRun {
  teamId: number;
  teamName: string;
  teamShort: string;
  fixtures: TeamFixture[];
  avgDifficulty: number;
  easyFixtureCount: number;
}

/**
 * Build a fixture difficulty grid for all teams over the next N gameweeks
 *
 * @param fixtures - All season fixtures from FPL API
 * @param teams - All teams from bootstrap data
 * @param currentGameweek - Current GW number
 * @param lookAhead - Number of GWs to look ahead (default: 6)
 * @returns Array of team fixture runs sorted by easiest schedule first
 */
export function buildFixtureGrid(
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  currentGameweek: number,
  lookAhead: number = 6
): TeamFixtureRun[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const targetGWs = Array.from(
    { length: lookAhead },
    (_, i) => currentGameweek + i + 1
  );

  const grid: TeamFixtureRun[] = teams.map((team) => {
    const teamFixtures: TeamFixture[] = targetGWs.map((gw) => {
      const gwFixtures = fixtures.filter(
        (f) =>
          f.event === gw &&
          (f.team_h === team.id || f.team_a === team.id)
      );

      if (gwFixtures.length === 0) {
        return {
          gameweek: gw,
          opponent: "BLANK",
          opponentShort: "BGW",
          isHome: false,
          difficulty: 0,
          kickoffTime: null,
        };
      }

      // Handle double gameweeks — return first fixture for grid, extras noted
      const fixture = gwFixtures[0];
      const isHome = fixture.team_h === team.id;
      const opponentId = isHome ? fixture.team_a : fixture.team_h;
      const opponent = teamMap.get(opponentId);
      const difficulty = isHome
        ? fixture.team_h_difficulty
        : fixture.team_a_difficulty;

      return {
        gameweek: gw,
        opponent: opponent?.name ?? "Unknown",
        opponentShort: `${opponent?.short_name ?? "???"}${isHome ? " (H)" : " (A)"}`,
        isHome,
        difficulty,
        kickoffTime: fixture.kickoff_time,
      };
    });

    const ratedFixtures = teamFixtures.filter((f) => f.difficulty > 0);
    const avgDifficulty =
      ratedFixtures.length > 0
        ? ratedFixtures.reduce((sum, f) => sum + f.difficulty, 0) /
          ratedFixtures.length
        : 5;
    const easyFixtureCount = ratedFixtures.filter(
      (f) => f.difficulty <= 2
    ).length;

    return {
      teamId: team.id,
      teamName: team.name,
      teamShort: team.short_name,
      fixtures: teamFixtures,
      avgDifficulty,
      easyFixtureCount,
    };
  });

  return grid.sort((a, b) => a.avgDifficulty - b.avgDifficulty);
}

/**
 * Get the difficulty color class for a given FDR rating
 *
 * @param difficulty - FDR rating 1-5 (0 = blank gameweek)
 * @returns Tailwind-compatible background color
 */
export function getDifficultyColor(difficulty: number): string {
  switch (difficulty) {
    case 0:
      return "bg-gray-200 text-gray-500";
    case 1:
      return "bg-emerald-500 text-white";
    case 2:
      return "bg-green-400 text-white";
    case 3:
      return "bg-amber-400 text-gray-900";
    case 4:
      return "bg-red-400 text-white";
    case 5:
      return "bg-red-700 text-white";
    default:
      return "bg-gray-300 text-gray-600";
  }
}

/**
 * Count double gameweeks for a team in a range
 */
export function countDoubleGameweeks(
  fixtures: FPLFixture[],
  teamId: number,
  fromGW: number,
  toGW: number
): number {
  let count = 0;
  for (let gw = fromGW; gw <= toGW; gw++) {
    const gwFixtures = fixtures.filter(
      (f) =>
        f.event === gw && (f.team_h === teamId || f.team_a === teamId)
    );
    if (gwFixtures.length > 1) count++;
  }
  return count;
}

/**
 * Find blank gameweeks for a team in a range
 */
export function findBlankGameweeks(
  fixtures: FPLFixture[],
  teamId: number,
  fromGW: number,
  toGW: number
): number[] {
  const blanks: number[] = [];
  for (let gw = fromGW; gw <= toGW; gw++) {
    const gwFixtures = fixtures.filter(
      (f) =>
        f.event === gw && (f.team_h === teamId || f.team_a === teamId)
    );
    if (gwFixtures.length === 0) blanks.push(gw);
  }
  return blanks;
}
