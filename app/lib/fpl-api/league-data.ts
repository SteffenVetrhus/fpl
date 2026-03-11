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

/** Max concurrent API requests to avoid timeouts for large leagues */
const BATCH_SIZE = 10;

/**
 * Process an array in batches, resolving each batch before starting the next.
 */
async function processInBatches<TItem, TResult>(
  items: TItem[],
  batchSize: number,
  fn: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results: TResult[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Fetch league standings and all manager histories in batches.
 * Processes up to BATCH_SIZE managers concurrently to avoid
 * timeouts for leagues with 50+ members.
 */
export async function fetchLeagueManagerHistories(
  leagueId: string
): Promise<ManagerWithHistory[]> {
  const leagueData = await fetchLeagueStandings(leagueId);

  return processInBatches(
    leagueData.standings.results,
    BATCH_SIZE,
    async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        gameweeks: history.current,
      };
    },
  );
}

/**
 * Fetch league standings and all manager transfer summaries in batches.
 * Used by the transfers route loader.
 */
export async function fetchLeagueTransferSummaries(
  leagueId: string
): Promise<ManagerTransferSummary[]> {
  const leagueData = await fetchLeagueStandings(leagueId);

  const transferData = await processInBatches(
    leagueData.standings.results,
    BATCH_SIZE,
    async (manager) => {
      const transfers = await fetchManagerTransfers(manager.entry.toString());
      return {
        managerName: manager.player_name,
        teamName: manager.entry_name,
        transfers,
      };
    },
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
