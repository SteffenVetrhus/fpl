import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBootstrapStatic, fetchLeagueStandings } from "./client";
import type { FPLBootstrapStatic, FPLLeagueStandings } from "./types";

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
});
