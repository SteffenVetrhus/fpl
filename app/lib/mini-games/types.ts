/**
 * Mini Games types and game definitions
 */

import type { LucideIcon } from "lucide-react";
import {
  Crown,
  Armchair,
  TrendingUp,
  Shield,
  Swords,
  Gem,
  Rocket,
  Brain,
  DollarSign,
  Target,
} from "lucide-react";

// ============================================================================
// Game Type Definitions
// ============================================================================

export type MiniGameType = "h2h" | "ranking";

export interface MiniGameDefinition {
  index: number;
  name: string;
  shortName: string;
  description: string;
  type: MiniGameType;
  icon: LucideIcon;
  rules: string;
}

/**
 * All 10 mini games available in the system.
 * Games 0-4 are head-to-head, games 5-9 are ranking-based.
 */
export const MINI_GAMES: MiniGameDefinition[] = [
  {
    index: 0,
    name: "Captain Clash",
    shortName: "captain-clash",
    description: "Whose captain scored more points?",
    type: "h2h",
    icon: Crown,
    rules: "Head-to-head! You're paired with a rival. The manager whose captain scored more points wins. W=3pts, D=1pt, L=0pts.",
  },
  {
    index: 1,
    name: "Bench Bail",
    shortName: "bench-bail",
    description: "Whose bench outperformed?",
    type: "h2h",
    icon: Armchair,
    rules: "Head-to-head! Paired with a rival. The manager with more bench points wins. Those benchies might finally be useful! W=3pts, D=1pt, L=0pts.",
  },
  {
    index: 2,
    name: "Hit or Hero",
    shortName: "hit-or-hero",
    description: "Did your transfer hits pay off?",
    type: "h2h",
    icon: TrendingUp,
    rules: "Head-to-head! Compare total points from transferred-in players this GW. Were your transfers genius or madness? W=3pts, D=1pt, L=0pts.",
  },
  {
    index: 3,
    name: "Clean Sheet Showdown",
    shortName: "clean-sheet-showdown",
    description: "Who earned more defensive points?",
    type: "h2h",
    icon: Shield,
    rules: "Head-to-head! Compare clean sheet points from your GK and DEFs. Defense wins championships! W=3pts, D=1pt, L=0pts.",
  },
  {
    index: 4,
    name: "Gameweek Duel",
    shortName: "gameweek-duel",
    description: "Who scored more net GW points?",
    type: "h2h",
    icon: Swords,
    rules: "Head-to-head! Simple duel — highest net GW score (after hits) wins. No hiding! W=3pts, D=1pt, L=0pts.",
  },
  {
    index: 5,
    name: "Differential King",
    shortName: "differential-king",
    description: "Most points from low-ownership players",
    type: "ranking",
    icon: Gem,
    rules: "Ranking game! Most points from players owned by <10% globally. The hipster manager wins! 1st=3pts, 2nd=2pts, 3rd=1pt.",
  },
  {
    index: 6,
    name: "Rank Rocket",
    shortName: "rank-rocket",
    description: "Biggest overall rank improvement",
    type: "ranking",
    icon: Rocket,
    rules: "Ranking game! Biggest overall rank climb this GW. To the moon! 1st=3pts, 2nd=2pts, 3rd=1pt.",
  },
  {
    index: 7,
    name: "Transfer Mastermind",
    shortName: "transfer-mastermind",
    description: "Best points from new signings",
    type: "ranking",
    icon: Brain,
    rules: "Ranking game! Most points scored by players you transferred in this GW. Galaxy brain transfers only! 1st=3pts, 2nd=2pts, 3rd=1pt.",
  },
  {
    index: 8,
    name: "Value Surge",
    shortName: "value-surge",
    description: "Biggest team value increase",
    type: "ranking",
    icon: DollarSign,
    rules: "Ranking game! Biggest team value increase this GW. Money moves! 1st=3pts, 2nd=2pts, 3rd=1pt.",
  },
  {
    index: 9,
    name: "Crystal Ball",
    shortName: "crystal-ball",
    description: "Closest score to the global average",
    type: "ranking",
    icon: Target,
    rules: "Ranking game! Score closest to the global GW average wins. Not too hot, not too cold — just right! 1st=3pts, 2nd=2pts, 3rd=1pt.",
  },
];

// ============================================================================
// PocketBase Record Types
// ============================================================================

export type MiniGameRoundStatus = "upcoming" | "revealed" | "active" | "completed";

export interface MiniGameRound {
  id: string;
  league_id: string;
  gameweek: number;
  game_index: number;
  game_name: string;
  game_type: MiniGameType;
  reveal_time: string;
  status: MiniGameRoundStatus;
  seed: number;
}

export interface MiniGamePairing {
  id: string;
  round: string;
  manager_a_id: number;
  manager_a_name: string;
  manager_b_id: number;
  manager_b_name: string;
  score_a: number;
  score_b: number;
  points_a: number;
  points_b: number;
}

export interface MiniGameResult {
  id: string;
  round: string;
  manager_id: number;
  manager_name: string;
  score: number;
  rank: number;
  points: number;
}

// ============================================================================
// Application Types
// ============================================================================

export interface MiniGameLeaderboardEntry {
  managerId: number;
  managerName: string;
  totalPoints: number;
  wins: number;
  draws: number;
  losses: number;
  gamesPlayed: number;
}

export interface ManagerScore {
  managerId: number;
  managerName: string;
  score: number;
}

export interface H2HPairingInput {
  id: number;
  name: string;
}

export interface H2HPairingResult {
  managerA: H2HPairingInput;
  managerB: H2HPairingInput | null; // null = bye
}

export interface RoundHistoryEntry {
  gameweek: number;
  gameName: string;
  gameType: MiniGameType;
  status: MiniGameRoundStatus;
  winners: string[];
  pairings?: MiniGamePairing[];
  results?: MiniGameResult[];
}
