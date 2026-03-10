import { describe, it, expect } from "vitest";
import {
  buildSquadPlayers,
  buildManagerForm,
  buildRivalSnapshots,
  buildTransferMarketInsights,
  buildSquadBalance,
  getSeasonPhase,
  summarizeChipWindows,
} from "./advisor-data";
import type {
  FPLElement,
  FPLFixture,
  FPLTeam,
  FPLPick,
  FPLManagerGameweek,
  FPLStandingsResult,
  FPLChip,
  FPLEvent,
} from "~/lib/fpl-api/types";

// ── Test fixtures ────────────────────────────────────────────────────

function makeTeam(overrides: Partial<FPLTeam> = {}): FPLTeam {
  return {
    id: 1,
    name: "Arsenal",
    short_name: "ARS",
    code: 3,
    strength: 5,
    strength_overall_home: 1300,
    strength_overall_away: 1280,
    strength_attack_home: 1320,
    strength_attack_away: 1300,
    strength_defence_home: 1310,
    strength_defence_away: 1290,
    pulse_id: 1,
    ...overrides,
  };
}

function makeElement(overrides: Partial<FPLElement> = {}): FPLElement {
  return {
    id: 100,
    code: 100,
    element_type: 3,
    first_name: "Martin",
    second_name: "Odegaard",
    web_name: "Ødegaard",
    team: 1,
    team_code: 3,
    status: "a",
    now_cost: 85,
    cost_change_start: 0,
    cost_change_event: 0,
    total_points: 120,
    event_points: 8,
    points_per_game: "6.0",
    ep_this: "6.0",
    ep_next: "5.5",
    form: "7.2",
    selected_by_percent: "25.0",
    transfers_in: 50000,
    transfers_out: 30000,
    transfers_in_event: 5000,
    transfers_out_event: 2000,
    chance_of_playing_this_round: 100,
    chance_of_playing_next_round: 100,
    value_form: "0.8",
    value_season: "14.1",
    minutes: 1800,
    goals_scored: 8,
    assists: 6,
    clean_sheets: 5,
    goals_conceded: 10,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 2,
    red_cards: 0,
    saves: 0,
    bonus: 15,
    bps: 400,
    influence: "500.0",
    creativity: "600.0",
    threat: "400.0",
    ict_index: "150.0",
    starts: 20,
    expected_goals: "6.0",
    expected_assists: "4.5",
    expected_goal_involvements: "10.5",
    expected_goals_conceded: "15.0",
    ...overrides,
  };
}

function makePick(overrides: Partial<FPLPick> = {}): FPLPick {
  return {
    element: 100,
    position: 1,
    multiplier: 1,
    is_captain: false,
    is_vice_captain: false,
    ...overrides,
  };
}

function makeFixture(overrides: Partial<FPLFixture> = {}): FPLFixture {
  return {
    id: 1,
    code: 1,
    event: 20,
    finished: false,
    finished_provisional: false,
    kickoff_time: "2025-01-15T15:00:00Z",
    minutes: 0,
    provisional_start_time: false,
    started: false,
    team_a: 2,
    team_a_score: null,
    team_h: 1,
    team_h_score: null,
    team_h_difficulty: 2,
    team_a_difficulty: 4,
    pulse_id: 1,
    ...overrides,
  };
}

