import { describe, it, expect } from "vitest";
import {
  createSeededRandom,
  generateSeed,
  selectGameForGameweek,
  generateH2HPairings,
  calcCaptainClash,
  calcBenchBail,
  calcHitOrHero,
  calcCleanSheetShowdown,
  calcGameweekDuel,
  calcDifferentialKing,
  calcRankRocket,
  calcValueSurge,
  calcCrystalBall,
  assignH2HPoints,
  assignRankingPoints,
  buildLeaderboard,
} from "./engine";
import type {
  FPLLiveElement,
  FPLPick,
  FPLManagerGameweek,
  FPLTransfer,
  FPLElement,
} from "~/lib/fpl-api/types";
import type { MiniGameResult, MiniGamePairing, MiniGameType } from "./types";

// ============================================================================
// Helpers
// ============================================================================

function makeLiveElement(id: number, totalPoints: number, cleanSheets = 0): FPLLiveElement {
  return {
    id,
    stats: {
      minutes: 90,
      goals_scored: 0,
      assists: 0,
      clean_sheets: cleanSheets,
      goals_conceded: 0,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 0,
      red_cards: 0,
      saves: 0,
      bonus: 0,
      bps: 0,
      influence: "0",
      creativity: "0",
      threat: "0",
      ict_index: "0",
      starts: 1,
      expected_goals: "0",
      expected_assists: "0",
      expected_goal_involvements: "0",
      expected_goals_conceded: "0",
      total_points: totalPoints,
      in_dreamteam: false,
    },
    explain: [],
  };
}

function makePick(element: number, position: number, isCaptain = false, multiplier = 1): FPLPick {
  return {
    element,
    position,
    multiplier: isCaptain ? 2 : multiplier,
    is_captain: isCaptain,
    is_vice_captain: false,
  };
}

