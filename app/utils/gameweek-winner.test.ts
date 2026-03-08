import { describe, it, expect } from "vitest";
import { calculateGameweekWinner, getNetPoints } from "./gameweek-winner";
import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

describe("getNetPoints", () => {
  const createGameweek = (
    points: number,
    transferCost: number
  ): FPLManagerGameweek => ({
    event: 1,
    points,
    total_points: 1000,
    rank: 1,
    rank_sort: 1,
    overall_rank: 100000,
    bank: 0,
    value: 1000,
    event_transfers: transferCost > 0 ? 2 : 0,
    event_transfers_cost: transferCost,
    points_on_bench: 0,
  });

  it("should return points when no transfer cost", () => {
    expect(getNetPoints(createGameweek(65, 0))).toBe(65);
  });

  it("should subtract transfer cost from points", () => {
    expect(getNetPoints(createGameweek(65, 4))).toBe(61);
  });

  it("should handle large transfer costs", () => {
    expect(getNetPoints(createGameweek(65, 12))).toBe(53);
  });
});

describe("calculateGameweekWinner", () => {
  const createGameweek = (
    event: number,
    points: number,
    transferCost = 0
  ): FPLManagerGameweek => ({
    event,
    points,
    total_points: 1000,
    rank: 1,
    rank_sort: 1,
    overall_rank: 100000,
    bank: 0,
    value: 1000,
    event_transfers: transferCost > 0 ? 2 : 0,
    event_transfers_cost: transferCost,
    points_on_bench: 0,
  });

  it("should return single winner with highest points", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 92), createGameweek(2, 65)],
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 78), createGameweek(2, 85)],
      },
      {
        name: "Charlie",
        gameweeks: [createGameweek(1, 65), createGameweek(2, 72)],
      },
    ];

    const winners = calculateGameweekWinner(managers, 1);

    expect(winners).toEqual(["Alice"]);
  });

  it("should return multiple winners when tied on points", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 92)],
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 92)],
      },
      {
        name: "Charlie",
        gameweeks: [createGameweek(1, 65)],
      },
    ];

    const winners = calculateGameweekWinner(managers, 1);

    expect(winners).toHaveLength(2);
    expect(winners).toContain("Alice");
    expect(winners).toContain("Bob");
  });

  it("should return empty array when gameweek not found", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 92)],
      },
    ];

    const winners = calculateGameweekWinner(managers, 999);

    expect(winners).toEqual([]);
  });

  it("should return empty array when no managers provided", () => {
    const winners = calculateGameweekWinner([], 1);

    expect(winners).toEqual([]);
  });

  it("should handle all managers scoring same points", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 75)],
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 75)],
      },
      {
        name: "Charlie",
        gameweeks: [createGameweek(1, 75)],
      },
    ];

    const winners = calculateGameweekWinner(managers, 1);

    expect(winners).toHaveLength(3);
    expect(winners).toContain("Alice");
    expect(winners).toContain("Bob");
    expect(winners).toContain("Charlie");
  });

  it("should only consider the specified gameweek", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 50), createGameweek(2, 92)],
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 92), createGameweek(2, 50)],
      },
    ];

    const winnersGW1 = calculateGameweekWinner(managers, 1);
    const winnersGW2 = calculateGameweekWinner(managers, 2);

    expect(winnersGW1).toEqual(["Bob"]);
    expect(winnersGW2).toEqual(["Alice"]);
  });

  it("should handle managers missing data for specific gameweek", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 92)],
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(2, 85)], // No GW1 data
      },
      {
        name: "Charlie",
        gameweeks: [createGameweek(1, 78)],
      },
    ];

    const winners = calculateGameweekWinner(managers, 1);

    expect(winners).toEqual(["Alice"]);
  });

  it("should pick winner without transfer hit when raw points are tied", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 52)], // 52 net (no hit)
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 52, 4)], // 48 net (4pt hit)
      },
    ];

    const winners = calculateGameweekWinner(managers, 1);

    expect(winners).toEqual(["Alice"]);
  });

  it("should treat both as winners when net points are tied", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 52)], // 52 net
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 52)], // 52 net
      },
    ];

    const winners = calculateGameweekWinner(managers, 1);

    expect(winners).toHaveLength(2);
    expect(winners).toContain("Alice");
    expect(winners).toContain("Bob");
  });

  it("should allow player with hit to win if net points are still highest", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 60)], // 60 net
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 70, 4)], // 66 net (took hit but still higher)
      },
    ];

    const winners = calculateGameweekWinner(managers, 1);

    expect(winners).toEqual(["Bob"]);
  });

  it("should handle multiple managers with various transfer costs", () => {
    const managers = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 65)], // 65 net
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 70, 8)], // 62 net
      },
      {
        name: "Charlie",
        gameweeks: [createGameweek(1, 68, 4)], // 64 net
      },
    ];

    const winners = calculateGameweekWinner(managers, 1);

    expect(winners).toEqual(["Alice"]);
  });
});
