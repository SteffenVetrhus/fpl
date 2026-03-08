/**
 * Differential finder algorithm
 * Surfaces low-ownership players with high potential returns
 */

import type { FPLElement, FPLFixture, FPLTeam } from "~/lib/fpl-api/types";

export interface Differential {
  id: number;
  webName: string;
  teamName: string;
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
}

const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

/**
 * Find differential picks — low-ownership players with high upside
 *
 * @param players - All players from bootstrap
 * @param fixtures - All fixtures
 * @param teams - All teams
 * @param nextGW - Next gameweek number
 * @param maxOwnership - Max ownership % to qualify as differential (default: 10)
 * @param leaguePlayerIds - Optional set of player IDs owned by league members (to find league-specific differentials)
 * @returns Sorted differentials, best first, grouped by position
 */
export function findDifferentials(
  players: FPLElement[],
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  nextGW: number,
  maxOwnership: number = 10,
  leaguePlayerIds?: Set<number>
): { position: string; players: Differential[] }[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const allDifferentials: Differential[] = [];

  for (const player of players) {
    const ownership = parseFloat(player.selected_by_percent);
    if (ownership > maxOwnership) continue;
    if (player.status !== "a") continue;
    if (player.minutes < 180) continue; // Need at least 2 starts

    const team = teamMap.get(player.team);
    if (!team) continue;

    // Get upcoming fixtures
    const upcomingFixtures: string[] = [];
    let totalDiff = 0;
    let fixCount = 0;

    for (let gw = nextGW; gw < nextGW + 4; gw++) {
      const gwFixtures = fixtures.filter(
        (f) => f.event === gw && (f.team_h === player.team || f.team_a === player.team)
      );

      if (gwFixtures.length === 0) {
        upcomingFixtures.push("BGW");
        totalDiff += 5;
        fixCount++;
      } else {
        for (const fix of gwFixtures) {
          const isHome = fix.team_h === player.team;
          const oppId = isHome ? fix.team_a : fix.team_h;
          const opp = teamMap.get(oppId);
          const diff = isHome ? fix.team_h_difficulty : fix.team_a_difficulty;
          upcomingFixtures.push(`${opp?.short_name ?? "???"}${isHome ? "(H)" : "(A)"}`);
          totalDiff += diff;
          fixCount++;
        }
      }
    }

    const avgDifficulty = fixCount > 0 ? totalDiff / fixCount : 3;
    const form = parseFloat(player.form) || 0;
    const epNext = parseFloat(player.ep_next ?? "0");
    const xgi = parseFloat(player.expected_goal_involvements) || 0;
    const xgiPer90 = player.minutes > 0 ? (xgi / player.minutes) * 90 : 0;
    const ppg = parseFloat(player.points_per_game) || 0;
    const isRising = player.transfers_in_event > player.transfers_out_event * 1.5;

    // Differential score: high form + easy fixtures + good underlying stats + low ownership bonus
    const fixtureBonus = Math.max(0, (5 - avgDifficulty) * 2);
    const ownershipBonus = Math.max(0, (maxOwnership - ownership) / maxOwnership * 3);
    const differentialScore =
      form * 0.25 +
      fixtureBonus * 0.20 +
      epNext * 0.15 +
      xgiPer90 * 10 * 0.15 +
      ppg * 0.15 +
      ownershipBonus * 0.10;

    allDifferentials.push({
      id: player.id,
      webName: player.web_name,
      teamName: team.name,
      teamShort: team.short_name,
      position: POSITION_MAP[player.element_type] ?? "???",
      cost: player.now_cost / 10,
      ownership,
      form,
      expectedPoints: epNext,
      xGI90: Math.round(xgiPer90 * 100) / 100,
      differentialScore,
      upcomingFixtures,
      avgFixtureDifficulty: avgDifficulty,
      isRising,
      transfersInEvent: player.transfers_in_event,
    });
  }

  // Filter league-specific differentials if league data provided
  const filtered = leaguePlayerIds
    ? allDifferentials.filter((d) => !leaguePlayerIds.has(d.id))
    : allDifferentials;

  // Group by position
  const positions = ["GKP", "DEF", "MID", "FWD"];
  return positions.map((pos) => ({
    position: pos,
    players: filtered
      .filter((d) => d.position === pos)
      .sort((a, b) => b.differentialScore - a.differentialScore)
      .slice(0, 5),
  }));
}
