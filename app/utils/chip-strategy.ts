/**
 * Chip strategy advisor
 * Recommends optimal timing for wildcard, triple captain, bench boost, and free hit
 */

import type {
  FPLFixture,
  FPLTeam,
  FPLEvent,
  FPLChip,
  FPLElement,
} from "~/lib/fpl-api/types";

export type ChipType = "wildcard" | "3xc" | "bboost" | "freehit";

export interface ChipWindow {
  gameweek: number;
  chip: ChipType;
  chipLabel: string;
  score: number;
  reasons: string[];
  isDoubleGameweek: boolean;
  isBlankGameweek: boolean;
  teamsWithDGW: string[];
  teamsWithBGW: string[];
}

export interface ChipStatus {
  chip: ChipType;
  chipLabel: string;
  used: boolean;
  usedInGW: number | null;
}

export interface ChipAdvice {
  chipStatuses: ChipStatus[];
  recommendations: ChipWindow[];
  rivalsChipUsage: RivalChipUsage[];
}

export interface RivalChipUsage {
  managerName: string;
  chipsUsed: { chip: string; gameweek: number }[];
  chipsRemaining: string[];
}

const CHIP_LABELS: Record<ChipType, string> = {
  wildcard: "Wildcard",
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
};

const ALL_CHIPS: ChipType[] = ["wildcard", "3xc", "bboost", "freehit"];

/**
 * Detect double and blank gameweeks
 */
export function detectSpecialGameweeks(
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  fromGW: number,
  toGW: number
): { doubleGWs: Map<number, string[]>; blankGWs: Map<number, string[]> } {
  const doubleGWs = new Map<number, string[]>();
  const blankGWs = new Map<number, string[]>();
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  for (let gw = fromGW; gw <= toGW; gw++) {
    const dgwTeams: string[] = [];
    const bgwTeams: string[] = [];

    for (const team of teams) {
      const teamFixtures = fixtures.filter(
        (f) => f.event === gw && (f.team_h === team.id || f.team_a === team.id)
      );

      if (teamFixtures.length > 1) {
        dgwTeams.push(team.short_name);
      } else if (teamFixtures.length === 0) {
        bgwTeams.push(team.short_name);
      }
    }

    if (dgwTeams.length > 0) doubleGWs.set(gw, dgwTeams);
    if (bgwTeams.length > 0) blankGWs.set(gw, bgwTeams);
  }

  return { doubleGWs, blankGWs };
}

/**
 * Get chip usage status for a manager
 */
export function getChipStatuses(chipsUsed: FPLChip[]): ChipStatus[] {
  return ALL_CHIPS.map((chip) => {
    const used = chipsUsed.find((c) => c.name === chip);
    return {
      chip,
      chipLabel: CHIP_LABELS[chip],
      used: !!used,
      usedInGW: used?.event ?? null,
    };
  });
}

/**
 * Recommend optimal chip windows
 *
 * @param fixtures - All fixtures
 * @param teams - All teams
 * @param events - All gameweeks
 * @param chipsUsed - Chips already used by this manager
 * @param currentGW - Current gameweek number
 * @param topPlayers - Top players by form (for TC recommendations)
 * @returns Chip advice with recommendations
 */
