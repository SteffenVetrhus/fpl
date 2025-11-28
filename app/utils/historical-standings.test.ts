import { describe, it, expect } from "vitest";
import {
  calculateHistoricalStandings,
  getAvailableGameweeks,
  type ManagerGameweekData,
} from "./historical-standings";

describe("getAvailableGameweeks", () => {
  it("should return all gameweeks that have been played", () => {
    const managers: ManagerGameweekData[] = [
      {
        name: "Alice",
        teamName: "Alice's Aces",
        gameweeks: [
          { event: 1, points: 65, total_points: 65, rank: 2, rank_sort: 2, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 10 },
          { event: 2, points: 72, total_points: 137, rank: 1, rank_sort: 1, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 8 },
          { event: 3, points: 78, total_points: 215, rank: 1, rank_sort: 1, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 15 },
        ],
      },
    ];

    const gameweeks = getAvailableGameweeks(managers);

    expect(gameweeks).toEqual([1, 2, 3]);
  });

  it("should handle multiple managers with different gameweeks played", () => {
    const managers: ManagerGameweekData[] = [
      {
        name: "Alice",
        teamName: "Alice's Aces",
        gameweeks: [
          { event: 1, points: 65, total_points: 65, rank: 2, rank_sort: 2, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 10 },
          { event: 2, points: 72, total_points: 137, rank: 1, rank_sort: 1, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 8 },
        ],
      },
      {
        name: "Bob",
        teamName: "Bob's Best",
        gameweeks: [
          { event: 1, points: 82, total_points: 82, rank: 1, rank_sort: 1, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 12 },
          { event: 2, points: 68, total_points: 150, rank: 2, rank_sort: 2, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 6 },
          { event: 3, points: 71, total_points: 221, rank: 2, rank_sort: 2, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 9 },
        ],
      },
    ];

    const gameweeks = getAvailableGameweeks(managers);

    expect(gameweeks).toEqual([1, 2, 3]);
  });

  it("should return empty array when no managers", () => {
    const gameweeks = getAvailableGameweeks([]);
    expect(gameweeks).toEqual([]);
  });

  it("should return sorted unique gameweeks", () => {
    const managers: ManagerGameweekData[] = [
      {
        name: "Alice",
        teamName: "Alice's Aces",
        gameweeks: [
          { event: 3, points: 78, total_points: 215, rank: 1, rank_sort: 1, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 15 },
          { event: 1, points: 65, total_points: 65, rank: 2, rank_sort: 2, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 10 },
          { event: 2, points: 72, total_points: 137, rank: 1, rank_sort: 1, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 8 },
        ],
      },
    ];

    const gameweeks = getAvailableGameweeks(managers);

    // Should be sorted ascending
    expect(gameweeks).toEqual([1, 2, 3]);
  });
});

