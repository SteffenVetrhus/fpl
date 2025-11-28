/**
 * FPL API Client
 * Provides functions to fetch data from the Fantasy Premier League API
 */

import type {
  FPLBootstrapStatic,
  FPLLeagueStandings,
  FPLManagerHistory,
  FPLManagerTransfers,
  FPLEntry,
} from "./types";

const API_BASE_URL = "https://fantasy.premierleague.com/api";

/**
 * Fetch bootstrap-static data
 * Contains all teams, players, gameweeks, and general game information
 *
 * @returns Promise resolving to bootstrap data
 * @throws Error if fetch fails
 */
export async function fetchBootstrapStatic(): Promise<FPLBootstrapStatic> {
  const url = `${API_BASE_URL}/bootstrap-static/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch bootstrap-static: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error fetching bootstrap-static");
  }
}

/**
 * Fetch league standings
 * Returns league information and current standings
 *
 * @param leagueId - The FPL league ID
 * @param page - Optional page number for pagination (default: 1)
 * @returns Promise resolving to league standings
 * @throws Error if fetch fails or league not found
 */
export async function fetchLeagueStandings(
  leagueId: string,
  page?: number
): Promise<FPLLeagueStandings> {
  const params = new URLSearchParams();
  if (page && page > 1) {
    params.append("page_standings", page.toString());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/leagues-classic/${leagueId}/standings/${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch league standings: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error fetching league standings");
  }
}

/**
 * Fetch manager entry information
 * Returns manager profile and summary statistics
 *
 * @param managerId - The FPL manager/entry ID
 * @returns Promise resolving to manager entry data
 * @throws Error if fetch fails or manager not found
 */
export async function fetchManagerEntry(
  managerId: string
): Promise<FPLEntry> {
  const url = `${API_BASE_URL}/entry/${managerId}/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch manager entry: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error fetching manager entry");
  }
}

/**
 * Fetch manager gameweek history
 * Returns gameweek-by-gameweek results, chip usage, and past seasons
 *
 * @param managerId - The FPL manager/entry ID
 * @returns Promise resolving to manager history data
 * @throws Error if fetch fails or manager not found
 */
export async function fetchManagerHistory(
  managerId: string
): Promise<FPLManagerHistory> {
  const url = `${API_BASE_URL}/entry/${managerId}/history/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch manager history: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error fetching manager history");
  }
}

/**
 * Fetch manager transfers
 * Returns all transfers made by manager this season
 *
 * @param managerId - The FPL manager/entry ID
 * @returns Promise resolving to array of transfers
 * @throws Error if fetch fails or manager not found
 */
export async function fetchManagerTransfers(
  managerId: string
): Promise<FPLManagerTransfers> {
  const url = `${API_BASE_URL}/entry/${managerId}/transfers/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch manager transfers: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error fetching manager transfers");
  }
}
