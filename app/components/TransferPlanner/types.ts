/**
 * Shared types and constants for the Transfer Planner feature
 */

import type { PlannerSquad } from "~/utils/transfer-planner";
import type { TransferPlanData } from "~/utils/transfer-planner";

export interface PlayerInfo {
  id: number;
  webName: string;
  teamId: number;
  teamShort: string;
  elementType: number;
  cost: number;
  form: string;
  totalPoints: number;
  status: string;
  selectedByPercent: string;
  epNext: string | null;
}

export interface TeamFixtureCell {
  gameweek: number;
  opponentShort: string;
  difficulty: number;
  isHome: boolean;
  isBlank: boolean;
}

export interface LoaderData {
  initialSquad: PlannerSquad | null;
  allPlayers: PlayerInfo[];
  teams: { id: number; name: string; shortName: string }[];
  fixturesByTeam: Record<number, TeamFixtureCell[]>;
  upcomingGWs: number[];
  currentGW: number;
  events: { id: number; name: string; deadlineTime: string }[];
  managerName: string | null;
  teamName: string | null;
  savedPlan: TransferPlanData | null;
  error: string | null;
}

export const INDIGO = "#4F46E5";
export const INDIGO_LIGHT = "#6366F1";

export const CHIPS = [
  { value: "wildcard", label: "Wildcard" },
  { value: "freehit", label: "Free Hit" },
  { value: "triplecaptain", label: "Triple Captain" },
  { value: "bboost", label: "Bench Boost" },
];

export const POSITION_LABELS: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};