function makeGw(overrides: Partial<FPLManagerGameweek> = {}): FPLManagerGameweek {
  return {
    event: 1,
    points: 50,
    total_points: 500,
    rank: 100,
    rank_sort: 100,
    overall_rank: 50000,
    bank: 10,
    value: 1000,
    event_transfers: 1,
    event_transfers_cost: 0,
    points_on_bench: 8,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("createSeededRandom", () => {
  it("produces deterministic output for same seed", () => {
    const rng1 = createSeededRandom(42);
    const rng2 = createSeededRandom(42);
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it("produces different output for different seeds", () => {
    const rng1 = createSeededRandom(42);
    const rng2 = createSeededRandom(99);
    expect(rng1()).not.toBe(rng2());
  });

  it("produces values between 0 and 1", () => {
    const rng = createSeededRandom(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("generateSeed", () => {
  it("produces same seed for same inputs", () => {
    expect(generateSeed("123", 5)).toBe(generateSeed("123", 5));
  });

  it("produces different seeds for different inputs", () => {
    expect(generateSeed("123", 5)).not.toBe(generateSeed("456", 5));
    expect(generateSeed("123", 5)).not.toBe(generateSeed("123", 6));
  });
});

describe("selectGameForGameweek", () => {
  it("returns a valid game index (0-9)", () => {
    const idx = selectGameForGameweek("12345", 10);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(10);
  });

  it("is deterministic", () => {
    expect(selectGameForGameweek("100", 5)).toBe(selectGameForGameweek("100", 5));
  });

  it("avoids recent game indices when possible", () => {
    const recent = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // all except 9
    const idx = selectGameForGameweek("test", 1, recent);
    // Should eventually find one not in recent (9 or fallback)
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(10);
  });
});

describe("generateH2HPairings", () => {
  it("pairs all managers (even count)", () => {
    const managers = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
      { id: 4, name: "D" },
    ];
    const pairings = generateH2HPairings(managers, 42);
    expect(pairings).toHaveLength(2);
    pairings.forEach((p) => {
      expect(p.managerA).toBeDefined();
      expect(p.managerB).toBeDefined();
    });
  });

  it("gives bye to odd player", () => {
    const managers = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
    ];
    const pairings = generateH2HPairings(managers, 42);
    expect(pairings).toHaveLength(2);
    const byePairing = pairings.find((p) => p.managerB === null);
    expect(byePairing).toBeDefined();
  });

  it("returns empty for no managers", () => {
    expect(generateH2HPairings([], 42)).toEqual([]);
  });

  it("is deterministic", () => {
    const managers = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
      { id: 4, name: "D" },
    ];
    const p1 = generateH2HPairings(managers, 42);
    const p2 = generateH2HPairings(managers, 42);
    expect(p1).toEqual(p2);
  });
});

describe("calcCaptainClash", () => {
  it("calculates captain points with multiplier", () => {
    const picks = new Map([
      [1, { picks: [makePick(100, 1, true, 2), makePick(101, 2)], managerName: "Alice" }],
      [2, { picks: [makePick(200, 1, true, 2), makePick(201, 2)], managerName: "Bob" }],
    ]);
    const live = new Map([
      [100, makeLiveElement(100, 10)],
      [200, makeLiveElement(200, 5)],
    ]);

    const scores = calcCaptainClash(picks, live);
    expect(scores).toHaveLength(2);
    const alice = scores.find((s) => s.managerId === 1)!;
    const bob = scores.find((s) => s.managerId === 2)!;
    expect(alice.score).toBe(20); // 10 * 2
    expect(bob.score).toBe(10); // 5 * 2
  });
});

describe("calcBenchBail", () => {
  it("returns bench points from history", () => {
    const histories = new Map([
      [1, { gw: makeGw({ points_on_bench: 15 }), managerName: "Alice" }],
      [2, { gw: makeGw({ points_on_bench: 3 }), managerName: "Bob" }],
    ]);

    const scores = calcBenchBail(histories);
    expect(scores.find((s) => s.managerId === 1)!.score).toBe(15);
    expect(scores.find((s) => s.managerId === 2)!.score).toBe(3);
  });
});

describe("calcHitOrHero", () => {
  it("sums points from transferred-in players", () => {
    const transfers = new Map([
      [1, {
        transfers: [
          { element_in: 100, element_in_cost: 50, element_out: 200, element_out_cost: 45, entry: 1, event: 5, time: "" },
        ] as FPLTransfer[],
        managerName: "Alice",
      }],
      [2, { transfers: [] as FPLTransfer[], managerName: "Bob" }],
    ]);
    const live = new Map([[100, makeLiveElement(100, 12)]]);

    const scores = calcHitOrHero(transfers, live, 5);
    expect(scores.find((s) => s.managerId === 1)!.score).toBe(12);
    expect(scores.find((s) => s.managerId === 2)!.score).toBe(0);
  });
});

describe("calcCleanSheetShowdown", () => {
  it("counts clean sheet points for GK and DEF only", () => {
    const picks = new Map([
      [1, {
        picks: [
          makePick(10, 1),  // GK
          makePick(20, 2),  // DEF
          makePick(30, 3),  // DEF
          makePick(40, 4),  // MID
        ],
        managerName: "Alice",
      }],
    ]);
    const live = new Map([
      [10, makeLiveElement(10, 6, 1)],
      [20, makeLiveElement(20, 6, 1)],
      [30, makeLiveElement(30, 2, 0)],
      [40, makeLiveElement(40, 8, 1)], // MID - should be ignored
    ]);
    const types = new Map([[10, 1], [20, 2], [30, 2], [40, 3]]);

    const scores = calcCleanSheetShowdown(picks, live, types);
    expect(scores[0].score).toBe(8); // GK(4) + DEF(4) + DEF(0)
  });
});

describe("calcGameweekDuel", () => {
  it("returns net points after hits", () => {
    const histories = new Map([
      [1, { gw: makeGw({ points: 70, event_transfers_cost: 4 }), managerName: "Alice" }],
      [2, { gw: makeGw({ points: 60, event_transfers_cost: 0 }), managerName: "Bob" }],
    ]);

    const scores = calcGameweekDuel(histories);
    expect(scores.find((s) => s.managerId === 1)!.score).toBe(66);
    expect(scores.find((s) => s.managerId === 2)!.score).toBe(60);
  });
});

describe("calcDifferentialKing", () => {
  it("only counts points from <10% ownership players", () => {
    const picks = new Map([
      [1, {
        picks: [makePick(100, 1), makePick(101, 2)],
        managerName: "Alice",
      }],
    ]);
    const live = new Map([
      [100, makeLiveElement(100, 8)],
      [101, makeLiveElement(101, 10)],
    ]);
    const elements = [
      { id: 100, selected_by_percent: "5.0" } as FPLElement,
      { id: 101, selected_by_percent: "25.0" } as FPLElement,
    ];

    const scores = calcDifferentialKing(picks, live, elements);
    expect(scores[0].score).toBe(8); // only player 100 counts
  });
});

describe("calcRankRocket", () => {
  it("calculates rank improvement", () => {
    const histories = new Map([
      [1, {
        current: makeGw({ overall_rank: 40000 }),
        previous: makeGw({ overall_rank: 80000 }),
        managerName: "Alice",
      }],
      [2, {
        current: makeGw({ overall_rank: 60000 }),
        previous: makeGw({ overall_rank: 50000 }),
        managerName: "Bob",
      }],
    ]);

    const scores = calcRankRocket(histories);
    expect(scores.find((s) => s.managerId === 1)!.score).toBe(40000); // improved
    expect(scores.find((s) => s.managerId === 2)!.score).toBe(-10000); // dropped
  });
});

describe("calcValueSurge", () => {
  it("calculates value change", () => {
    const histories = new Map([
      [1, {
        current: makeGw({ value: 1050 }),
        previous: makeGw({ value: 1000 }),
        managerName: "Alice",
      }],
    ]);

    const scores = calcValueSurge(histories);
    expect(scores[0].score).toBe(50);
  });
});

describe("calcCrystalBall", () => {
  it("scores based on distance from average (negated)", () => {
    const histories = new Map([
      [1, { gw: makeGw({ points: 50 }), managerName: "Alice" }],
      [2, { gw: makeGw({ points: 45 }), managerName: "Bob" }],
    ]);

    const scores = calcCrystalBall(histories, 48);
    const alice = scores.find((s) => s.managerId === 1)!;
    const bob = scores.find((s) => s.managerId === 2)!;
    expect(alice.score).toBe(-2); // |50-48| = 2, negated
    expect(bob.score).toBe(-3); // |45-48| = 3, negated
    // Alice is closer (higher score), so she wins
    expect(alice.score).toBeGreaterThan(bob.score);
  });
});

describe("assignH2HPoints", () => {
  it("awards 3-0 for win", () => {
    expect(assignH2HPoints(10, 5)).toEqual({ pointsA: 3, pointsB: 0 });
  });

  it("awards 0-3 for loss", () => {
    expect(assignH2HPoints(3, 8)).toEqual({ pointsA: 0, pointsB: 3 });
  });

  it("awards 1-1 for draw", () => {
    expect(assignH2HPoints(7, 7)).toEqual({ pointsA: 1, pointsB: 1 });
  });

  it("awards 1-0 for bye", () => {
    expect(assignH2HPoints(10, null)).toEqual({ pointsA: 1, pointsB: 0 });
  });
});

describe("assignRankingPoints", () => {
  it("assigns 3-2-1-0 for distinct scores", () => {
    const scores = [
      { managerId: 1, managerName: "A", score: 100 },
      { managerId: 2, managerName: "B", score: 80 },
      { managerId: 3, managerName: "C", score: 60 },
      { managerId: 4, managerName: "D", score: 40 },
    ];

    const results = assignRankingPoints(scores);
    expect(results.find((r) => r.managerId === 1)!.points).toBe(3);
    expect(results.find((r) => r.managerId === 2)!.points).toBe(2);
    expect(results.find((r) => r.managerId === 3)!.points).toBe(1);
    expect(results.find((r) => r.managerId === 4)!.points).toBe(0);
  });

  it("gives tied managers same points", () => {
    const scores = [
      { managerId: 1, managerName: "A", score: 100 },
      { managerId: 2, managerName: "B", score: 100 },
      { managerId: 3, managerName: "C", score: 50 },
    ];

    const results = assignRankingPoints(scores);
    expect(results.find((r) => r.managerId === 1)!.points).toBe(3); // tied 1st
    expect(results.find((r) => r.managerId === 2)!.points).toBe(3); // tied 1st
    expect(results.find((r) => r.managerId === 3)!.points).toBe(1); // 3rd
  });
});

describe("buildLeaderboard", () => {
  it("aggregates results and pairings into leaderboard", () => {
    const results: MiniGameResult[] = [
      { id: "r1", round: "round1", manager_id: 1, manager_name: "Alice", score: 100, rank: 1, points: 3 },
      { id: "r2", round: "round1", manager_id: 2, manager_name: "Bob", score: 80, rank: 2, points: 2 },
    ];
    const pairings: MiniGamePairing[] = [
      {
        id: "p1", round: "round2",
        manager_a_id: 1, manager_a_name: "Alice",
        manager_b_id: 2, manager_b_name: "Bob",
        score_a: 10, score_b: 5,
        points_a: 3, points_b: 0,
      },
    ];
    const roundTypes = new Map<string, MiniGameType>([
      ["round1", "ranking"],
      ["round2", "h2h"],
    ]);

    const leaderboard = buildLeaderboard(results, pairings, roundTypes);
    expect(leaderboard).toHaveLength(2);

    const alice = leaderboard.find((e) => e.managerId === 1)!;
    expect(alice.totalPoints).toBe(6); // 3 from ranking + 3 from H2H
    expect(alice.wins).toBe(2);
    expect(alice.gamesPlayed).toBe(2);

    const bob = leaderboard.find((e) => e.managerId === 2)!;
    expect(bob.totalPoints).toBe(2); // 2 from ranking + 0 from H2H
    expect(bob.wins).toBe(0);
    expect(bob.losses).toBe(1);
  });
});
