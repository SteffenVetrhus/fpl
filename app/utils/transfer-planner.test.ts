import { describe, it, expect } from "vitest";
import {
  buildSquadFromPicks,
  applyPlanToSquad,
  calculateHitCost,
  calculateFreeTransfers,
  validateSquad,
  getPositionLabel,
  groupByPosition,
} from "./transfer-planner";
import type { SquadPlayer, PlannerSquad } from "./transfer-planner";
import type { FPLElement, FPLPick, FPLManagerGameweek, FPLChip } from "~/lib/fpl-api/types";
import type { GameweekPlan } from "./transfer-planner";

function makeElement(overrides: Partial<FPLElement> = {}): FPLElement {
  return {
    id: 1,
    code: 1,
    element_type: 3,
    first_name: "Test",
    second_name: "Player",
    web_name: "T. Player",
    team: 1,
    team_code: 1,
    status: "a",
    now_cost: 80,
    cost_change_start: 0,
    cost_change_event: 0,
    total_points: 50,
    event_points: 5,
    points_per_game: "5.0",
    ep_this: "5.0",
    ep_next: "5.0",
    form: "5.0",
    selected_by_percent: "10.0",
    transfers_in: 1000,
    transfers_out: 500,
    transfers_in_event: 100,
    transfers_out_event: 50,
    chance_of_playing_this_round: 100,
    chance_of_playing_next_round: 100,
    value_form: "1.0",
    value_season: "1.0",
    minutes: 900,
    goals_scored: 3,
    assists: 2,
    clean_sheets: 0,
    goals_conceded: 10,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 1,
    red_cards: 0,
    saves: 0,
    bonus: 5,
    bps: 100,
    influence: "50.0",
    creativity: "50.0",
    threat: "50.0",
    ict_index: "50.0",
    starts: 10,
    expected_goals: "2.0",
    expected_assists: "1.5",
    expected_goal_involvements: "3.5",
    expected_goals_conceded: "8.0",
    ...overrides,
  };
}

function makePick(overrides: Partial<FPLPick> = {}): FPLPick {
  return {
    element: 1,
    position: 1,
    multiplier: 1,
    is_captain: false,
    is_vice_captain: false,
    ...overrides,
  };
}

function makeSquadPlayer(overrides: Partial<SquadPlayer> = {}): SquadPlayer {
  return {
    element: 1,
    position: 1,
    isCaptain: false,
    isViceCaptain: false,
    webName: "Player",
    teamId: 1,
    elementType: 3,
    cost: 8.0,
    form: "5.0",
    totalPoints: 50,
    status: "a",
    ...overrides,
  };
}

function makeGameweek(overrides: Partial<FPLManagerGameweek> = {}): FPLManagerGameweek {
  return {
    event: 1,
    points: 50,
    total_points: 50,
    rank: 1000,
    rank_sort: 1000,
    overall_rank: 1000,
    bank: 0,
    value: 1000,
    event_transfers: 0,
    event_transfers_cost: 0,
    points_on_bench: 0,
    ...overrides,
  };
}

