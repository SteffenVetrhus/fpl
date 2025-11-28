import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

export interface ManagerGameweekData {
  name: string;
  gameweeks: FPLManagerGameweek[];
}

/**
 * Calculate the winner(s) for a specific gameweek based on highest points scored
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

  // Get each manager's points for the specified gameweek
  const managerPoints = managers
    .map((manager) => {
      const gameweek = manager.gameweeks.find(
        (gw) => gw.event === gameweekNumber
      );
      return {
        name: manager.name,
        points: gameweek?.points ?? -1, // -1 if no data for this gameweek
      };
    })
    .filter((mp) => mp.points >= 0); // Remove managers without data for this GW

  if (managerPoints.length === 0) {
    return [];
  }

  // Find the maximum points scored
  const maxPoints = Math.max(...managerPoints.map((mp) => mp.points));

  // Return all managers who achieved the maximum points (handles ties)
  return managerPoints
    .filter((mp) => mp.points === maxPoints)
    .map((mp) => mp.name);
}
