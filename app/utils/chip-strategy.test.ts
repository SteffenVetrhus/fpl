import { describe, it, expect } from "vitest";
import {
  detectSpecialGameweeks,
  getChipStatuses,
  recommendChipWindows,
  buildRivalChipUsage,
} from "./chip-strategy";
import type { FPLFixture, FPLTeam, FPLEvent, FPLChip, FPLElement } from "~/lib/fpl-api/types";

function makeTeam(id: number, shortName: string): FPLTeam {
  return {
    id,
    name: shortName,
    short_name: shortName,
    code: id,
    strength: 3,
    strength_overall_home: 1200,
    strength_overall_away: 1200,
    strength_attack_home: 1200,
    strength_attack_away: 1200,
    strength_defence_home: 1200,
    strength_defence_away: 1200,
    pulse_id: id,
  };
}

function makeFixture(
  id: number,
  gw: number,
  homeTeam: number,
  awayTeam: number
): FPLFixture {
  return {
    id,
    code: id,
    event: gw,
    finished: false,
    finished_provisional: false,
    kickoff_time: "2025-01-01T15:00:00Z",
    minutes: 0,
    provisional_start_time: false,
    started: false,
    team_a: awayTeam,
    team_h: homeTeam,
    team_a_score: null,
    team_h_score: null,
    team_h_difficulty: 3,
    team_a_difficulty: 3,
    pulse_id: id,
  };
}

function makeEvent(id: number): FPLEvent {
  return {
    id,
    name: `Gameweek ${id}`,
    deadline_time: "2025-01-01T11:00:00Z",
    finished: id < 10,
    data_checked: true,
    highest_scoring_entry: null,
    deadline_time_epoch: 0,
    deadline_time_game_offset: 0,
    highest_score: null,
    is_previous: id === 9,
    is_current: id === 10,
    is_next: id === 11,
    cup_leagues_created: false,
    h2h_ko_matches_created: false,
    chip_plays: [],
    most_selected: null,
    most_transferred_in: null,
    top_element: null,
    top_element_info: null,
    transfers_made: 0,
    most_captained: null,
    most_vice_captained: null,
    average_entry_score: 50,
  };
}

describe("detectSpecialGameweeks", () => {
  const teams = [
    makeTeam(1, "ARS"),
    makeTeam(2, "CHE"),
    makeTeam(3, "TOT"),
    makeTeam(4, "LIV"),
  ];

  it("detects double gameweeks", () => {
    const fixtures = [
      makeFixture(1, 15, 1, 2),
      makeFixture(2, 15, 1, 3), // Arsenal plays twice in GW15
      makeFixture(3, 15, 4, 2), // Chelsea also twice
    ];

    const { doubleGWs } = detectSpecialGameweeks(fixtures, teams, 15, 15);
    expect(doubleGWs.has(15)).toBe(true);
    expect(doubleGWs.get(15)).toContain("ARS");
  });

  it("detects blank gameweeks", () => {
    const fixtures = [
      makeFixture(1, 15, 1, 2), // Only ARS vs CHE
    ];

    const { blankGWs } = detectSpecialGameweeks(fixtures, teams, 15, 15);
    expect(blankGWs.has(15)).toBe(true);
    expect(blankGWs.get(15)).toContain("TOT");
    expect(blankGWs.get(15)).toContain("LIV");
  });
});

describe("getChipStatuses", () => {
  it("shows all chips as available when none used", () => {
    const statuses = getChipStatuses([]);
    expect(statuses).toHaveLength(4);
    expect(statuses.every((s) => !s.used)).toBe(true);
  });

  it("marks used chips correctly", () => {
    const chips: FPLChip[] = [
      { name: "wildcard", time: "2025-01-01", event: 5 },
      { name: "3xc", time: "2025-02-01", event: 10 },
    ];

    const statuses = getChipStatuses(chips);
    const wc = statuses.find((s) => s.chip === "wildcard")!;
    const tc = statuses.find((s) => s.chip === "3xc")!;
    const bb = statuses.find((s) => s.chip === "bboost")!;

    expect(wc.used).toBe(true);
    expect(wc.usedInGW).toBe(5);
    expect(tc.used).toBe(true);
    expect(tc.usedInGW).toBe(10);
    expect(bb.used).toBe(false);
    expect(bb.usedInGW).toBeNull();
  });
});

describe("buildRivalChipUsage", () => {
  it("summarizes rival chip usage", () => {
    const rivals = [
      {
        name: "John",
        chips: [{ name: "wildcard" as const, time: "2025-01-01", event: 3 }],
      },
      {
        name: "Jane",
        chips: [] as FPLChip[],
      },
    ];

    const usage = buildRivalChipUsage(rivals);
    expect(usage).toHaveLength(2);

    const john = usage.find((r) => r.managerName === "John")!;
    expect(john.chipsUsed).toHaveLength(1);
    expect(john.chipsRemaining).toHaveLength(3);

    const jane = usage.find((r) => r.managerName === "Jane")!;
    expect(jane.chipsUsed).toHaveLength(0);
    expect(jane.chipsRemaining).toHaveLength(4);
  });
});

describe("recommendChipWindows", () => {
  const teams = [
    makeTeam(1, "ARS"),
    makeTeam(2, "CHE"),
    makeTeam(3, "TOT"),
    makeTeam(4, "LIV"),
    makeTeam(5, "MCI"),
    makeTeam(6, "MUN"),
    makeTeam(7, "NEW"),
  ];
  const events = Array.from({ length: 20 }, (_, i) => makeEvent(i + 1));

  it("recommends TC for double gameweeks", () => {
    // Create a DGW at GW15 (multiple teams with 2 fixtures)
    const fixtures = [
      makeFixture(1, 15, 1, 2),
      makeFixture(2, 15, 1, 3), // ARS plays twice
      makeFixture(3, 15, 4, 5),
      makeFixture(4, 15, 6, 7),
    ];

    const recs = recommendChipWindows(fixtures, teams, events, [], 10, []);
    const tcRec = recs.find((r) => r.chip === "3xc");
    expect(tcRec).toBeDefined();
    expect(tcRec!.gameweek).toBe(15);
    expect(tcRec!.isDoubleGameweek).toBe(true);
  });

  it("does not recommend already-used chips", () => {
    const fixtures = [
      makeFixture(1, 15, 1, 2),
      makeFixture(2, 15, 1, 3),
    ];
    const chipsUsed: FPLChip[] = [
      { name: "3xc", time: "2025-01-01", event: 5 },
    ];

    const recs = recommendChipWindows(fixtures, teams, events, chipsUsed, 10, []);
    const tcRec = recs.find((r) => r.chip === "3xc");
    expect(tcRec).toBeUndefined();
  });
});
