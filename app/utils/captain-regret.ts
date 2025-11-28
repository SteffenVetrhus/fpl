/**
 * Captain Regret Calculator
 * Calculates "captain regret" - the points difference between the captain chosen
 * and the best possible captain choice from the starting XI.
 */

import type { FPLGameweekPicks, FPLElement } from "~/lib/fpl-api/types";

export interface CaptainRegretData {
  captainId: number;
  captainName: string;
  captainPoints: number;
  captainTotalPoints: number; // Points including multiplier
  bestPlayerId: number;
  bestPlayerName: string;
  bestPlayerPoints: number;
  bestPlayerPotentialPoints: number; // What they would have scored as captain
  regretPoints: number; // Difference between best possible and actual
}

export interface SeasonCaptainRegret {
  totalRegret: number;
  gameweeks: CaptainRegretData[];
}

export interface GameweekCaptainData {
  picks: FPLGameweekPicks;
  players: FPLElement[];
}

/**
 * Calculate captain regret for a single gameweek
 *
 * @param picks - The gameweek picks data
 * @param players - All player data with event_points
 * @returns Captain regret information
 * @throws Error if captain not found or data is invalid
 */
export function calculateCaptainRegret(
  picks: FPLGameweekPicks,
  players: FPLElement[]
): CaptainRegretData {
  // Find the captain from picks
  const captainPick = picks.picks.find((pick) => pick.is_captain);
  if (!captainPick) {
    throw new Error("Captain not found in picks");
  }

  // Get captain player data
  const captainPlayer = players.find((p) => p.id === captainPick.element);
  if (!captainPlayer) {
    throw new Error("Captain player data not found");
  }

  // Get captain multiplier (2 for normal captain, 3 for triple captain)
  const captainMultiplier = captainPick.multiplier;

  // Calculate captain's actual points
  const captainPoints = captainPlayer.event_points;
  const captainTotalPoints = captainPoints * captainMultiplier;

  // Find best player in starting XI (positions 1-11, multiplier > 0)
  const startingXI = picks.picks.filter(
    (pick) => pick.position <= 11 && pick.multiplier > 0
  );

  let bestPlayer: FPLElement | null = null;
  let bestPlayerPoints = 0;

  for (const pick of startingXI) {
    const player = players.find((p) => p.id === pick.element);
    if (player && player.event_points > bestPlayerPoints) {
      bestPlayer = player;
      bestPlayerPoints = player.event_points;
    }
  }

  if (!bestPlayer) {
    throw new Error("No starting XI players found");
  }

  // Calculate what the best player would have scored as captain
  const bestPlayerPotentialPoints = bestPlayerPoints * captainMultiplier;

  // Calculate regret
  const regretPoints = bestPlayerPotentialPoints - captainTotalPoints;

  return {
    captainId: captainPlayer.id,
    captainName: captainPlayer.web_name,
    captainPoints,
    captainTotalPoints,
    bestPlayerId: bestPlayer.id,
    bestPlayerName: bestPlayer.web_name,
    bestPlayerPoints,
    bestPlayerPotentialPoints,
    regretPoints,
  };
}

/**
 * Calculate total captain regret across multiple gameweeks
 *
 * @param gameweeksData - Array of gameweek picks and player data
 * @returns Season-long captain regret summary
 */
export function calculateSeasonCaptainRegret(
  gameweeksData: GameweekCaptainData[]
): SeasonCaptainRegret {
  const gameweeks: CaptainRegretData[] = [];
  let totalRegret = 0;

  for (const gwData of gameweeksData) {
    try {
      const regretData = calculateCaptainRegret(gwData.picks, gwData.players);
      gameweeks.push(regretData);
      totalRegret += regretData.regretPoints;
    } catch (error) {
      // Skip gameweeks with errors (e.g., no captain data available)
      console.warn("Error calculating captain regret:", error);
    }
  }

  return {
    totalRegret,
    gameweeks,
  };
}