describe("calculateHistoricalStandings", () => {
  const mockManagers: ManagerGameweekData[] = [
    {
      name: "Alice",
      teamName: "Alice's Aces",
      gameweeks: [
        { event: 1, points: 65, total_points: 65, rank: 3, rank_sort: 3, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 10 },
        { event: 2, points: 72, total_points: 137, rank: 2, rank_sort: 2, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 8 },
        { event: 3, points: 78, total_points: 215, rank: 2, rank_sort: 2, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 15 },
        { event: 4, points: 56, total_points: 271, rank: 3, rank_sort: 3, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 5 },
        { event: 5, points: 92, total_points: 363, rank: 1, rank_sort: 1, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 2, event_transfers_cost: 8, points_on_bench: 7 },
      ],
    },
    {
      name: "Bob",
      teamName: "Bob's Best",
      gameweeks: [
        { event: 1, points: 78, total_points: 78, rank: 1, rank_sort: 1, overall_rank: 110000, bank: 5, value: 1005, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 12 },
        { event: 2, points: 68, total_points: 146, rank: 1, rank_sort: 1, overall_rank: 110000, bank: 5, value: 1005, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 6 },
        { event: 3, points: 71, total_points: 217, rank: 1, rank_sort: 1, overall_rank: 110000, bank: 5, value: 1005, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 9 },
        { event: 4, points: 82, total_points: 299, rank: 1, rank_sort: 1, overall_rank: 110000, bank: 10, value: 1010, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 11 },
        { event: 5, points: 62, total_points: 361, rank: 2, rank_sort: 2, overall_rank: 110000, bank: 10, value: 1010, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 4 },
      ],
    },
    {
      name: "Charlie",
      teamName: "Charlie's Champions",
      gameweeks: [
        { event: 1, points: 82, total_points: 82, rank: 2, rank_sort: 2, overall_rank: 120000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 8 },
        { event: 2, points: 65, total_points: 147, rank: 3, rank_sort: 3, overall_rank: 120000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 10 },
        { event: 3, points: 69, total_points: 216, rank: 3, rank_sort: 3, overall_rank: 120000, bank: 0, value: 1000, event_transfers: 2, event_transfers_cost: 8, points_on_bench: 14 },
        { event: 4, points: 88, total_points: 304, rank: 2, rank_sort: 2, overall_rank: 120000, bank: 5, value: 1005, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 6 },
        { event: 5, points: 54, total_points: 358, rank: 3, rank_sort: 3, overall_rank: 120000, bank: 5, value: 1005, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 9 },
      ],
    },
  ];

  it("should calculate correct standings for a specific gameweek", () => {
    const result = calculateHistoricalStandings(mockManagers, 5);

    expect(result.gameweekNumber).toBe(5);
    expect(result.standings).toHaveLength(3);

    // Check rankings
    expect(result.standings[0].rank).toBe(1);
    expect(result.standings[0].managerName).toBe("Alice");
    expect(result.standings[1].rank).toBe(2);
    expect(result.standings[1].managerName).toBe("Bob");
    expect(result.standings[2].rank).toBe(3);
    expect(result.standings[2].managerName).toBe("Charlie");
  });

  it("should identify gameweek winner correctly", () => {
    const result = calculateHistoricalStandings(mockManagers, 5);

    // Alice scored 92 points (highest), so she should be gameweek winner
    expect(result.standings[0].isGameweekWinner).toBe(true);
    expect(result.standings[0].gameweekPoints).toBe(92);

    expect(result.standings[1].isGameweekWinner).toBe(false);
    expect(result.standings[2].isGameweekWinner).toBe(false);
  });

  it("should handle tied gameweek winners", () => {
    const tiedManagers: ManagerGameweekData[] = [
      {
        name: "Alice",
        teamName: "Alice's Aces",
        gameweeks: [
          { event: 1, points: 85, total_points: 85, rank: 1, rank_sort: 1, overall_rank: 125000, bank: 0, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 10 },
        ],
      },
      {
        name: "Bob",
        teamName: "Bob's Best",
        gameweeks: [
          { event: 1, points: 85, total_points: 85, rank: 1, rank_sort: 1, overall_rank: 110000, bank: 5, value: 1005, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 12 },
        ],
      },
    ];

    const result = calculateHistoricalStandings(tiedManagers, 1);

    // Both should be gameweek winners (tied on 85 points)
    expect(result.standings[0].isGameweekWinner).toBe(true);
    expect(result.standings[1].isGameweekWinner).toBe(true);
  });

  it("should calculate rank changes from previous gameweek", () => {
    const result = calculateHistoricalStandings(mockManagers, 5);

    // Alice: GW4 rank 3 → GW5 rank 1 (up 2)
    expect(result.standings[0].prevRank).toBe(3);
    expect(result.standings[0].rankChange).toBe(2);

    // Bob: GW4 rank 1 → GW5 rank 2 (down 1)
    expect(result.standings[1].prevRank).toBe(1);
    expect(result.standings[1].rankChange).toBe(-1);

    // Charlie: GW4 rank 2 → GW5 rank 3 (down 1)
    expect(result.standings[2].prevRank).toBe(2);
    expect(result.standings[2].rankChange).toBe(-1);
  });

  it("should handle first gameweek (no previous rank)", () => {
    const result = calculateHistoricalStandings(mockManagers, 1);

    // All should have null prevRank and 0 rankChange for GW1
    expect(result.standings[0].prevRank).toBeNull();
    expect(result.standings[0].rankChange).toBe(0);
    expect(result.standings[1].prevRank).toBeNull();
    expect(result.standings[1].rankChange).toBe(0);
    expect(result.standings[2].prevRank).toBeNull();
    expect(result.standings[2].rankChange).toBe(0);
  });

  it("should calculate statistics correctly", () => {
    const result = calculateHistoricalStandings(mockManagers, 5);

    // GW5: Alice 92, Bob 62, Charlie 54
    expect(result.averagePoints).toBeCloseTo(69.33, 1);
    expect(result.highestPoints).toBe(92);
    expect(result.lowestPoints).toBe(54);
  });

  it("should return total points at that gameweek", () => {
    const result = calculateHistoricalStandings(mockManagers, 3);

    // At GW3, standings sorted by rank (not total_points)
    expect(result.standings[0].totalPoints).toBe(217); // Bob (rank 1)
    expect(result.standings[1].totalPoints).toBe(215); // Alice (rank 2)
    expect(result.standings[2].totalPoints).toBe(216); // Charlie (rank 3)
  });

  it("should throw error if gameweek doesn't exist", () => {
    expect(() => {
      calculateHistoricalStandings(mockManagers, 99);
    }).toThrow("Gameweek 99 not found");
  });

  it("should handle empty managers array", () => {
    expect(() => {
      calculateHistoricalStandings([], 1);
    }).toThrow("No managers provided");
  });
});
