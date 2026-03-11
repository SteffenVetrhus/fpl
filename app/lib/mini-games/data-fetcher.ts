/**
 * Mini Games Data Fetcher
 * Aggregates FPL data needed by game calculators
 */

import {
  fetchLeagueStandings,
  fetchManagerHistory,
  fetchManagerTransfers,
  fetchGameweekPicks,
  fetchLiveGameweek,
  fetchBootstrapStatic,
} from "~/lib/fpl-api/client";
import type {
  FPLManagerGameweek,
  FPLLiveElement,
  FPLPick,
  FPLTransfer,
  FPLElement,
  FPLStandingsResult,
  FPLEvent,
} from "~/lib/fpl-api/types";
import type { ManagerScore, H2HPairingInput } from "./types";
import {
  calcCaptainClash,
  calcBenchBail,
  calcHitOrHero,
  calcCleanSheetShowdown,
  calcGameweekDuel,
  calcDifferentialKing,
  calcRankRocket,
  calcTransferMastermind,
  calcValueSurge,
  calcCrystalBall,
} from "./engine";

export interface MiniGameFPLData {
  managers: H2HPairingInput[];
  standings: FPLStandingsResult[];
  currentEvent: FPLEvent | undefined;
  nextEvent: FPLEvent | undefined;
}

/**
 * Fetch basic league data needed for round management.
 */
export async function fetchLeagueData(leagueId: string): Promise<MiniGameFPLData> {
  const [leagueData, bootstrap] = await Promise.all([
    fetchLeagueStandings(leagueId),
    fetchBootstrapStatic(),
  ]);

  const managers: H2HPairingInput[] = leagueData.standings.results.map((m) => ({
    id: m.entry,
    name: m.player_name,
  }));

  const currentEvent = bootstrap.events.find((e) => e.is_current);
  const nextEvent = bootstrap.events.find((e) => e.is_next);

  return {
    managers,
    standings: leagueData.standings.results,
    currentEvent,
    nextEvent,
  };
}

/**
 * Calculate scores for a specific game using FPL data.
 * Fetches all required data and runs the appropriate calculator.
 */
export async function calculateGameScores(
  gameIndex: number,
  gameweek: number,
  standings: FPLStandingsResult[]
): Promise<ManagerScore[]> {
  const managerIds = standings.map((m) => m.entry.toString());

  switch (gameIndex) {
    case 0: // Captain Clash
      return await calcCaptainClashFromAPI(managerIds, standings, gameweek);
    case 1: // Bench Bail
      return await calcBenchBailFromAPI(managerIds, standings, gameweek);
    case 2: // Hit or Hero
      return await calcHitOrHeroFromAPI(managerIds, standings, gameweek);
    case 3: // Clean Sheet Showdown
      return await calcCleanSheetShowdownFromAPI(managerIds, standings, gameweek);
    case 4: // Gameweek Duel
      return await calcGameweekDuelFromAPI(managerIds, standings, gameweek);
    case 5: // Differential King
      return await calcDifferentialKingFromAPI(managerIds, standings, gameweek);
    case 6: // Rank Rocket
      return await calcRankRocketFromAPI(managerIds, standings, gameweek);
    case 7: // Transfer Mastermind
      return await calcTransferMastermindFromAPI(managerIds, standings, gameweek);
    case 8: // Value Surge
      return await calcValueSurgeFromAPI(managerIds, standings, gameweek);
    case 9: // Crystal Ball
      return await calcCrystalBallFromAPI(managerIds, standings, gameweek);
    default:
      return [];
  }
}

// ============================================================================
// Individual game data fetchers + calculators
// ============================================================================

async function fetchPicksAndLive(managerIds: string[], standings: FPLStandingsResult[], gameweek: number) {
  const nameMap = new Map(standings.map((s) => [s.entry.toString(), s.player_name]));

  const [picksResults, liveData] = await Promise.all([
    Promise.all(managerIds.map(async (id) => {
      try {
        const picks = await fetchGameweekPicks(id, gameweek);
        return { id: parseInt(id), picks };
      } catch {
        return null;
      }
    })),
    fetchLiveGameweek(gameweek),
  ]);

  const managerPicks = new Map<number, { picks: FPLPick[]; managerName: string }>();
  for (const result of picksResults) {
    if (result) {
      managerPicks.set(result.id, {
        picks: result.picks.picks,
        managerName: nameMap.get(result.id.toString()) ?? "Unknown",
      });
    }
  }

  const liveElements = new Map<number, FPLLiveElement>(
    liveData.elements.map((e) => [e.id, e])
  );

  return { managerPicks, liveElements };
}