describe("calculateFreeTransfers", () => {
  it("returns 1 for gameweek 1 with no transfers", () => {
    // After GW1 plays, you have 1 unused + 1 new = 2 for next GW
    // But the function returns the state AFTER all gameweeks
    const gws = [makeGameweek({ event: 1 })];
    expect(calculateFreeTransfers(gws, [])).toBe(2);
  });

  it("accumulates free transfers when none are used", () => {
    const gws = [
      makeGameweek({ event: 1 }),
      makeGameweek({ event: 2 }),
      makeGameweek({ event: 3 }),
    ];
    // GW1: start 1, use 0 -> min(5, 1-0+1) = 2
    // GW2: start 2, use 0 -> min(5, 2-0+1) = 3
    // GW3: start 3, use 0 -> min(5, 3-0+1) = 4
    expect(calculateFreeTransfers(gws, [])).toBe(4);
  });

  it("caps at 5 free transfers", () => {
    const gws = Array.from({ length: 6 }, (_, i) =>
      makeGameweek({ event: i + 1 })
    );
    // GW1->2, GW2->3, GW3->4, GW4->5, GW5->5 (capped), GW6->5 (capped)
    expect(calculateFreeTransfers(gws, [])).toBe(5);
  });

  it("deducts used free transfers", () => {
    const gws = [
      makeGameweek({ event: 1 }),
      makeGameweek({ event: 2 }),
      makeGameweek({ event: 3, event_transfers: 2, event_transfers_cost: 0 }),
    ];
    // GW1: 1->2, GW2: 2->3, GW3: start 3, use 2 free -> min(5, 3-2+1) = 2
    expect(calculateFreeTransfers(gws, [])).toBe(2);
  });

  it("handles hits (paid transfers) correctly", () => {
    const gws = [
      makeGameweek({ event: 1, event_transfers: 3, event_transfers_cost: 8 }),
    ];
    // 3 transfers, 8 cost = 2 paid, so 1 free used
    // min(5, 1-1+1) = 1
    expect(calculateFreeTransfers(gws, [])).toBe(1);
  });

  it("resets to 1 after wildcard", () => {
    const gws = [
      makeGameweek({ event: 1 }),
      makeGameweek({ event: 2 }),
      makeGameweek({ event: 3, event_transfers: 5, event_transfers_cost: 0 }),
    ];
    const chips: FPLChip[] = [
      { name: "wildcard", time: "2025-01-01", event: 3 },
    ];
    // GW1: 1->2, GW2: 2->3, GW3: wildcard -> reset to 1
    expect(calculateFreeTransfers(gws, chips)).toBe(1);
  });

  it("resets to 1 after free hit", () => {
    const gws = [
      makeGameweek({ event: 1 }),
      makeGameweek({ event: 2 }),
      makeGameweek({ event: 3, event_transfers: 10, event_transfers_cost: 0 }),
    ];
    const chips: FPLChip[] = [
      { name: "freehit", time: "2025-01-01", event: 3 },
    ];
    expect(calculateFreeTransfers(gws, chips)).toBe(1);
  });

  it("does not reset for non-transfer chips like bench boost", () => {
    const gws = [
      makeGameweek({ event: 1 }),
      makeGameweek({ event: 2 }),
    ];
    const chips: FPLChip[] = [
      { name: "bboost", time: "2025-01-01", event: 2 },
    ];
    // GW1: 1->2, GW2: 2->3 (bench boost doesn't reset)
    expect(calculateFreeTransfers(gws, chips)).toBe(3);
  });

  it("returns 1 for empty history", () => {
    expect(calculateFreeTransfers([], [])).toBe(1);
  });

  it("never drops below 1", () => {
    const gws = [
      makeGameweek({ event: 1, event_transfers: 4, event_transfers_cost: 12 }),
    ];
    // 4 transfers, 12 cost = 3 paid, 1 free used
    // min(5, 1-1+1) = 1
    expect(calculateFreeTransfers(gws, [])).toBe(1);
  });
});

describe("buildSquadFromPicks", () => {
  it("builds a squad from picks and elements", () => {
    const picks = [
      makePick({ element: 10, position: 1, is_captain: true, multiplier: 2 }),
      makePick({ element: 20, position: 2, is_vice_captain: true }),
    ];
    const elements = [
      makeElement({ id: 10, web_name: "Salah", team: 5, element_type: 3, now_cost: 130 }),
      makeElement({ id: 20, web_name: "Haaland", team: 8, element_type: 4, now_cost: 145 }),
    ];

    const squad = buildSquadFromPicks(picks, elements, 5);

    expect(squad.players).toHaveLength(2);
    expect(squad.players[0].webName).toBe("Salah");
    expect(squad.players[0].isCaptain).toBe(true);
    expect(squad.players[0].cost).toBe(13.0);
    expect(squad.players[1].webName).toBe("Haaland");
    expect(squad.players[1].isViceCaptain).toBe(true);
    expect(squad.players[1].cost).toBe(14.5);
    expect(squad.bank).toBe(0.5);
    expect(squad.freeTransfers).toBe(1);
  });

  it("uses provided freeTransfers value", () => {
    const picks = [
      makePick({ element: 10, position: 1 }),
    ];
    const elements = [
      makeElement({ id: 10, now_cost: 80 }),
    ];

    const squad = buildSquadFromPicks(picks, elements, 5, 4);
    expect(squad.freeTransfers).toBe(4);
  });
});

