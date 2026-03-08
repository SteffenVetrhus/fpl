/**
 * Captain scoring algorithm
 * Ranks players by expected captain returns using form, fixtures, xG, and availability
 */

import type { FPLElement, FPLFixture, FPLTeam } from "~/lib/fpl-api/types";

export interface CaptainCandidate {
  playerId: number;
  webName: string;
  teamName: string;
  teamShort: string;
  position: string;
  cost: number;
  ownership: number;
  captainScore: number;
  breakdown: {
    formScore: number;
    fixtureScore: number;
    expectedPointsScore: number;
    availabilityScore: number;
    xgiScore: number;
  };
  opponent: string;
  isHome: boolean;
  fixtureDifficulty: number;
}

const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

/**
 * Score and rank players for captaincy
 *
 * @param players - All players from bootstrap
 * @param fixtures - All fixtures
 * @param teams - All teams
 * @param nextGameweek - The upcoming GW number
 * @param limit - Max results to return (default: 15)
 * @returns Sorted captain candidates, best first
 */
export function rankCaptainCandidates(
  players: FPLElement[],
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  nextGameweek: number,
  limit: number = 15
): CaptainCandidate[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const nextGWFixtures = fixtures.filter((f) => f.event === nextGameweek);

  // Build team-to-fixture map
  const teamFixtureMap = new Map<number, FPLFixture[]>();
  for (const fixture of nextGWFixtures) {
    if (!teamFixtureMap.has(fixture.team_h)) {
      teamFixtureMap.set(fixture.team_h, []);
    }
    teamFixtureMap.get(fixture.team_h)!.push(fixture);

    if (!teamFixtureMap.has(fixture.team_a)) {
      teamFixtureMap.set(fixture.team_a, []);
    }
    teamFixtureMap.get(fixture.team_a)!.push(fixture);
  }

  const candidates: CaptainCandidate[] = [];

  for (const player of players) {
    // Skip unavailable / low-minutes players
    if (player.status === "u" || player.minutes < 90) continue;
    if (player.chance_of_playing_next_round !== null && player.chance_of_playing_next_round < 50) continue;

    const playerFixtures = teamFixtureMap.get(player.team);
    if (!playerFixtures || playerFixtures.length === 0) continue;

    const team = teamMap.get(player.team);
    if (!team) continue;

    const fixture = playerFixtures[0];
    const isHome = fixture.team_h === player.team;
    const opponentId = isHome ? fixture.team_a : fixture.team_h;
    const opponent = teamMap.get(opponentId);
    const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;

    // Score components (each normalized roughly 0-10)
    const form = parseFloat(player.form) || 0;
    const formScore = Math.min(form * 1.5, 10);

    // Fixture score: 5 - difficulty gives 0-4, scale to 0-10
    const fixtureScore = Math.max(0, (5 - difficulty) * 2.5);

    // Expected points score
    const epNext = parseFloat(player.ep_next ?? "0");
    const expectedPointsScore = Math.min(epNext * 1.2, 10);

    // Availability score
    const chanceOfPlaying = player.chance_of_playing_next_round ?? 100;
    const availabilityScore = chanceOfPlaying / 10;

    // xGI score (expected goal involvements)
    const xgi = parseFloat(player.expected_goal_involvements) || 0;
    const minutesFactor = player.minutes > 0 ? 90 / (player.minutes / player.starts || 90) : 0;
    const xgiPer90 = player.minutes > 0 ? (xgi / player.minutes) * 90 : 0;
    const xgiScore = Math.min(xgiPer90 * 15, 10);

    // Weighted total
    const captainScore =
      formScore * 0.25 +
      fixtureScore * 0.20 +
      expectedPointsScore * 0.30 +
      availabilityScore * 0.10 +
      xgiScore * 0.15;

    // Bonus for double gameweeks
    const dgwBonus = playerFixtures.length > 1 ? captainScore * 0.5 : 0;

    candidates.push({
      playerId: player.id,
      webName: player.web_name,
      teamName: team.name,
      teamShort: team.short_name,
      position: POSITION_MAP[player.element_type] ?? "???",
      cost: player.now_cost / 10,
      ownership: parseFloat(player.selected_by_percent),
      captainScore: captainScore + dgwBonus,
      breakdown: {
        formScore,
        fixtureScore,
        expectedPointsScore,
        availabilityScore,
        xgiScore,
      },
      opponent: `${opponent?.short_name ?? "???"}${isHome ? " (H)" : " (A)"}`,
      isHome,
      fixtureDifficulty: difficulty,
    });
  }

  return candidates
    .sort((a, b) => b.captainScore - a.captainScore)
    .slice(0, limit);
}
