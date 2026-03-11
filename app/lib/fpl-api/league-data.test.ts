import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchLeagueManagerHistories, fetchLeagueTransferSummaries } from "./league-data";
import type {
  FPLLeagueStandings,
  FPLManagerHistory,
  FPLTransfer,
} from "./types";

// Mock the client module
const mockFetchLeagueStandings = vi.fn();
const mockFetchManagerHistory = vi.fn();
const mockFetchManagerTransfers = vi.fn();

vi.mock("./client", () => ({
  fetchLeagueStandings: (...args: unknown[]) => mockFetchLeagueStandings(...args),
  fetchManagerHistory: (...args: unknown[]) => mockFetchManagerHistory(...args),
  fetchManagerTransfers: (...args: unknown[]) => mockFetchManagerTransfers(...args),
}));

/** Helper to create a mock standings result entry */
function makeManager(entry: number, playerName: string, entryName: string) {
  return {
    id: entry,
    event_total: 50,
    player_name: playerName,
    rank: 1,
    last_rank: 1,
    rank_sort: 1,
    total: 500,
    entry,
    entry_name: entryName,
  };
}

/** Helper to create mock league standings with N managers */
function makeLeagueStandings(count: number): FPLLeagueStandings {
  const results = Array.from({ length: count }, (_, i) =>
    makeManager(i + 1, `Player ${i + 1}`, `Team ${i + 1}`),
  );
  return {
    league: {
      id: 123,
      name: "Test League",
      created: "2024-08-01T00:00:00Z",
      closed: false,
      rank: null,
      max_entries: null,
      league_type: "x",
      scoring: "c",
      admin_entry: 1,
      start_event: 1,
      code_privacy: "p",
      has_cup: false,
      cup_league: null,
      cup_qualified: null,
    },
    standings: {
      has_next: false,
      page: 1,
      results,
    },
  };
}

/** Helper to create a mock manager history response */
function makeManagerHistory(managerId: number): FPLManagerHistory {
  return {
    current: [
      {
        event: 1,
        points: 60 + managerId,
        total_points: 60 + managerId,
        rank: 1,
        rank_sort: 1,
        overall_rank: 100000,
        bank: 0,
        value: 1000,
        event_transfers: 0,
        event_transfers_cost: 0,
        points_on_bench: 5,
      },
    ],
    past: [],
    chips: [],
  };
}

/** Helper to create mock transfers for a manager */
function makeTransfers(managerId: number, count: number): FPLTransfer[] {
  return Array.from({ length: count }, (_, i) => ({
    element_in: 100 + i,
    element_in_cost: 80,
    element_out: 200 + i,
    element_out_cost: 75,
    entry: managerId,
    event: i + 1,
    time: `2024-09-0${i + 1}T10:00:00Z`,
  }));
}

