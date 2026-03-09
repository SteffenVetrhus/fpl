/**
 * Mini Games Engine
 * Core game logic: deterministic selection, pairing generation, 10 calculators, and scoring
 */

import type {
  MiniGameType,
  ManagerScore,
  H2HPairingInput,
  H2HPairingResult,
  MiniGameLeaderboardEntry,
  MiniGameResult,
  MiniGamePairing,
} from "./types";
import { MINI_GAMES } from "./types";
import type {
  FPLManagerGameweek,
  FPLLiveElement,
  FPLPick,
  FPLTransfer,
  FPLElement,
} from "~/lib/fpl-api/types";

// ============================================================================
// Seeded PRNG (Mulberry32)
// ============================================================================

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Returns a function that produces deterministic floats in [0, 1).
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a deterministic seed from league ID and gameweek
 */
export function generateSeed(leagueId: string, gameweek: number): number {
  let hash = 0;
  const str = `${leagueId}-${gameweek}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// ============================================================================
// Game Selection
// ============================================================================

/**
 * Select which game to play for a given gameweek.
 * Deterministic based on league + GW. Avoids repeating within a 10-GW window.
 *
 * @param leagueId - FPL league ID
 * @param gameweek - Current gameweek number
 * @param recentGameIndices - Indices of games played in the last 9 GWs
 * @returns Game index (0-9)
 */
export function selectGameForGameweek(
  leagueId: string,
  gameweek: number,
  recentGameIndices: number[] = []
): number {
  const seed = generateSeed(leagueId, gameweek);
  const rng = createSeededRandom(seed);

  let gameIndex = Math.floor(rng() * MINI_GAMES.length);

  // Try to avoid recent games (up to 10 attempts)
  const recentSet = new Set(recentGameIndices);
  let attempts = 0;
  while (recentSet.has(gameIndex) && attempts < 10) {
    gameIndex = (gameIndex + 1) % MINI_GAMES.length;
    attempts++;
  }

  return gameIndex;
}

// ============================================================================
// H2H Pairing Generation
// ============================================================================

/**
 * Generate deterministic H2H pairings using seeded shuffle.
 * Odd player gets a bye (paired with null).
 */
export function generateH2HPairings(
  managers: H2HPairingInput[],
  seed: number
): H2HPairingResult[] {
  if (managers.length === 0) return [];

  const rng = createSeededRandom(seed);
  const shuffled = [...managers];

  // Fisher-Yates shuffle with seeded RNG
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const pairings: H2HPairingResult[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    pairings.push({
      managerA: shuffled[i],
      managerB: i + 1 < shuffled.length ? shuffled[i + 1] : null,
    });
  }

  return pairings;
}

// ============================================================================
// Game Calculators
// ============================================================================

/** Game 0: Captain Clash - Captain points comparison */
export function calcCaptainClash(
  managerPicks: Map<number, { picks: FPLPick[]; managerName: string }>,
  liveElements: Map<number, FPLLiveElement>
): ManagerScore[] {
  const scores: ManagerScore[] = [];

  for (const [managerId, data] of managerPicks) {
    const captainPick = data.picks.find((p) => p.is_captain);
    let captainPoints = 0;

    if (captainPick) {
      const livePlayer = liveElements.get(captainPick.element);
      if (livePlayer) {
        captainPoints = livePlayer.stats.total_points * captainPick.multiplier;
      }
    }

    scores.push({ managerId, managerName: data.managerName, score: captainPoints });
  }

  return scores;
}

/** Game 1: Bench Bail - Bench points comparison */
export function calcBenchBail(
  managerHistories: Map<number, { gw: FPLManagerGameweek; managerName: string }>
): ManagerScore[] {
  const scores: ManagerScore[] = [];

  for (const [managerId, data] of managerHistories) {
    scores.push({
      managerId,
      managerName: data.managerName,
      score: data.gw.points_on_bench,
    });
  }

  return scores;
}

/** Game 2: Hit or Hero - Points from transferred-in players */
export function calcHitOrHero(
  managerTransfers: Map<number, { transfers: FPLTransfer[]; managerName: string }>,
  liveElements: Map<number, FPLLiveElement>,
  gameweek: number
): ManagerScore[] {
  const scores: ManagerScore[] = [];

  for (const [managerId, data] of managerTransfers) {
    const gwTransfers = data.transfers.filter((t) => t.event === gameweek);
    let transferInPoints = 0;

    for (const transfer of gwTransfers) {
      const livePlayer = liveElements.get(transfer.element_in);
      if (livePlayer) {
        transferInPoints += livePlayer.stats.total_points;
      }
    }

    scores.push({ managerId, managerName: data.managerName, score: transferInPoints });
  }

  return scores;
}

/** Game 3: Clean Sheet Showdown - Clean sheet points from GK + DEF */
export function calcCleanSheetShowdown(
  managerPicks: Map<number, { picks: FPLPick[]; managerName: string }>,
  liveElements: Map<number, FPLLiveElement>,
  elementTypes: Map<number, number> // elementId -> element_type (1=GK, 2=DEF)
): ManagerScore[] {
  const scores: ManagerScore[] = [];

  for (const [managerId, data] of managerPicks) {
    let csPoints = 0;

    // Only count starting XI (position 1-11)
    const starters = data.picks.filter((p) => p.position <= 11);
    for (const pick of starters) {
      const elementType = elementTypes.get(pick.element);
      if (elementType === 1 || elementType === 2) {
        const livePlayer = liveElements.get(pick.element);
        if (livePlayer && livePlayer.stats.clean_sheets > 0) {
          // GK gets 4 pts per CS, DEF gets 4 pts per CS
          csPoints += livePlayer.stats.clean_sheets * 4;
        }
      }
    }

    scores.push({ managerId, managerName: data.managerName, score: csPoints });
  }

  return scores;
}

/** Game 4: Gameweek Duel - Net GW points (after hits) */
export function calcGameweekDuel(
  managerHistories: Map<number, { gw: FPLManagerGameweek; managerName: string }>
): ManagerScore[] {
  const scores: ManagerScore[] = [];

  for (const [managerId, data] of managerHistories) {
    const netPoints = data.gw.points - data.gw.event_transfers_cost;
    scores.push({ managerId, managerName: data.managerName, score: netPoints });
  }

  return scores;
}

/** Game 5: Differential King - Points from players owned by <10% */
export function calcDifferentialKing(
  managerPicks: Map<number, { picks: FPLPick[]; managerName: string }>,
  liveElements: Map<number, FPLLiveElement>,
  elements: FPLElement[]
): ManagerScore[] {
  const scores: ManagerScore[] = [];
  const ownershipMap = new Map(
    elements.map((e) => [e.id, parseFloat(e.selected_by_percent)])
  );

  for (const [managerId, data] of managerPicks) {
    let diffPoints = 0;

    // Only count starting XI
    const starters = data.picks.filter((p) => p.position <= 11);
    for (const pick of starters) {
      const ownership = ownershipMap.get(pick.element) ?? 100;
      if (ownership < 10) {
        const livePlayer = liveElements.get(pick.element);
        if (livePlayer) {
          diffPoints += livePlayer.stats.total_points * pick.multiplier;
        }
      }
    }

    scores.push({ managerId, managerName: data.managerName, score: diffPoints });
  }

  return scores;
}

/** Game 6: Rank Rocket - Biggest overall rank improvement */
export function calcRankRocket(
  managerHistories: Map<number, { current: FPLManagerGameweek; previous: FPLManagerGameweek | null; managerName: string }>
): ManagerScore[] {
  const scores: ManagerScore[] = [];

  for (const [managerId, data] of managerHistories) {
    let rankImprovement = 0;
    if (data.previous) {
      // Positive = improved (rank went down numerically)
      rankImprovement = data.previous.overall_rank - data.current.overall_rank;
    }

    scores.push({ managerId, managerName: data.managerName, score: rankImprovement });
  }

  return scores;
}

/** Game 7: Transfer Mastermind - Best points from transferred-in players */
export function calcTransferMastermind(
  managerTransfers: Map<number, { transfers: FPLTransfer[]; managerName: string }>,
  liveElements: Map<number, FPLLiveElement>,
  gameweek: number
): ManagerScore[] {
  // Same logic as Hit or Hero for simplicity — both measure transfer-in points
  return calcHitOrHero(managerTransfers, liveElements, gameweek);
}

/** Game 8: Value Surge - Biggest team value increase */
export function calcValueSurge(
  managerHistories: Map<number, { current: FPLManagerGameweek; previous: FPLManagerGameweek | null; managerName: string }>
): ManagerScore[] {
  const scores: ManagerScore[] = [];

  for (const [managerId, data] of managerHistories) {
    let valueChange = 0;
    if (data.previous) {
      valueChange = data.current.value - data.previous.value;
    }

    scores.push({ managerId, managerName: data.managerName, score: valueChange });
  }

  return scores;
}

/** Game 9: Crystal Ball - Closest score to global average */
export function calcCrystalBall(
  managerHistories: Map<number, { gw: FPLManagerGameweek; managerName: string }>,
  averageScore: number
): ManagerScore[] {
  const scores: ManagerScore[] = [];

  for (const [managerId, data] of managerHistories) {
    // Lower distance = better, so we negate for scoring (will be sorted descending)
    const distance = Math.abs(data.gw.points - averageScore);
    scores.push({ managerId, managerName: data.managerName, score: -distance });
  }

  return scores;
}

// ============================================================================
// Point Assignment
// ============================================================================

/**
 * Assign H2H points for a single pairing.
 * W=3, D=1, L=0. Bye manager gets 1 pt.
 */
export function assignH2HPoints(
  scoreA: number,
  scoreB: number | null // null = bye
): { pointsA: number; pointsB: number } {
  if (scoreB === null) {
    return { pointsA: 1, pointsB: 0 }; // bye
  }

  if (scoreA > scoreB) return { pointsA: 3, pointsB: 0 };
  if (scoreA < scoreB) return { pointsA: 0, pointsB: 3 };
  return { pointsA: 1, pointsB: 1 }; // draw
}

/**
 * Assign ranking points. 1st=3, 2nd=2, 3rd=1, rest=0.
 * Ties: all tied managers get the same points for that position.
 */
export function assignRankingPoints(
  scores: ManagerScore[]
): { managerId: number; managerName: string; score: number; rank: number; points: number }[] {
  // Sort descending by score
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  const pointsMap = [3, 2, 1];
  const results: { managerId: number; managerName: string; score: number; rank: number; points: number }[] = [];

  let currentRank = 1;
  let i = 0;
  while (i < sorted.length) {
    // Find all tied at this score
    const tiedGroup: typeof sorted = [sorted[i]];
    while (i + 1 < sorted.length && sorted[i + 1].score === sorted[i].score) {
      i++;
      tiedGroup.push(sorted[i]);
    }

    // All tied managers get points for their rank position
    const pts = currentRank <= 3 ? pointsMap[currentRank - 1] : 0;

    for (const manager of tiedGroup) {
      results.push({
        managerId: manager.managerId,
        managerName: manager.managerName,
        score: manager.score,
        rank: currentRank,
        points: pts,
      });
    }

    currentRank += tiedGroup.length;
    i++;
  }

  return results;
}

// ============================================================================
// Leaderboard
// ============================================================================

/**
 * Build leaderboard from all results and pairings across all rounds.
 */
export function buildLeaderboard(
  allResults: MiniGameResult[],
  allPairings: MiniGamePairing[],
  roundTypes: Map<string, MiniGameType>
): MiniGameLeaderboardEntry[] {
  const entries = new Map<number, MiniGameLeaderboardEntry>();

  const getOrCreate = (managerId: number, managerName: string): MiniGameLeaderboardEntry => {
    let entry = entries.get(managerId);
    if (!entry) {
      entry = {
        managerId,
        managerName,
        totalPoints: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gamesPlayed: 0,
      };
      entries.set(managerId, entry);
    }
    return entry;
  };

  // Process ranking game results
  for (const result of allResults) {
    const gameType = roundTypes.get(result.round);
    if (gameType !== "ranking") continue;

    const entry = getOrCreate(result.manager_id, result.manager_name);
    entry.totalPoints += result.points;
    entry.gamesPlayed += 1;
    if (result.rank === 1) entry.wins += 1;
  }

  // Process H2H pairings
  const processedRounds = new Set<string>();
  for (const pairing of allPairings) {
    // Manager A
    const entryA = getOrCreate(pairing.manager_a_id, pairing.manager_a_name);
    if (!processedRounds.has(`${pairing.round}-${pairing.manager_a_id}`)) {
      entryA.totalPoints += pairing.points_a;
      entryA.gamesPlayed += 1;
      if (pairing.points_a === 3) entryA.wins += 1;
      else if (pairing.points_a === 1) entryA.draws += 1;
      else entryA.losses += 1;
      processedRounds.add(`${pairing.round}-${pairing.manager_a_id}`);
    }

    // Manager B (skip bye)
    if (pairing.manager_b_id !== 0) {
      const entryB = getOrCreate(pairing.manager_b_id, pairing.manager_b_name);
      if (!processedRounds.has(`${pairing.round}-${pairing.manager_b_id}`)) {
        entryB.totalPoints += pairing.points_b;
        entryB.gamesPlayed += 1;
        if (pairing.points_b === 3) entryB.wins += 1;
        else if (pairing.points_b === 1) entryB.draws += 1;
        else entryB.losses += 1;
        processedRounds.add(`${pairing.round}-${pairing.manager_b_id}`);
      }
    }
  }

  // Sort by total points desc, then wins desc
  return Array.from(entries.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins
  );
}
