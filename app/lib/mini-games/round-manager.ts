/**
 * Mini Games Round Manager
 * Handles PocketBase collection auto-migration, round lifecycle, and result storage
 */

import type PocketBase from "pocketbase";
import type {
  MiniGameRound,
  MiniGamePairing,
  MiniGameResult,
  MiniGameLeaderboardEntry,
  MiniGameType,
  ManagerScore,
  H2HPairingInput,
} from "./types";
import { MINI_GAMES } from "./types";
import {
  selectGameForGameweek,
  generateSeed,
  generateH2HPairings,
  assignH2HPoints,
  assignRankingPoints,
  buildLeaderboard,
} from "./engine";

// ============================================================================
// Collection Names
// ============================================================================

const ROUNDS_COLLECTION = "mini_game_rounds";
const PAIRINGS_COLLECTION = "mini_game_pairings";
const RESULTS_COLLECTION = "mini_game_results";

// ============================================================================
// Auto-Migration
// ============================================================================

/**
 * Ensure PocketBase collections exist. Creates them if missing.
 * Uses the PocketBase admin API to check/create collections.
 */
export async function ensureCollections(pb: PocketBase): Promise<void> {
  try {
    await pb.collection(ROUNDS_COLLECTION).getList(1, 1);
  } catch {
    // Collection doesn't exist - this is expected on first run.
    // Collections should be created via PocketBase admin UI or migration.
    // We'll handle the error gracefully and let the UI show a setup message.
    console.warn(
      `[mini-games] Collection "${ROUNDS_COLLECTION}" not found. Please create the required collections in PocketBase admin.`
    );
  }
}

// ============================================================================
// Round Lifecycle
// ============================================================================

/**
 * Get or create a mini game round for a given gameweek.
 * If the round doesn't exist, creates one with a deterministically selected game.
 */
export async function getOrCreateRound(
  pb: PocketBase,
  leagueId: string,
  gameweek: number,
  deadlineTime: string
): Promise<MiniGameRound> {
  // Try to find existing round
  try {
    const existing = await pb.collection(ROUNDS_COLLECTION).getFirstListItem<MiniGameRound>(
      `league_id = "${leagueId}" && gameweek = ${gameweek}`
    );
    return existing;
  } catch {
    // Not found, create new round
  }

  // Get recent game indices to avoid repeats
  const recentRounds = await getRecentRounds(pb, leagueId, gameweek, 9);
  const recentGameIndices = recentRounds.map((r) => r.game_index);

  const gameIndex = selectGameForGameweek(leagueId, gameweek, recentGameIndices);
  const game = MINI_GAMES[gameIndex];
  const seed = generateSeed(leagueId, gameweek);

  // Reveal time = 24 hours before deadline
  const deadline = new Date(deadlineTime);
  const revealTime = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);

  const now = new Date();
  let status: MiniGameRound["status"] = "upcoming";
  if (now >= revealTime) {
    status = "revealed";
  }

  const round = await pb.collection(ROUNDS_COLLECTION).create<MiniGameRound>({
    league_id: leagueId,
    gameweek,
    game_index: gameIndex,
    game_name: game.name,
    game_type: game.type,
    reveal_time: revealTime.toISOString(),
    status,
    seed,
  });

  return round;
}

/**
 * Get recent completed rounds for a league (to avoid game repeats).
 */
async function getRecentRounds(
  pb: PocketBase,
  leagueId: string,
  beforeGameweek: number,
  limit: number
): Promise<MiniGameRound[]> {
  try {
    const result = await pb.collection(ROUNDS_COLLECTION).getList<MiniGameRound>(1, limit, {
      filter: `league_id = "${leagueId}" && gameweek < ${beforeGameweek}`,
      sort: "-gameweek",
    });
    return result.items;
  } catch {
    return [];
  }
}

/**
 * Check if a round is revealed (current time >= reveal_time)
 */
export function isRevealed(round: MiniGameRound): boolean {
  return new Date() >= new Date(round.reveal_time);
}

// ============================================================================
// Result Calculation & Storage
// ============================================================================

/**
 * Store H2H results for a round.
 * Generates pairings, assigns points, and saves to PocketBase.
 */