describe("applyPlanToSquad", () => {
  it("applies a transfer and updates bank", () => {
    const squad: PlannerSquad = {
      players: [
        makeSquadPlayer({ element: 100, cost: 8.0, elementType: 3, teamId: 1 }),
      ],
      bank: 2.0,
      freeTransfers: 1,
      totalValue: 10.0,
    };

    const plan: GameweekPlan = {
      transfers: [{ elementIn: 200, elementOut: 100 }],
      captain: null,
      viceCaptain: null,
      chip: null,
      benchOrder: [],
    };

    const elements = [
      makeElement({ id: 200, web_name: "NewPlayer", team: 3, element_type: 3, now_cost: 70 }),
    ];

    const result = applyPlanToSquad(squad, plan, elements);

    expect(result.players[0].element).toBe(200);
    expect(result.players[0].webName).toBe("NewPlayer");
    // Bank: 2.0 + 8.0 (sold) - 7.0 (bought) = 3.0
    expect(result.bank).toBe(3.0);
  });

  it("updates captain and vice captain", () => {
    const squad: PlannerSquad = {
      players: [
        makeSquadPlayer({ element: 100, isCaptain: true }),
        makeSquadPlayer({ element: 200, position: 2 }),
      ],
      bank: 0,
      freeTransfers: 1,
      totalValue: 16.0,
    };

    const plan: GameweekPlan = {
      transfers: [],
      captain: 200,
      viceCaptain: 100,
      chip: null,
      benchOrder: [],
    };

    const result = applyPlanToSquad(squad, plan, []);

    expect(result.players.find((p) => p.element === 200)?.isCaptain).toBe(true);
    expect(result.players.find((p) => p.element === 100)?.isViceCaptain).toBe(true);
  });

  it("calculates next GW free transfers after using transfers", () => {
    const squad: PlannerSquad = {
      players: [
        makeSquadPlayer({ element: 100, cost: 8.0, elementType: 3 }),
        makeSquadPlayer({ element: 101, cost: 7.0, elementType: 3, position: 2 }),
        makeSquadPlayer({ element: 102, cost: 6.0, elementType: 3, position: 3 }),
      ],
      bank: 5.0,
      freeTransfers: 2,
      totalValue: 26.0,
    };

    const plan: GameweekPlan = {
      transfers: [
        { elementIn: 200, elementOut: 100 },
        { elementIn: 201, elementOut: 101 },
        { elementIn: 202, elementOut: 102 },
      ],
      captain: null,
      viceCaptain: null,
      chip: null,
      benchOrder: [],
    };

    const elements = [
      makeElement({ id: 200, now_cost: 80 }),
      makeElement({ id: 201, now_cost: 70 }),
      makeElement({ id: 202, now_cost: 60 }),
    ];

    const result = applyPlanToSquad(squad, plan, elements);
    // 3 transfers with 2 FT: 1 hit. Next GW FT = max(1, min(5, 2-3+1)) = 1
    expect(result.freeTransfers).toBe(1);
  });

  it("applies chained transfers sequentially within same GW", () => {
    const squad: PlannerSquad = {
      players: [
        makeSquadPlayer({ element: 100, cost: 8.0, elementType: 3 }),
      ],
      bank: 2.0,
      freeTransfers: 2,
      totalValue: 10.0,
    };

    // Chained: 100→200, then 200→300 (user changed their mind)
    const plan: GameweekPlan = {
      transfers: [
        { elementIn: 200, elementOut: 100 },
        { elementIn: 300, elementOut: 200 },
      ],
      captain: null,
      viceCaptain: null,
      chip: null,
      benchOrder: [],
    };

    const elements = [
      makeElement({ id: 200, web_name: "Middle", now_cost: 70 }),
      makeElement({ id: 300, web_name: "Final", now_cost: 60 }),
    ];

    const result = applyPlanToSquad(squad, plan, elements);
    // Final player should be 300
    expect(result.players[0].element).toBe(300);
    expect(result.players[0].webName).toBe("Final");
    // Bank: 2.0 + 8.0 - 7.0 + 7.0 - 6.0 = 4.0
    expect(result.bank).toBe(4.0);
  });

  it("resets free transfers to 1 after wildcard", () => {
    const squad: PlannerSquad = {
      players: [makeSquadPlayer({ element: 100, cost: 8.0 })],
      bank: 5.0,
      freeTransfers: 2,
      totalValue: 13.0,
    };

    const plan: GameweekPlan = {
      transfers: [{ elementIn: 200, elementOut: 100 }],
      captain: null,
      viceCaptain: null,
      chip: "wildcard",
      benchOrder: [],
    };

    const elements = [
      makeElement({ id: 200, web_name: "New", now_cost: 80 }),
    ];

    const result = applyPlanToSquad(squad, plan, elements);
    expect(result.freeTransfers).toBe(1);
  });
});

