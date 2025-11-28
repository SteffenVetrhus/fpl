import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchBootstrapStatic,
  fetchLeagueStandings,
  fetchManagerHistory,
  fetchManagerTransfers,
  fetchManagerGameweekPicks,
} from "./client";
import type {
  FPLBootstrapStatic,
  FPLLeagueStandings,
  FPLManagerHistory,
  FPLManagerTransfers,
  FPLGameweekPicks,
} from "./types";

// Mock global fetch
global.fetch = vi.fn();

describe("FPL API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchBootstrapStatic", () => {
    it("should fetch and return bootstrap-static data", async () => {
      const mockData: Partial<FPLBootstrapStatic> = {
        events: [
          {
            id: 1,
            name: "Gameweek 1",
            deadline_time: "2024-08-16T17:30:00Z",
            finished: true,
            is_current: false,
            is_next: false,
            average_entry_score: 65,
            highest_score: 112,
          } as any,
        ],
        teams: [
          {
            id: 1,
            name: "Arsenal",
            short_name: "ARS",
            strength: 4,
          } as any,
        ],
        elements: [
          {
            id: 1,
            first_name: "Mohamed",
            second_name: "Salah",
            web_name: "Salah",
            team: 14,
            element_type: 3,
            now_cost: 130,
            total_points: 187,
          } as any,
        ],
        element_types: [
          {
            id: 1,
            singular_name: "Goalkeeper",
            plural_name: "Goalkeepers",
          } as any,
        ],
        total_players: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchBootstrapStatic();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://fantasy.premierleague.com/api/bootstrap-static/"
      );
      expect(result).toEqual(mockData);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].name).toBe("Gameweek 1");
    });

    it("should throw error when fetch fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(fetchBootstrapStatic()).rejects.toThrow(
        "Failed to fetch bootstrap-static: 500 Internal Server Error"
      );
    });

    it("should throw error when network request fails", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(fetchBootstrapStatic()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("fetchLeagueStandings", () => {
    it("should fetch and return league standings", async () => {
      const mockData: FPLLeagueStandings = {
        league: {
          id: 1313411,
          name: "Test League",
          created: "2024-08-01T10:00:00Z",
          closed: false,
          max_entries: null,
          league_type: "x",
          scoring: "c",
          start_event: 1,
          code_privacy: "p",
          has_cup: false,
          cup_league: null,
          rank: null,
        },
        standings: {
          has_next: false,
          page: 1,
          results: [
            {
              id: 1,
              event_total: 85,
              player_name: "John Doe",
              rank: 1,
              last_rank: 2,
              rank_sort: 1,
              total: 1543,
              entry: 789012,
              entry_name: "Team Awesome",
            },
            {
              id: 2,
              event_total: 78,
              player_name: "Jane Smith",
              rank: 2,
              last_rank: 1,
              rank_sort: 2,
              total: 1521,
              entry: 789013,
              entry_name: "Winning XI",
            },
          ],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchLeagueStandings("1313411");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://fantasy.premierleague.com/api/leagues-classic/1313411/standings/"
      );
      expect(result).toEqual(mockData);
      expect(result.standings.results).toHaveLength(2);
      expect(result.standings.results[0].rank).toBe(1);
    });

    it("should throw error for invalid league ID", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(fetchLeagueStandings("9999999")).rejects.toThrow(
        "Failed to fetch league standings: 404 Not Found"
      );
    });

    it("should handle pagination parameter", async () => {
      const mockData: FPLLeagueStandings = {
        league: {
          id: 1313411,
          name: "Test League",
        } as any,
        standings: {
          has_next: true,
          page: 2,
          results: [],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchLeagueStandings("1313411", 2);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://fantasy.premierleague.com/api/leagues-classic/1313411/standings/?page_standings=2"
      );
      expect(result.standings.page).toBe(2);
    });
  });

  describe("fetchManagerHistory", () => {
    it("should fetch and return manager history", async () => {
      const mockData: FPLManagerHistory = {
        current: [
          {
            event: 1,
            points: 65,
            total_points: 65,
            rank: 2345678,
            rank_sort: 2345678,
            overall_rank: 2345678,
            bank: 5,
            value: 1000,
            event_transfers: 0,
            event_transfers_cost: 0,
            points_on_bench: 12,
          },
          {
            event: 2,
            points: 78,
            total_points: 143,
            rank: 1234567,
            rank_sort: 1234567,
            overall_rank: 1234567,
            bank: 10,
            value: 1005,
            event_transfers: 1,
            event_transfers_cost: 0,
            points_on_bench: 8,
          },
        ],
        past: [],
        chips: [
          {
            name: "wildcard",
            time: "2024-09-15T10:30:00Z",
            event: 5,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchManagerHistory("789012");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://fantasy.premierleague.com/api/entry/789012/history/"
      );
      expect(result).toEqual(mockData);
      expect(result.current).toHaveLength(2);
      expect(result.current[0].points).toBe(65);
      expect(result.chips).toHaveLength(1);
    });

    it("should throw error for invalid manager ID", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(fetchManagerHistory("9999999")).rejects.toThrow(
        "Failed to fetch manager history: 404 Not Found"
      );
    });
  });

  describe("fetchManagerTransfers", () => {
    it("should fetch and return manager transfers", async () => {
      const mockData: FPLManagerTransfers = [
        {
          element_in: 234,
          element_in_cost: 85,
          element_out: 123,
          element_out_cost: 90,
          entry: 789012,
          event: 2,
          time: "2024-08-23T18:45:00Z",
        },
        {
          element_in: 456,
          element_in_cost: 105,
          element_out: 234,
          element_out_cost: 85,
          entry: 789012,
          event: 3,
          time: "2024-08-30T19:00:00Z",
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchManagerTransfers("789012");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://fantasy.premierleague.com/api/entry/789012/transfers/"
      );
      expect(result).toEqual(mockData);
      expect(result).toHaveLength(2);
      expect(result[0].element_in).toBe(234);
      expect(result[1].event).toBe(3);
    });

    it("should throw error for invalid manager ID", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(fetchManagerTransfers("9999999")).rejects.toThrow(
        "Failed to fetch manager transfers: 404 Not Found"
      );
    });

    it("should handle empty transfers array", async () => {
      const mockData: FPLManagerTransfers = [];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchManagerTransfers("789012");

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("fetchManagerGameweekPicks", () => {
    it("should fetch and return manager gameweek picks", async () => {
      const mockData: FPLGameweekPicks = {
        active_chip: null,
        automatic_subs: [],
        entry_history: {
          event: 1,
          points: 92,
          total_points: 92,
          rank: 1,
          rank_sort: 1,
          overall_rank: 125000,
          bank: 0,
          value: 1000,
          event_transfers: 0,
          event_transfers_cost: 0,
          points_on_bench: 12,
        },
        picks: [
          {
            element: 234,
            position: 1,
            multiplier: 1,
            is_captain: false,
            is_vice_captain: false,
          },
          {
            element: 345,
            position: 2,
            multiplier: 2,
            is_captain: true,
            is_vice_captain: false,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchManagerGameweekPicks("789012", 1);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://fantasy.premierleague.com/api/entry/789012/event/1/picks/"
      );
      expect(result).toEqual(mockData);
      expect(result.picks).toHaveLength(2);
      expect(result.picks[1].is_captain).toBe(true);
      expect(result.entry_history.points).toBe(92);
    });

    it("should throw error for invalid manager ID or gameweek", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(fetchManagerGameweekPicks("9999999", 1)).rejects.toThrow(
        "Failed to fetch manager picks: 404 Not Found"
      );
    });

    it("should handle active chip in picks data", async () => {
      const mockData: FPLGameweekPicks = {
        active_chip: "3xc",
        automatic_subs: [],
        entry_history: {
          event: 5,
          points: 134,
          total_points: 456,
          rank: 1,
          rank_sort: 1,
          overall_rank: 50000,
          bank: 5,
          value: 1020,
          event_transfers: 0,
          event_transfers_cost: 0,
          points_on_bench: 0,
        },
        picks: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchManagerGameweekPicks("789012", 5);

      expect(result.active_chip).toBe("3xc");
      expect(result.entry_history.event).toBe(5);
    });
  });
});