describe("league-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchLeagueManagerHistories", () => {
    it("should return correct data for a small league (under 10 members)", async () => {
      const standings = makeLeagueStandings(3);
      mockFetchLeagueStandings.mockResolvedValue(standings);
      mockFetchManagerHistory.mockImplementation((id: string) =>
        Promise.resolve(makeManagerHistory(Number(id))),
      );

      const result = await fetchLeagueManagerHistories("123");

      expect(mockFetchLeagueStandings).toHaveBeenCalledWith("123");
      expect(mockFetchManagerHistory).toHaveBeenCalledTimes(3);
      expect(mockFetchManagerHistory).toHaveBeenCalledWith("1");
      expect(mockFetchManagerHistory).toHaveBeenCalledWith("2");
      expect(mockFetchManagerHistory).toHaveBeenCalledWith("3");

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: "Player 1",
        teamName: "Team 1",
        gameweeks: makeManagerHistory(1).current,
      });
      expect(result[2]).toEqual({
        name: "Player 3",
        teamName: "Team 3",
        gameweeks: makeManagerHistory(3).current,
      });
    });

    it("should process managers in batches of 10", async () => {
      const standings = makeLeagueStandings(25);
      mockFetchLeagueStandings.mockResolvedValue(standings);

      // Track the order of concurrent calls per batch
      const callOrder: number[][] = [];
      let currentBatch: number[] = [];
      let pendingCount = 0;

      mockFetchManagerHistory.mockImplementation((id: string) => {
        currentBatch.push(Number(id));
        pendingCount++;

        return new Promise((resolve) => {
          // Simulate async resolution
          setTimeout(() => {
            pendingCount--;
            if (pendingCount === 0) {
              callOrder.push([...currentBatch]);
              currentBatch = [];
            }
            resolve(makeManagerHistory(Number(id)));
          }, 0);
        });
      });

      const result = await fetchLeagueManagerHistories("123");

      expect(result).toHaveLength(25);
      expect(mockFetchManagerHistory).toHaveBeenCalledTimes(25);

      // Verify batching: 3 batches (10 + 10 + 5)
      expect(callOrder).toHaveLength(3);
      expect(callOrder[0]).toHaveLength(10);
      expect(callOrder[1]).toHaveLength(10);
      expect(callOrder[2]).toHaveLength(5);
    });

    it("should handle a large league (50+ members) with proper batching", async () => {
      const standings = makeLeagueStandings(53);
      mockFetchLeagueStandings.mockResolvedValue(standings);

      let batchCount = 0;
      let concurrentCalls = 0;
      let maxConcurrent = 0;

      mockFetchManagerHistory.mockImplementation((id: string) => {
        concurrentCalls++;
        if (concurrentCalls > maxConcurrent) {
          maxConcurrent = concurrentCalls;
        }

        return new Promise((resolve) => {
          setTimeout(() => {
            concurrentCalls--;
            if (concurrentCalls === 0) {
              batchCount++;
            }
            resolve(makeManagerHistory(Number(id)));
          }, 0);
        });
      });

      const result = await fetchLeagueManagerHistories("123");

      expect(result).toHaveLength(53);
      expect(mockFetchManagerHistory).toHaveBeenCalledTimes(53);
      // 6 batches: 10 + 10 + 10 + 10 + 10 + 3
      expect(batchCount).toBe(6);
      // No more than 10 concurrent calls at any point
      expect(maxConcurrent).toBeLessThanOrEqual(10);
    });

    it("should return an empty array for a league with no members", async () => {
      const standings = makeLeagueStandings(0);
      mockFetchLeagueStandings.mockResolvedValue(standings);

      const result = await fetchLeagueManagerHistories("123");

      expect(result).toEqual([]);
      expect(mockFetchManagerHistory).not.toHaveBeenCalled();
    });

    it("should preserve order of managers across batches", async () => {
      const standings = makeLeagueStandings(15);
      mockFetchLeagueStandings.mockResolvedValue(standings);
      mockFetchManagerHistory.mockImplementation((id: string) =>
        Promise.resolve(makeManagerHistory(Number(id))),
      );

      const result = await fetchLeagueManagerHistories("123");

      // Results should maintain the original order from standings
      result.forEach((manager, index) => {
        expect(manager.name).toBe(`Player ${index + 1}`);
        expect(manager.teamName).toBe(`Team ${index + 1}`);
      });
    });
  });

  describe("fetchLeagueTransferSummaries", () => {
    it("should return correct transfer summaries for a small league", async () => {
      const standings = makeLeagueStandings(3);
      mockFetchLeagueStandings.mockResolvedValue(standings);
      mockFetchManagerTransfers.mockImplementation((id: string) =>
        Promise.resolve(makeTransfers(Number(id), 4)),
      );

      const result = await fetchLeagueTransferSummaries("456");

      expect(mockFetchLeagueStandings).toHaveBeenCalledWith("456");
      expect(mockFetchManagerTransfers).toHaveBeenCalledTimes(3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        managerName: "Player 1",
        teamName: "Team 1",
        transferCount: 4,
        lastTransferGW: 4,
      });
    });

    it("should handle managers with no transfers", async () => {
      const standings = makeLeagueStandings(2);
      mockFetchLeagueStandings.mockResolvedValue(standings);
      mockFetchManagerTransfers.mockResolvedValue([]);

      const result = await fetchLeagueTransferSummaries("123");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        managerName: "Player 1",
        teamName: "Team 1",
        transferCount: 0,
        lastTransferGW: 0,
      });
    });

    it("should compute lastTransferGW as the maximum event number", async () => {
      const standings = makeLeagueStandings(1);
      mockFetchLeagueStandings.mockResolvedValue(standings);
      mockFetchManagerTransfers.mockResolvedValue([
        { element_in: 10, element_in_cost: 50, element_out: 20, element_out_cost: 50, entry: 1, event: 3, time: "2024-09-01T10:00:00Z" },
        { element_in: 11, element_in_cost: 60, element_out: 21, element_out_cost: 55, entry: 1, event: 7, time: "2024-10-01T10:00:00Z" },
        { element_in: 12, element_in_cost: 70, element_out: 22, element_out_cost: 65, entry: 1, event: 5, time: "2024-09-15T10:00:00Z" },
      ]);

      const result = await fetchLeagueTransferSummaries("123");

      expect(result[0].lastTransferGW).toBe(7);
      expect(result[0].transferCount).toBe(3);
    });

    it("should process transfers in batches of 10 for large leagues", async () => {
      const standings = makeLeagueStandings(25);
      mockFetchLeagueStandings.mockResolvedValue(standings);

      const callOrder: number[][] = [];
      let currentBatch: number[] = [];
      let pendingCount = 0;

      mockFetchManagerTransfers.mockImplementation((id: string) => {
        currentBatch.push(Number(id));
        pendingCount++;

        return new Promise((resolve) => {
          setTimeout(() => {
            pendingCount--;
            if (pendingCount === 0) {
              callOrder.push([...currentBatch]);
              currentBatch = [];
            }
            resolve(makeTransfers(Number(id), 2));
          }, 0);
        });
      });

      const result = await fetchLeagueTransferSummaries("123");

      expect(result).toHaveLength(25);
      expect(mockFetchManagerTransfers).toHaveBeenCalledTimes(25);

      // 3 batches: 10 + 10 + 5
      expect(callOrder).toHaveLength(3);
      expect(callOrder[0]).toHaveLength(10);
      expect(callOrder[1]).toHaveLength(10);
      expect(callOrder[2]).toHaveLength(5);
    });

    it("should handle a large league (50+ members) with proper batching", async () => {
      const standings = makeLeagueStandings(50);
      mockFetchLeagueStandings.mockResolvedValue(standings);

      let batchCount = 0;
      let concurrentCalls = 0;
      let maxConcurrent = 0;

      mockFetchManagerTransfers.mockImplementation((id: string) => {
        concurrentCalls++;
        if (concurrentCalls > maxConcurrent) {
          maxConcurrent = concurrentCalls;
        }

        return new Promise((resolve) => {
          setTimeout(() => {
            concurrentCalls--;
            if (concurrentCalls === 0) {
              batchCount++;
            }
            resolve(makeTransfers(Number(id), 1));
          }, 0);
        });
      });

      const result = await fetchLeagueTransferSummaries("123");

      expect(result).toHaveLength(50);
      expect(mockFetchManagerTransfers).toHaveBeenCalledTimes(50);
      // 5 batches of 10
      expect(batchCount).toBe(5);
      expect(maxConcurrent).toBeLessThanOrEqual(10);
    });

    it("should preserve order of managers across batches", async () => {
      const standings = makeLeagueStandings(15);
      mockFetchLeagueStandings.mockResolvedValue(standings);
      mockFetchManagerTransfers.mockImplementation((id: string) =>
        Promise.resolve(makeTransfers(Number(id), 1)),
      );

      const result = await fetchLeagueTransferSummaries("123");

      result.forEach((summary, index) => {
        expect(summary.managerName).toBe(`Player ${index + 1}`);
        expect(summary.teamName).toBe(`Team ${index + 1}`);
      });
    });
  });
});
