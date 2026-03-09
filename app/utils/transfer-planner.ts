/**
 * Transfer planner logic utilities
 * Handles squad validation, budget tracking, and plan application
 */

import type { FPLElement, FPLPick, FPLChip, FPLManagerGameweek } from "~/lib/fpl-api/types";

export interface PlannedTransfer {
  elementIn: number;
  elementOut: number;
}

export interface GameweekPlan {
  transfers: PlannedTransfer[];
  captain: number | null;
  viceCaptain: number | null;
  chip: string | null;
  benchOrder: number[];
}

export interface TransferPlanData {
  gameweeks: Record<string, GameweekPlan>;
}

export interface SquadPlayer {
  element: number;
  position: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  webName: string;
  teamId: number;
  elementType: number;
  cost: number;
  form: string;
  totalPoints: number;
  status: string;
}

export interface PlannerSquad {
  players: SquadPlayer[];
  bank: number;
  freeTransfers: number;
  totalValue: number;
}

/**
 * Calculate free transfers from manager history
 * Walks through every gameweek to reconstruct the running balance.
 * FPL rules: start at 1, gain 1 per GW (unused roll over), capped at 5.
 * Wildcard or free hit resets to 1.
 */
export function calculateFreeTransfers(
  gameweeks: FPLManagerGameweek[],
  chips: FPLChip[]
): number {
  const chipEvents = new Set(
    chips
      .filter((c) => c.name === "wildcard" || c.name === "freehit")
      .map((c) => c.event)
  );

  let freeTransfers = 1;

  for (const gw of gameweeks) {
    if (chipEvents.has(gw.event)) {
      freeTransfers = 1;
      continue;
    }

    const transfersMade = gw.event_transfers;
    const hitCost = gw.event_transfers_cost;
    const paidTransfers = hitCost / 4;
    const freeUsed = transfersMade - paidTransfers;

    freeTransfers = Math.min(5, freeTransfers - freeUsed + 1);
    freeTransfers = Math.max(1, freeTransfers);
  }

  return freeTransfers;
}

/**
 * Build the initial squad from FPL API picks data
 */
export function buildSquadFromPicks(
  picks: FPLPick[],
  elements: FPLElement[],
  bank: number,
  freeTransfers?: number
): PlannerSquad {
  const elementMap = new Map(elements.map((e) => [e.id, e]));

  const players: SquadPlayer[] = picks.map((pick) => {
    const el = elementMap.get(pick.element);
    return {
      element: pick.element,
      position: pick.position,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      webName: el?.web_name ?? "Unknown",
      teamId: el?.team ?? 0,
      elementType: el?.element_type ?? 0,
      cost: el ? el.now_cost / 10 : 0,
      form: el?.form ?? "0.0",
      totalPoints: el?.total_points ?? 0,
      status: el?.status ?? "a",
    };
  });

  const totalValue = players.reduce((sum, p) => sum + p.cost, 0) + bank / 10;

  return { players, bank: bank / 10, freeTransfers: freeTransfers ?? 1, totalValue };
}

/**
 * Apply a gameweek plan to a squad, returning the resulting squad state
 */