function makeGW(overrides: Partial<FPLManagerGameweek> = {}): FPLManagerGameweek {
  return {
    event: 15,
    points: 55,
    total_points: 900,
    rank: 100000,
    rank_sort: 100000,
    overall_rank: 50000,
    bank: 20,
    value: 1000,
    event_transfers: 1,
    event_transfers_cost: 0,
    points_on_bench: 5,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("buildSquadPlayers", () => {
  it("enriches squad with fixture run and stats", () => {
    const teams = [
      makeTeam({ id: 1, short_name: "ARS" }),
      makeTeam({ id: 2, short_name: "CHE" }),
    ];
    const elements = [makeElement({ id: 100, team: 1 })];
    const picks = [makePick({ element: 100, position: 1, is_captain: true })];
    const fixtures = [
      makeFixture({ event: 20, team_h: 1, team_a: 2, team_h_difficulty: 2 }),
      makeFixture({
        id: 2,
        event: 21,
        team_h: 2,
        team_a: 1,
        team_a_difficulty: 3,
      }),
    ];

    const result = buildSquadPlayers(picks, elements, fixtures, teams, 20);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ødegaard");
    expect(result[0].isCaptain).toBe(true);
    expect(result[0].isOnBench).toBe(false);
    expect(result[0].opponent).toContain("CHE");
    expect(result[0].fixtureRun.length).toBeGreaterThan(0);
    expect(result[0].cost).toBe(8.5);
    expect(result[0].xGIPer90).toBeGreaterThan(0);
  });

  it("marks bench players correctly", () => {
    const teams = [makeTeam({ id: 1, short_name: "ARS" })];
    const elements = [makeElement({ id: 100, team: 1 })];
    const picks = [makePick({ element: 100, position: 12 })];
    const fixtures = [makeFixture({ event: 20, team_h: 1 })];

    const result = buildSquadPlayers(picks, elements, fixtures, teams, 20);
    expect(result[0].isOnBench).toBe(true);
  });
});

describe("buildManagerForm", () => {
  it("calculates form trend as rising when recent avg is above season avg", () => {
    const history: FPLManagerGameweek[] = [
      makeGW({ event: 1, points: 40, overall_rank: 100000 }),
      makeGW({ event: 2, points: 42, overall_rank: 90000 }),
      makeGW({ event: 3, points: 45, overall_rank: 80000 }),
      makeGW({ event: 4, points: 65, overall_rank: 60000 }),
      makeGW({ event: 5, points: 70, overall_rank: 50000 }),
      makeGW({ event: 6, points: 75, overall_rank: 40000 }),
      makeGW({ event: 7, points: 80, overall_rank: 30000 }),
      makeGW({ event: 8, points: 78, overall_rank: 25000 }),
    ];

    const result = buildManagerForm("Test", "TestFC", history, 25000);

    expect(result.trend).toBe("rising");
    expect(result.last5GWScores).toHaveLength(5);
    expect(result.avgLast5).toBeGreaterThan(result.seasonAvg);
  });

  it("returns steady when form is close to season average", () => {
    const history = Array.from({ length: 8 }, (_, i) =>
      makeGW({ event: i + 1, points: 55, overall_rank: 50000 })
    );

    const result = buildManagerForm("Test", "TestFC", history, 50000);
    expect(result.trend).toBe("steady");
  });

  it("handles empty history gracefully", () => {
    const result = buildManagerForm("Test", "TestFC", [], 0);
    expect(result.trend).toBe("steady");
    expect(result.avgLast5).toBe(0);
    expect(result.last5GWScores).toHaveLength(0);
  });
});

describe("buildRivalSnapshots", () => {
  it("builds rival data with points gap and trend", () => {
    const standings: FPLStandingsResult[] = [
      {
        id: 1, event_total: 60, player_name: "Leader", rank: 1,
        last_rank: 1, rank_sort: 1, total: 1000, entry: 101, entry_name: "LeadFC",
      },
      {
        id: 2, event_total: 55, player_name: "Me", rank: 2,
        last_rank: 2, rank_sort: 2, total: 980, entry: 100, entry_name: "MyFC",
      },
      {
        id: 3, event_total: 50, player_name: "Rival", rank: 3,
        last_rank: 3, rank_sort: 3, total: 950, entry: 102, entry_name: "RivFC",
      },
    ];

    const rivalHistories = new Map<number, FPLManagerGameweek[]>();
    rivalHistories.set(101, [
      makeGW({ event: 18, points: 60 }),
      makeGW({ event: 19, points: 55 }),
      makeGW({ event: 20, points: 65 }),
    ]);
    rivalHistories.set(102, [
      makeGW({ event: 18, points: 45 }),
      makeGW({ event: 19, points: 50 }),
      makeGW({ event: 20, points: 48 }),
    ]);

    const rivalChips = new Map<number, FPLChip[]>();
    rivalChips.set(101, [{ name: "wildcard", time: "2025-01-01", event: 10 }]);
    rivalChips.set(102, []);

    const result = buildRivalSnapshots(standings, rivalHistories, rivalChips, 100);

    expect(result).toHaveLength(2);

    const leader = result.find((r) => r.managerName === "Leader")!;
    expect(leader.totalPoints).toBe(1000);
    expect(leader.pointsGap).toBe(20); // 1000 - 980

    const rival = result.find((r) => r.managerName === "Rival")!;
    expect(rival.pointsGap).toBe(-30); // 950 - 980
    expect(rival.chipsRemaining).toHaveLength(4); // All chips remaining
  });

  it("excludes the current manager from rival list", () => {
    const standings: FPLStandingsResult[] = [
      {
        id: 1, event_total: 60, player_name: "Me", rank: 1,
        last_rank: 1, rank_sort: 1, total: 1000, entry: 100, entry_name: "MyFC",
      },
    ];

    const result = buildRivalSnapshots(standings, new Map(), new Map(), 100);
    expect(result).toHaveLength(0);
  });
});

describe("buildTransferMarketInsights", () => {
  it("returns sorted transfer trends", () => {
    const teams = [
      makeTeam({ id: 1, short_name: "ARS" }),
      makeTeam({ id: 2, short_name: "CHE" }),
    ];
    const elements = [
      makeElement({
        id: 1, team: 1, web_name: "Saka",
        transfers_in_event: 50000, transfers_out_event: 5000,
        cost_change_event: 1, minutes: 900,
      }),
      makeElement({
        id: 2, team: 2, web_name: "Palmer",
        transfers_in_event: 2000, transfers_out_event: 40000,
        cost_change_event: -2, minutes: 900,
      }),
    ];

    const result = buildTransferMarketInsights(elements, teams);

    expect(result.mostTransferredIn[0].name).toBe("Saka");
    expect(result.mostTransferredOut[0].name).toBe("Palmer");
    expect(result.priceRisers[0].costChange).toBeGreaterThan(0);
    expect(result.priceFallers[0].costChange).toBeLessThan(0);
  });
});

describe("buildSquadBalance", () => {
  it("calculates value distribution and team exposure", () => {
    const squad = [
      { name: "P1", team: "ARS", position: "MID", isOnBench: false, cost: 10.0 },
      { name: "P2", team: "ARS", position: "FWD", isOnBench: false, cost: 12.0 },
      { name: "P3", team: "CHE", position: "DEF", isOnBench: true, cost: 5.0 },
    ] as any;

    const result = buildSquadBalance(squad, 20); // bank=20 = £2.0m

    expect(result.bank).toBe(2.0);
    expect(result.startingValue).toBe(22.0);
    expect(result.benchValue).toBe(5.0);
    expect(result.totalValue).toBe(29.0);
    expect(result.teamExposure[0]).toEqual({ team: "ARS", count: 2 });
  });
});

describe("getSeasonPhase", () => {
  it("returns early for first 20% of season", () => {
    expect(getSeasonPhase(1, 38)).toBe("early");
    expect(getSeasonPhase(7, 38)).toBe("early");
  });

  it("returns mid for 20-55% of season", () => {
    expect(getSeasonPhase(10, 38)).toBe("mid");
    expect(getSeasonPhase(20, 38)).toBe("mid");
  });

  it("returns late for 55-82% of season", () => {
    expect(getSeasonPhase(25, 38)).toBe("late");
    expect(getSeasonPhase(30, 38)).toBe("late");
  });

  it("returns endgame for 82%+ of season", () => {
    expect(getSeasonPhase(32, 38)).toBe("endgame");
    expect(getSeasonPhase(38, 38)).toBe("endgame");
  });
});

describe("summarizeChipWindows", () => {
  it("detects double gameweeks", () => {
    const teams = [
      makeTeam({ id: 1, short_name: "ARS" }),
      makeTeam({ id: 2, short_name: "CHE" }),
    ];
    const events = Array.from(
      { length: 38 },
      (_, i) =>
        ({
          id: i + 1,
          name: `Gameweek ${i + 1}`,
          finished: i < 20,
          is_current: i === 19,
          is_next: i === 20,
        }) as FPLEvent
    );

    // GW22: Arsenal has 2 fixtures (DGW)
    const fixtures = [
      makeFixture({ event: 22, team_h: 1, team_a: 2 }),
      makeFixture({ id: 2, event: 22, team_h: 1, team_a: 2 }),
    ];

    const result = summarizeChipWindows(fixtures, teams, events, 21);

    expect(result.some((s) => s.includes("DGW") && s.includes("GW22"))).toBe(
      true
    );
  });

  it("returns empty when no special gameweeks", () => {
    const teams = [makeTeam({ id: 1 })];
    const events = Array.from(
      { length: 38 },
      (_, i) => ({ id: i + 1 }) as FPLEvent
    );
    // One fixture per team per gameweek = normal
    const fixtures = Array.from({ length: 10 }, (_, i) =>
      makeFixture({ event: 21 + i, team_h: 1, team_a: 2 })
    );

    const result = summarizeChipWindows(fixtures, teams, events, 21);
    expect(result).toHaveLength(0);
  });
});
