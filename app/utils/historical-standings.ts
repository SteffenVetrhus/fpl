import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

export interface ManagerGameweekData {
  name: string;
  teamName: string;
  gameweeks: FPLManagerGameweek[];
}

export interface GameweekStanding {
  managerName: string;
  teamName: string;
  rank: number;
  prevRank: number | null;
  rankChange: number;
  gameweekPoints: number;
  totalPoints: number;
  isGameweekWinner: boolean;
}

export interface GameweekLeagueData {
  gameweekNumber: number;
  standings: GameweekStanding[];
  averagePoints: number;
  highestPoints: number;
  lowestPoints: number;
}

/**
 * Get a sorted list of all gameweeks that have been played
 */
export function getAvailableGameweeks(
  managers: ManagerGameweekData[]
): number[] {
  if (managers.length === 0) {
    return [];
  }

  // Collect all unique gameweek numbers
  const gameweekSet = new Set<number>();

  managers.forEach((manager) => {
    manager.gameweeks.forEach((gw) => {
      gameweekSet.add(gw.event);
    });
  });

  // Convert to sorted array
  return Array.from(gameweekSet).sort((a, b) => a - b);
}

/**
 * Calculate historical league standings for a specific gameweek
 */
export function calculateHistoricalStandings(
  managers: ManagerGameweekData[],
  gameweekNumber: number
): GameweekLeagueData {
  if (managers.length === 0) {
    throw new Error("No managers provided");
  }

  // Extract each manager's data for this gameweek
  const managerData = managers.map((manager) => {
    const currentGw = manager.gameweeks.find(
      (gw) => gw.event === gameweekNumber
    );
    const prevGw = manager.gameweeks.find(
      (gw) => gw.event === gameweekNumber - 1
    );

    if (!currentGw) {
      throw new Error(`Gameweek ${gameweekNumber} not found`);
    }

    return {
      managerName: manager.name,
      teamName: manager.teamName,
      rank: currentGw.rank,
      prevRank: prevGw?.rank ?? null,
      gameweekPoints: currentGw.points,
      totalPoints: currentGw.total_points,
    };
  });

  // Sort by rank
  managerData.sort((a, b) => a.rank - b.rank);

  // Find highest points for gameweek winner
  const highestPoints = Math.max(...managerData.map((m) => m.gameweekPoints));
  const lowestPoints = Math.min(...managerData.map((m) => m.gameweekPoints));

  // Calculate average points
  const totalPoints = managerData.reduce(
    (sum, m) => sum + m.gameweekPoints,
    0
  );
  const averagePoints = totalPoints / managerData.length;

  // Build standings with gameweek winner flag and rank changes
  const standings: GameweekStanding[] = managerData.map((m) => ({
    managerName: m.managerName,
    teamName: m.teamName,
    rank: m.rank,
    prevRank: m.prevRank,
    rankChange: m.prevRank !== null ? m.prevRank - m.rank : 0,
    gameweekPoints: m.gameweekPoints,
    totalPoints: m.totalPoints,
    isGameweekWinner: m.gameweekPoints === highestPoints,
  }));

  return {
    gameweekNumber,
    standings,
    averagePoints,
    highestPoints,
    lowestPoints,
  };
}
