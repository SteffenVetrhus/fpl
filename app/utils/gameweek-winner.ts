import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

export interface ManagerGameweekData {
  name: string;
  gameweeks: FPLManagerGameweek[];
}

/**
 * Calculate net points for a gameweek (points minus transfer penalty)
 * @param gameweek The gameweek data
 * @returns Net points after subtracting transfer hits
 */
export function getNetPoints(gameweek: FPLManagerGameweek): number {
  return gameweek.points - gameweek.event_transfers_cost;
}

/**
 * Calculate the winner(s) for a specific gameweek based on highest net points
 * (points minus transfer penalty). If players draw on net points, both are winners.
 * @param managers Array of managers with their gameweek data
 * @param gameweekNumber The gameweek number to check
 * @returns Array of manager names who won (can be multiple if tied)
 */
export function calculateGameweekWinner(
  managers: ManagerGameweekData[],
  gameweekNumber: number
): string[] {
  if (managers.length === 0) {
    return [];
  }

  // Get each manager's net points for the specified gameweek
  const managerPoints = managers
    .map((manager) => {
      const gameweek = manager.gameweeks.find(
        (gw) => gw.event === gameweekNumber
      );
      return {
        name: manager.name,
        netPoints: gameweek ? getNetPoints(gameweek) : -Infinity,
        hasData: gameweek !== undefined,
      };
    })
    .filter((mp) => mp.hasData);

  if (managerPoints.length === 0) {
    return [];
  }

  // Find the maximum net points scored
  const maxNetPoints = Math.max(...managerPoints.map((mp) => mp.netPoints));

  // Return all managers who achieved the maximum net points (handles ties)
  return managerPoints
    .filter((mp) => mp.netPoints === maxNetPoints)
    .map((mp) => mp.name);
}
