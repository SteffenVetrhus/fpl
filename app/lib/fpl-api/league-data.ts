/**
 * Shared data fetching utilities for league route loaders.
 * Eliminates duplicate fetch logic across gameweeks, standings, and transfers routes.
 */

import { fetchLeagueStandings, fetchManagerHistory, fetchManagerTransfers } from "./client";
import type { FPLManagerGameweek, FPLTransfer } from "./types";

export interface ManagerWithHistory {
  name: string;
  teamName: string;
  gameweeks: FPLManagerGameweek[];
}

export interface ManagerTransferSummary {
  managerName: string;
  teamName: string;
  transferCount: number;
  lastTransferGW: number;
}

/**
 * Fetch league standings and all manager histories in parallel.
 * Used by gameweeks and standings route loaders.
 */
export async function fetchLeagueManagerHistories(
  leagueId: string
): Promise<ManagerWithHistory[]> {
  const leagueData = await fetchLeagueStandings(leagueId);

  return Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        gameweeks: history.current,
      };
    })
  );
}

/**
 * Fetch league standings and all manager transfer summaries in parallel.
 * Used by the transfers route loader.
 */
export async function fetchLeagueTransferSummaries(
  leagueId: string
): Promise<ManagerTransferSummary[]> {
  const leagueData = await fetchLeagueStandings(leagueId);

  const transferData = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const transfers = await fetchManagerTransfers(manager.entry.toString());
      return {
        managerName: manager.player_name,
        teamName: manager.entry_name,
        transfers,
      };
    })
  );

  return transferData.map(({ managerName, teamName, transfers }) => ({
    managerName,
    teamName,
    transferCount: transfers.length,
    lastTransferGW: transfers.length > 0
      ? Math.max(...transfers.map((t) => t.event))
      : 0,
  }));
}