export function applyPlanToSquad(
  squad: PlannerSquad,
  plan: GameweekPlan,
  elements: FPLElement[]
): PlannerSquad {
  const elementMap = new Map(elements.map((e) => [e.id, e]));
  let newPlayers = [...squad.players];
  let newBank = squad.bank;

  for (const transfer of plan.transfers) {
    const outIdx = newPlayers.findIndex(
      (p) => p.element === transfer.elementOut
    );
    if (outIdx === -1) continue;

    const outPlayer = newPlayers[outIdx];
    const inElement = elementMap.get(transfer.elementIn);
    if (!inElement) continue;

    const inCost = inElement.now_cost / 10;
    newBank = newBank + outPlayer.cost - inCost;

    newPlayers[outIdx] = {
      element: inElement.id,
      position: outPlayer.position,
      isCaptain: plan.captain === inElement.id,
      isViceCaptain: plan.viceCaptain === inElement.id,
      webName: inElement.web_name,
      teamId: inElement.team,
      elementType: inElement.element_type,
      cost: inCost,
      form: inElement.form,
      totalPoints: inElement.total_points,
      status: inElement.status,
    };
  }

  // Update captain/vc
  if (plan.captain) {
    newPlayers = newPlayers.map((p) => ({
      ...p,
      isCaptain: p.element === plan.captain,
    }));
  }
  if (plan.viceCaptain) {
    newPlayers = newPlayers.map((p) => ({
      ...p,
      isViceCaptain: p.element === plan.viceCaptain,
    }));
  }

  const freeTransfersUsed = plan.transfers.length;
  const hits = Math.max(0, freeTransfersUsed - squad.freeTransfers);
  const nextFreeTransfers =
    plan.chip === "wildcard" || plan.chip === "freehit"
      ? 1
      : Math.min(5, squad.freeTransfers - freeTransfersUsed + 1);

  return {
    players: newPlayers,
    bank: Math.round(newBank * 10) / 10,
    freeTransfers: Math.max(1, nextFreeTransfers),
    totalValue:
      newPlayers.reduce((sum, p) => sum + p.cost, 0) +
      Math.round(newBank * 10) / 10,
  };
}

/**
 * Calculate the cost of transfers (hits) for a gameweek plan
 */
export function calculateHitCost(
  transferCount: number,
  freeTransfers: number,
  chip: string | null
): number {
  if (chip === "wildcard" || chip === "freehit") return 0;
  return Math.max(0, transferCount - freeTransfers) * 4;
}

/**
 * Validate a squad meets FPL constraints
 * Returns an array of validation error messages
 */
export function validateSquad(players: SquadPlayer[]): string[] {
  const errors: string[] = [];

  if (players.length !== 15) {
    errors.push(`Squad must have 15 players, has ${players.length}`);
  }

  // Position counts
  const positions = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const p of players) {
    if (p.elementType in positions) {
      positions[p.elementType as keyof typeof positions]++;
    }
  }

  if (positions[1] !== 2) errors.push(`Need 2 GKs, have ${positions[1]}`);
  if (positions[2] !== 5) errors.push(`Need 5 DEFs, have ${positions[2]}`);
  if (positions[3] !== 5) errors.push(`Need 5 MIDs, have ${positions[3]}`);
  if (positions[4] !== 3) errors.push(`Need 3 FWDs, have ${positions[4]}`);

  // Team limit (max 3 per team)
  const teamCounts = new Map<number, number>();
  for (const p of players) {
    teamCounts.set(p.teamId, (teamCounts.get(p.teamId) ?? 0) + 1);
  }
  for (const [teamId, count] of teamCounts) {
    if (count > 3) {
      errors.push(`Max 3 players per team, team ${teamId} has ${count}`);
    }
  }

  return errors;
}

/**
 * Get the position label for an element type
 */
export function getPositionLabel(elementType: number): string {
  switch (elementType) {
    case 1:
      return "GK";
    case 2:
      return "DEF";
    case 3:
      return "MID";
    case 4:
      return "FWD";
    default:
      return "???";
  }
}

/**
 * Get position sort order for display
 */
export function getPositionOrder(elementType: number): number {
  switch (elementType) {
    case 1:
      return 0;
    case 2:
      return 1;
    case 3:
      return 2;
    case 4:
      return 3;
    default:
      return 99;
  }
}

/**
 * Group squad players by position for display
 */
export function groupByPosition(
  players: SquadPlayer[]
): Record<string, SquadPlayer[]> {
  const starting = players.filter((p) => p.position <= 11);
  const bench = players.filter((p) => p.position > 11);

  return {
    GK: starting.filter((p) => p.elementType === 1),
    DEF: starting.filter((p) => p.elementType === 2),
    MID: starting.filter((p) => p.elementType === 3),
    FWD: starting.filter((p) => p.elementType === 4),
    BENCH: bench,
  };
}