export function recommendChipWindows(
  fixtures: FPLFixture[],
  teams: FPLTeam[],
  events: FPLEvent[],
  chipsUsed: FPLChip[],
  currentGW: number,
  topPlayers: FPLElement[]
): ChipWindow[] {
  const totalGWs = events.length;
  const { doubleGWs, blankGWs } = detectSpecialGameweeks(
    fixtures, teams, currentGW + 1, totalGWs
  );

  const chipStatuses = getChipStatuses(chipsUsed);
  const availableChips = chipStatuses.filter((c) => !c.used).map((c) => c.chip);

  const recommendations: ChipWindow[] = [];

  for (let gw = currentGW + 1; gw <= totalGWs; gw++) {
    const isDGW = doubleGWs.has(gw);
    const isBGW = blankGWs.has(gw);
    const dgwTeams = doubleGWs.get(gw) ?? [];
    const bgwTeams = blankGWs.get(gw) ?? [];

    // Triple Captain — best in DGW with premium player having two games
    if (availableChips.includes("3xc") && isDGW) {
      const score = dgwTeams.length * 2;
      recommendations.push({
        gameweek: gw,
        chip: "3xc",
        chipLabel: CHIP_LABELS["3xc"],
        score,
        reasons: [
          `${dgwTeams.length} teams with double fixtures`,
          `DGW teams: ${dgwTeams.join(", ")}`,
        ],
        isDoubleGameweek: true,
        isBlankGameweek: false,
        teamsWithDGW: dgwTeams,
        teamsWithBGW: [],
      });
    }

    // Bench Boost — best in DGW when many teams double
    if (availableChips.includes("bboost") && isDGW && dgwTeams.length >= 6) {
      const score = dgwTeams.length * 1.5;
      recommendations.push({
        gameweek: gw,
        chip: "bboost",
        chipLabel: CHIP_LABELS.bboost,
        score,
        reasons: [
          `${dgwTeams.length} teams with double fixtures — maximize bench value`,
          `DGW teams: ${dgwTeams.join(", ")}`,
        ],
        isDoubleGameweek: true,
        isBlankGameweek: false,
        teamsWithDGW: dgwTeams,
        teamsWithBGW: [],
      });
    }

    // Free Hit — best in BGW when many teams blank
    if (availableChips.includes("freehit") && isBGW && bgwTeams.length >= 6) {
      const score = bgwTeams.length * 1.5;
      recommendations.push({
        gameweek: gw,
        chip: "freehit",
        chipLabel: CHIP_LABELS.freehit,
        score,
        reasons: [
          `${bgwTeams.length} teams blanking — need a full squad`,
          `Blank teams: ${bgwTeams.join(", ")}`,
        ],
        isDoubleGameweek: false,
        isBlankGameweek: true,
        teamsWithDGW: [],
        teamsWithBGW: bgwTeams,
      });
    }

    // Wildcard — recommend before big fixture swings or DGW prep
    if (availableChips.includes("wildcard") && isDGW && gw > currentGW + 1) {
      // Recommend WC the week before a big DGW to prepare squad
      const prepGW = gw - 1;
      if (prepGW > currentGW) {
        recommendations.push({
          gameweek: prepGW,
          chip: "wildcard",
          chipLabel: CHIP_LABELS.wildcard,
          score: dgwTeams.length * 1.2,
          reasons: [
            `Prepare squad for GW${gw} double gameweek`,
            `Target DGW players from: ${dgwTeams.join(", ")}`,
          ],
          isDoubleGameweek: false,
          isBlankGameweek: false,
          teamsWithDGW: dgwTeams,
          teamsWithBGW: [],
        });
      }
    }
  }

  // If no DGW/BGW detected, recommend TC on best fixture for premium player
  if (
    availableChips.includes("3xc") &&
    !recommendations.some((r) => r.chip === "3xc")
  ) {
    // Find the gameweek with easiest fixture for top player
    if (topPlayers.length > 0) {
      const topPlayer = topPlayers[0];
      for (let gw = currentGW + 1; gw <= Math.min(currentGW + 6, totalGWs); gw++) {
        const gwFix = fixtures.filter(
          (f) => f.event === gw && (f.team_h === topPlayer.team || f.team_a === topPlayer.team)
        );
        if (gwFix.length > 0) {
          const fix = gwFix[0];
          const isHome = fix.team_h === topPlayer.team;
          const diff = isHome ? fix.team_h_difficulty : fix.team_a_difficulty;
          if (diff <= 2) {
            recommendations.push({
              gameweek: gw,
              chip: "3xc",
              chipLabel: CHIP_LABELS["3xc"],
              score: (5 - diff) * 2,
              reasons: [
                `Easy home fixture for ${topPlayer.web_name}`,
                "No DGWs detected — use on best single fixture",
              ],
              isDoubleGameweek: false,
              isBlankGameweek: false,
              teamsWithDGW: [],
              teamsWithBGW: [],
            });
            break;
          }
        }
      }
    }
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Build rival chip usage summary
 */
export function buildRivalChipUsage(
  rivals: { name: string; chips: FPLChip[] }[]
): RivalChipUsage[] {
  return rivals.map((rival) => {
    const usedChipNames = new Set(rival.chips.map((c) => c.name));
    return {
      managerName: rival.name,
      chipsUsed: rival.chips.map((c) => ({
        chip: CHIP_LABELS[c.name as ChipType] ?? c.name,
        gameweek: c.event,
      })),
      chipsRemaining: ALL_CHIPS
        .filter((c) => !usedChipNames.has(c))
        .map((c) => CHIP_LABELS[c]),
    };
  });
}