describe("calculateHitCost", () => {
  it("returns 0 for transfers within free allowance", () => {
    expect(calculateHitCost(1, 1, null)).toBe(0);
    expect(calculateHitCost(1, 2, null)).toBe(0);
    expect(calculateHitCost(0, 1, null)).toBe(0);
  });

  it("returns 4 points per extra transfer", () => {
    expect(calculateHitCost(2, 1, null)).toBe(4);
    expect(calculateHitCost(3, 1, null)).toBe(8);
    expect(calculateHitCost(5, 2, null)).toBe(12);
  });

  it("returns 0 for wildcard regardless of transfer count", () => {
    expect(calculateHitCost(10, 1, "wildcard")).toBe(0);
  });

  it("returns 0 for free hit regardless of transfer count", () => {
    expect(calculateHitCost(15, 1, "freehit")).toBe(0);
  });
});

describe("validateSquad", () => {
  it("returns no errors for a valid 15-player squad", () => {
    const players = [
      // 2 GK
      makeSquadPlayer({ element: 1, elementType: 1, teamId: 1 }),
      makeSquadPlayer({ element: 2, elementType: 1, teamId: 2 }),
      // 5 DEF
      makeSquadPlayer({ element: 3, elementType: 2, teamId: 3 }),
      makeSquadPlayer({ element: 4, elementType: 2, teamId: 4 }),
      makeSquadPlayer({ element: 5, elementType: 2, teamId: 5 }),
      makeSquadPlayer({ element: 6, elementType: 2, teamId: 6 }),
      makeSquadPlayer({ element: 7, elementType: 2, teamId: 7 }),
      // 5 MID
      makeSquadPlayer({ element: 8, elementType: 3, teamId: 8 }),
      makeSquadPlayer({ element: 9, elementType: 3, teamId: 9 }),
      makeSquadPlayer({ element: 10, elementType: 3, teamId: 10 }),
      makeSquadPlayer({ element: 11, elementType: 3, teamId: 11 }),
      makeSquadPlayer({ element: 12, elementType: 3, teamId: 12 }),
      // 3 FWD
      makeSquadPlayer({ element: 13, elementType: 4, teamId: 13 }),
      makeSquadPlayer({ element: 14, elementType: 4, teamId: 14 }),
      makeSquadPlayer({ element: 15, elementType: 4, teamId: 15 }),
    ];

    expect(validateSquad(players)).toEqual([]);
  });

  it("detects wrong squad size", () => {
    const players = [makeSquadPlayer()];
    const errors = validateSquad(players);
    expect(errors.some((e) => e.includes("15 players"))).toBe(true);
  });

  it("detects too many players from one team", () => {
    const players = Array.from({ length: 15 }, (_, i) =>
      makeSquadPlayer({
        element: i + 1,
        teamId: i < 4 ? 1 : i + 1,
        elementType: i < 2 ? 1 : i < 7 ? 2 : i < 12 ? 3 : 4,
      })
    );

    const errors = validateSquad(players);
    expect(errors.some((e) => e.includes("Max 3 players per team"))).toBe(true);
  });
});

describe("getPositionLabel", () => {
  it("returns correct labels", () => {
    expect(getPositionLabel(1)).toBe("GK");
    expect(getPositionLabel(2)).toBe("DEF");
    expect(getPositionLabel(3)).toBe("MID");
    expect(getPositionLabel(4)).toBe("FWD");
    expect(getPositionLabel(99)).toBe("???");
  });
});

describe("groupByPosition", () => {
  it("groups starting players by position and separates bench", () => {
    const players = [
      makeSquadPlayer({ element: 1, position: 1, elementType: 1 }),
      makeSquadPlayer({ element: 2, position: 2, elementType: 2 }),
      makeSquadPlayer({ element: 3, position: 3, elementType: 3 }),
      makeSquadPlayer({ element: 4, position: 4, elementType: 4 }),
      makeSquadPlayer({ element: 5, position: 12, elementType: 1 }),
      makeSquadPlayer({ element: 6, position: 13, elementType: 2 }),
    ];

    const groups = groupByPosition(players);
    expect(groups.GK).toHaveLength(1);
    expect(groups.DEF).toHaveLength(1);
    expect(groups.MID).toHaveLength(1);
    expect(groups.FWD).toHaveLength(1);
    expect(groups.BENCH).toHaveLength(2);
  });
});