async function fetchHistories(managerIds: string[], standings: FPLStandingsResult[], gameweek: number) {
  const nameMap = new Map(standings.map((s) => [s.entry.toString(), s.player_name]));

  const histories = await Promise.all(
    managerIds.map(async (id) => {
      try {
        const history = await fetchManagerHistory(id);
        return { id: parseInt(id), history };
      } catch {
        return null;
      }
    })
  );

  const managerHistories = new Map<number, { gw: FPLManagerGameweek; managerName: string }>();
  const managerFullHistories = new Map<number, { current: FPLManagerGameweek; previous: FPLManagerGameweek | null; managerName: string }>();

  for (const result of histories) {
    if (result) {
      const currentGw = result.history.current.find((g) => g.event === gameweek);
      const previousGw = result.history.current.find((g) => g.event === gameweek - 1) ?? null;

      if (currentGw) {
        const name = nameMap.get(result.id.toString()) ?? "Unknown";
        managerHistories.set(result.id, { gw: currentGw, managerName: name });
        managerFullHistories.set(result.id, { current: currentGw, previous: previousGw, managerName: name });
      }
    }
  }

  return { managerHistories, managerFullHistories };
}

async function calcCaptainClashFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const { managerPicks, liveElements } = await fetchPicksAndLive(ids, standings, gw);
  return calcCaptainClash(managerPicks, liveElements);
}

async function calcBenchBailFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const { managerHistories } = await fetchHistories(ids, standings, gw);
  return calcBenchBail(managerHistories);
}

async function calcHitOrHeroFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const nameMap = new Map(standings.map((s) => [s.entry.toString(), s.player_name]));

  const [transferResults, liveData] = await Promise.all([
    Promise.all(ids.map(async (id) => {
      try {
        const transfers = await fetchManagerTransfers(id);
        return { id: parseInt(id), transfers };
      } catch {
        return null;
      }
    })),
    fetchLiveGameweek(gw),
  ]);

  const managerTransfers = new Map<number, { transfers: FPLTransfer[]; managerName: string }>();
  for (const result of transferResults) {
    if (result) {
      managerTransfers.set(result.id, {
        transfers: result.transfers,
        managerName: nameMap.get(result.id.toString()) ?? "Unknown",
      });
    }
  }

  const liveElements = new Map<number, FPLLiveElement>(
    liveData.elements.map((e) => [e.id, e])
  );

  return calcHitOrHero(managerTransfers, liveElements, gw);
}

async function calcCleanSheetShowdownFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const [{ managerPicks, liveElements }, bootstrap] = await Promise.all([
    fetchPicksAndLive(ids, standings, gw),
    fetchBootstrapStatic(),
  ]);

  const elementTypes = new Map(bootstrap.elements.map((e) => [e.id, e.element_type]));

  return calcCleanSheetShowdown(managerPicks, liveElements, elementTypes);
}

async function calcGameweekDuelFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const { managerHistories } = await fetchHistories(ids, standings, gw);
  return calcGameweekDuel(managerHistories);
}

async function calcDifferentialKingFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const [{ managerPicks, liveElements }, bootstrap] = await Promise.all([
    fetchPicksAndLive(ids, standings, gw),
    fetchBootstrapStatic(),
  ]);

  return calcDifferentialKing(managerPicks, liveElements, bootstrap.elements);
}

async function calcRankRocketFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const { managerFullHistories } = await fetchHistories(ids, standings, gw);
  return calcRankRocket(managerFullHistories);
}

async function calcTransferMastermindFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  return calcHitOrHeroFromAPI(ids, standings, gw);
}

async function calcValueSurgeFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const { managerFullHistories } = await fetchHistories(ids, standings, gw);
  return calcValueSurge(managerFullHistories);
}

async function calcCrystalBallFromAPI(ids: string[], standings: FPLStandingsResult[], gw: number) {
  const [{ managerHistories }, bootstrap] = await Promise.all([
    fetchHistories(ids, standings, gw),
    fetchBootstrapStatic(),
  ]);

  const event = bootstrap.events.find((e) => e.id === gw);
  const averageScore = event?.average_entry_score ?? 0;

  return calcCrystalBall(managerHistories, averageScore);
}
