export interface Manager {
  id: number;
  name: string;
  points: number;
}

/**
 * Calculates the gameweek winner from a list of managers
 * @param managers - Array of managers with their points
 * @returns The manager with the highest points (first in case of tie)
 */
export function calculateGameweekWinner(managers: Manager[]): Manager {
  return managers.reduce((winner, current) =>
    current.points > winner.points ? current : winner
  );
}
