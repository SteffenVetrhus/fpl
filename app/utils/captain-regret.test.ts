import { describe, it, expect } from "vitest";
import {
  calculateCaptainRegret,
  calculateSeasonCaptainRegret,
} from "./captain-regret";
import type { FPLGameweekPicks, FPLElement } from "~/lib/fpl-api/types";

describe("captain-regret utility", () => {
  const mockPlayers: FPLElement[] = [
    {
      id: 1,
      code: 1001,
      element_type: 4,
      first_name: "Erling",
      second_name: "Haaland",
      web_name: "Haaland",
      team: 1,
      team_code: 43,
      status: "a",
      now_cost: 145,
      cost_change_start: 0,
      cost_change_event: 0,
      total_points: 125,
      event_points: 12, // Captain scored 12 points
      points_per_game: "7.5",
      ep_this: "8.5",
      ep_next: "7.2",
      form: "7.5",
      selected_by_percent: "45.2",
      transfers_in: 150000,
      transfers_out: 50000,
      transfers_in_event: 15000,
      transfers_out_event: 5000,
      chance_of_playing_this_round: 100,
      chance_of_playing_next_round: 100,
      value_form: "0.5",
      value_season: "8.6",
      minutes: 720,
      goals_scored: 10,
      assists: 2,
      clean_sheets: 0,
      goals_conceded: 12,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 1,
      red_cards: 0,
      saves: 0,
      bonus: 15,
      bps: 450,
      influence: "650.5",
      creativity: "350.2",
      threat: "850.5",
      ict_index: "185.5",
      starts: 8,
      expected_goals: "9.5",
      expected_assists: "2.1",
      expected_goal_involvements: "11.6",
      expected_goals_conceded: "12.5",
      influence_rank: 5,
      influence_rank_type: 1,
      creativity_rank: 50,
      creativity_rank_type: 50,
      threat_rank: 1,
      threat_rank_type: 1,
      ict_index_rank: 2,
      ict_index_rank_type: 1,
      corners_and_indirect_freekicks_order: null,
      corners_and_indirect_freekicks_text: "",
      direct_freekicks_order: null,
      direct_freekicks_text: "",
      penalties_order: 1,
      penalties_text: "First",
      expected_goals_per_90: 1.2,
      saves_per_90: 0,
      expected_assists_per_90: 0.3,
      expected_goal_involvements_per_90: 1.5,
      expected_goals_conceded_per_90: 1.5,
      goals_conceded_per_90: 1.5,
      now_cost_rank: 1,
      now_cost_rank_type: 1,
      form_rank: 5,
      form_rank_type: 2,
      points_per_game_rank: 3,
      points_per_game_rank_type: 2,
      selected_rank: 1,
      selected_rank_type: 1,
      starts_per_90: 1.0,
      clean_sheets_per_90: 0.0,
    },
    {
      id: 2,
      code: 1002,
      element_type: 3,
      first_name: "Mohamed",
      second_name: "Salah",
      web_name: "Salah",
      team: 2,
      team_code: 14,
      status: "a",
      now_cost: 130,
      cost_change_start: 0,
      cost_change_event: 0,
      total_points: 135,
      event_points: 18, // Best player scored 18 points
      points_per_game: "8.2",
      ep_this: "9.0",
      ep_next: "8.5",
      form: "8.2",
      selected_by_percent: "52.1",
      transfers_in: 200000,
      transfers_out: 30000,
      transfers_in_event: 20000,
      transfers_out_event: 3000,
      chance_of_playing_this_round: 100,
      chance_of_playing_next_round: 100,
      value_form: "0.6",
      value_season: "10.4",
      minutes: 810,
      goals_scored: 12,
      assists: 8,
      clean_sheets: 3,
      goals_conceded: 8,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 0,
      red_cards: 0,
      saves: 0,
      bonus: 20,
      bps: 550,
      influence: "750.2",
      creativity: "650.5",
      threat: "750.2",
      ict_index: "215.0",
      starts: 9,
      expected_goals: "8.5",
      expected_assists: "6.5",
      expected_goal_involvements: "15.0",
      expected_goals_conceded: "8.0",
      influence_rank: 2,
      influence_rank_type: 1,
      creativity_rank: 5,
      creativity_rank_type: 5,
      threat_rank: 3,
      threat_rank_type: 1,
      ict_index_rank: 1,
      ict_index_rank_type: 1,
      corners_and_indirect_freekicks_order: 1,
      corners_and_indirect_freekicks_text: "First",
      direct_freekicks_order: null,
      direct_freekicks_text: "",
      penalties_order: 1,
      penalties_text: "First",
      expected_goals_per_90: 0.9,
      saves_per_90: 0,
      expected_assists_per_90: 0.7,
      expected_goal_involvements_per_90: 1.7,
      expected_goals_conceded_per_90: 0.9,
      goals_conceded_per_90: 0.9,
      now_cost_rank: 2,
      now_cost_rank_type: 1,
      form_rank: 1,
      form_rank_type: 1,
      points_per_game_rank: 1,
      points_per_game_rank_type: 1,
      selected_rank: 1,
      selected_rank_type: 1,
      starts_per_90: 1.0,
      clean_sheets_per_90: 0.3,
    },
    {
      id: 3,
      code: 1003,
      element_type: 2,
      first_name: "Trent",
      second_name: "Alexander-Arnold",
      web_name: "TAA",
      team: 2,
      team_code: 14,
      status: "a",
      now_cost: 75,
      cost_change_start: 0,
      cost_change_event: 0,
      total_points: 65,
      event_points: 6, // Bench player
      points_per_game: "4.5",
      ep_this: "5.0",
      ep_next: "4.5",
      form: "4.5",
      selected_by_percent: "25.5",
      transfers_in: 80000,
      transfers_out: 20000,
      transfers_in_event: 8000,
      transfers_out_event: 2000,
      chance_of_playing_this_round: 100,
      chance_of_playing_next_round: 100,
      value_form: "0.6",
      value_season: "8.7",
      minutes: 630,
      goals_scored: 2,
      assists: 5,
      clean_sheets: 4,
      goals_conceded: 6,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 2,
      red_cards: 0,
      saves: 0,
      bonus: 10,
      bps: 350,
      influence: "350.5",
      creativity: "550.2",
      threat: "250.5",
      ict_index: "115.0",
      starts: 7,
      expected_goals: "1.5",
      expected_assists: "4.5",
      expected_goal_involvements: "6.0",
      expected_goals_conceded: "6.5",
      influence_rank: 50,
      influence_rank_type: 10,
      creativity_rank: 10,
      creativity_rank_type: 10,
      threat_rank: 100,
      threat_rank_type: 10,
      ict_index_rank: 25,
      ict_index_rank_type: 10,
      corners_and_indirect_freekicks_order: 1,
      corners_and_indirect_freekicks_text: "First",
      direct_freekicks_order: null,
      direct_freekicks_text: "",
      penalties_order: null,
      penalties_text: "",
      expected_goals_per_90: 0.2,
      saves_per_90: 0,
      expected_assists_per_90: 0.6,
      expected_goal_involvements_per_90: 0.9,
      expected_goals_conceded_per_90: 0.9,
      goals_conceded_per_90: 0.9,
      now_cost_rank: 15,
      now_cost_rank_type: 2,
      form_rank: 30,
      form_rank_type: 2,
      points_per_game_rank: 35,
      points_per_game_rank_type: 2,
      selected_rank: 10,
      selected_rank_type: 2,
      starts_per_90: 1.0,
      clean_sheets_per_90: 0.6,
    },
  ];

  const mockPicks: FPLGameweekPicks = {
    active_chip: null,
    automatic_subs: [],
    entry_history: {
      event: 1,
      points: 75,
      total_points: 75,
      rank: 1,
      rank_sort: 1,
      overall_rank: 125000,
      bank: 0,
      value: 1000,
      event_transfers: 0,
      event_transfers_cost: 0,
      points_on_bench: 6,
    },
    picks: [
      {
        element: 1, // Haaland - captain (12 points)
        position: 1,
        multiplier: 2,
        is_captain: true,
        is_vice_captain: false,
      },
      {
        element: 2, // Salah - in starting XI (18 points)
        position: 2,
        multiplier: 1,
        is_captain: false,
        is_vice_captain: true,
      },
      {
        element: 3, // TAA - on bench
        position: 12,
        multiplier: 0,
        is_captain: false,
        is_vice_captain: false,
      },
    ],
  };

  describe("calculateCaptainRegret", () => {
    it("should calculate captain regret correctly", () => {
      const result = calculateCaptainRegret(mockPicks, mockPlayers);

      expect(result).toBeDefined();
      expect(result.captainId).toBe(1);
      expect(result.captainName).toBe("Haaland");
      expect(result.captainPoints).toBe(12);
      expect(result.captainTotalPoints).toBe(24); // 12 × 2
      expect(result.bestPlayerId).toBe(2); // Salah
      expect(result.bestPlayerName).toBe("Salah");
      expect(result.bestPlayerPoints).toBe(18);
      expect(result.bestPlayerPotentialPoints).toBe(36); // 18 × 2
      expect(result.regretPoints).toBe(12); // 36 - 24
    });

    it("should return zero regret when captain was the best choice", () => {
      const perfectPicks: FPLGameweekPicks = {
        ...mockPicks,
        picks: [
          {
            element: 2, // Salah as captain (best player)
            position: 1,
            multiplier: 2,
            is_captain: true,
            is_vice_captain: false,
          },
          {
            element: 1, // Haaland
            position: 2,
            multiplier: 1,
            is_captain: false,
            is_vice_captain: true,
          },
        ],
      };

      const result = calculateCaptainRegret(perfectPicks, mockPlayers);

      expect(result.regretPoints).toBe(0);
      expect(result.captainId).toBe(result.bestPlayerId);
    });

    it("should only consider starting XI players", () => {
      // Bench player should not be considered
      const result = calculateCaptainRegret(mockPicks, mockPlayers);

      // TAA (id: 3) is on bench (position 12), so shouldn't be best player
      expect(result.bestPlayerId).not.toBe(3);
    });

    it("should handle triple captain chip", () => {
      const tripleCaptainPicks: FPLGameweekPicks = {
        ...mockPicks,
        active_chip: "3xc",
        picks: [
          {
            element: 1, // Haaland - triple captain
            position: 1,
            multiplier: 3,
            is_captain: true,
            is_vice_captain: false,
          },
          {
            element: 2, // Salah
            position: 2,
            multiplier: 1,
            is_captain: false,
            is_vice_captain: true,
          },
        ],
      };

      const result = calculateCaptainRegret(tripleCaptainPicks, mockPlayers);

      expect(result.captainTotalPoints).toBe(36); // 12 × 3
      expect(result.bestPlayerPotentialPoints).toBe(54); // 18 × 3
      expect(result.regretPoints).toBe(18); // 54 - 36
    });

    it("should throw error when captain not found", () => {
      const noCaptainPicks: FPLGameweekPicks = {
        ...mockPicks,
        picks: [
          {
            element: 1,
            position: 1,
            multiplier: 1,
            is_captain: false,
            is_vice_captain: false,
          },
        ],
      };

      expect(() => calculateCaptainRegret(noCaptainPicks, mockPlayers)).toThrow(
        "Captain not found in picks"
      );
    });

    it("should throw error when captain player data not found", () => {
      const unknownCaptainPicks: FPLGameweekPicks = {
        ...mockPicks,
        picks: [
          {
            element: 999, // Unknown player
            position: 1,
            multiplier: 2,
            is_captain: true,
            is_vice_captain: false,
          },
        ],
      };

      expect(() =>
        calculateCaptainRegret(unknownCaptainPicks, mockPlayers)
      ).toThrow("Captain player data not found");
    });
  });

  describe("calculateSeasonCaptainRegret", () => {
    it("should calculate total season captain regret", () => {
      const gameweek1Data = {
        picks: mockPicks,
        players: mockPlayers,
      };

      const gameweek2Data = {
        picks: mockPicks,
        players: mockPlayers,
      };

      const result = calculateSeasonCaptainRegret([gameweek1Data, gameweek2Data]);

      expect(result.totalRegret).toBe(24); // 12 + 12
      expect(result.gameweeks).toHaveLength(2);
      expect(result.gameweeks[0].regretPoints).toBe(12);
      expect(result.gameweeks[1].regretPoints).toBe(12);
    });

    it("should handle mix of good and bad captain choices", () => {
      const goodChoice: FPLGameweekPicks = {
        ...mockPicks,
        picks: [
          {
            element: 2, // Salah - best player
            position: 1,
            multiplier: 2,
            is_captain: true,
            is_vice_captain: false,
          },
          {
            element: 1, // Haaland
            position: 2,
            multiplier: 1,
            is_captain: false,
            is_vice_captain: true,
          },
        ],
      };

      const result = calculateSeasonCaptainRegret([
        { picks: mockPicks, players: mockPlayers }, // 12 regret
        { picks: goodChoice, players: mockPlayers }, // 0 regret
      ]);

      expect(result.totalRegret).toBe(12);
      expect(result.gameweeks[0].regretPoints).toBe(12);
      expect(result.gameweeks[1].regretPoints).toBe(0);
    });

    it("should return zero for empty gameweeks", () => {
      const result = calculateSeasonCaptainRegret([]);

      expect(result.totalRegret).toBe(0);
      expect(result.gameweeks).toHaveLength(0);
    });
  });
});