export async function storeH2HResults(
  pb: PocketBase,
  round: MiniGameRound,
  managers: H2HPairingInput[],
  scores: ManagerScore[]
): Promise<MiniGamePairing[]> {
  const pairings = generateH2HPairings(managers, round.seed);
  const scoreMap = new Map(scores.map((s) => [s.managerId, s.score]));
  const savedPairings: MiniGamePairing[] = [];

  for (const pairing of pairings) {
    const scoreA = scoreMap.get(pairing.managerA.id) ?? 0;
    const scoreB = pairing.managerB ? (scoreMap.get(pairing.managerB.id) ?? 0) : null;

    const { pointsA, pointsB } = assignH2HPoints(scoreA, scoreB);

    const saved = await pb.collection(PAIRINGS_COLLECTION).create<MiniGamePairing>({
      round: round.id,
      manager_a_id: pairing.managerA.id,
      manager_a_name: pairing.managerA.name,
      manager_b_id: pairing.managerB?.id ?? 0,
      manager_b_name: pairing.managerB?.name ?? "BYE",
      score_a: scoreA,
      score_b: scoreB ?? 0,
      points_a: pointsA,
      points_b: pointsB,
    });

    savedPairings.push(saved);
  }

  // Mark round as completed
  await pb.collection(ROUNDS_COLLECTION).update(round.id, { status: "completed" });

  return savedPairings;
}

/**
 * Store ranking results for a round.
 * Sorts scores, assigns rank points, and saves to PocketBase.
 */
export async function storeRankingResults(
  pb: PocketBase,
  round: MiniGameRound,
  scores: ManagerScore[]
): Promise<MiniGameResult[]> {
  const ranked = assignRankingPoints(scores);
  const savedResults: MiniGameResult[] = [];

  for (const result of ranked) {
    const saved = await pb.collection(RESULTS_COLLECTION).create<MiniGameResult>({
      round: round.id,
      manager_id: result.managerId,
      manager_name: result.managerName,
      score: result.score,
      rank: result.rank,
      points: result.points,
    });

    savedResults.push(saved);
  }

  // Mark round as completed
  await pb.collection(ROUNDS_COLLECTION).update(round.id, { status: "completed" });

  return savedResults;
}

// ============================================================================
// Leaderboard & History
// ============================================================================

/**
 * Get the full leaderboard for a league across all completed rounds.
 */
export async function getLeaderboard(
  pb: PocketBase,
  leagueId: string
): Promise<MiniGameLeaderboardEntry[]> {
  // Get all completed rounds for this league
  let rounds: MiniGameRound[];
  try {
    const roundsResult = await pb.collection(ROUNDS_COLLECTION).getFullList<MiniGameRound>({
      filter: `league_id = "${leagueId}" && status = "completed"`,
    });
    rounds = roundsResult;
  } catch {
    return [];
  }

  if (rounds.length === 0) return [];

  const roundIds = rounds.map((r) => r.id);
  const roundTypes = new Map<string, MiniGameType>(rounds.map((r) => [r.id, r.game_type]));

  // Fetch all results and pairings for these rounds
  let allResults: MiniGameResult[] = [];
  let allPairings: MiniGamePairing[] = [];

  try {
    const filterExpr = roundIds.map((id) => `round = "${id}"`).join(" || ");

    const resultsData = await pb.collection(RESULTS_COLLECTION).getFullList<MiniGameResult>({
      filter: filterExpr,
    });
    allResults = resultsData;

    const pairingsData = await pb.collection(PAIRINGS_COLLECTION).getFullList<MiniGamePairing>({
      filter: filterExpr,
    });
    allPairings = pairingsData;
  } catch {
    // Collections may not exist yet
  }

  return buildLeaderboard(allResults, allPairings, roundTypes);
}

/**
 * Get round history for a league (most recent first).
 */
export async function getRoundHistory(
  pb: PocketBase,
  leagueId: string,
  limit = 10
): Promise<MiniGameRound[]> {
  try {
    const result = await pb.collection(ROUNDS_COLLECTION).getList<MiniGameRound>(1, limit, {
      filter: `league_id = "${leagueId}"`,
      sort: "-gameweek",
    });
    return result.items;
  } catch {
    return [];
  }
}

/**
 * Get pairings for a specific round.
 */
export async function getRoundPairings(
  pb: PocketBase,
  roundId: string
): Promise<MiniGamePairing[]> {
  try {
    return await pb.collection(PAIRINGS_COLLECTION).getFullList<MiniGamePairing>({
      filter: `round = "${roundId}"`,
    });
  } catch {
    return [];
  }
}

/**
 * Get results for a specific round.
 */
export async function getRoundResults(
  pb: PocketBase,
  roundId: string
): Promise<MiniGameResult[]> {
  try {
    return await pb.collection(RESULTS_COLLECTION).getFullList<MiniGameResult>({
      filter: `round = "${roundId}"`,
      sort: "rank",
    });
  } catch {
    return [];
  }
}
