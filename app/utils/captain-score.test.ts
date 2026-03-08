import { describe, it, expect } from "vitest";
import { rankCaptainCandidates } from "./captain-score";
import type { FPLElement, FPLFixture, FPLTeam } from "~/lib/fpl-api/types";

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

function makePlayer(overrides: Partial<FPLElement> & { id: number; team: number }): FPLElement {
  return {
    code: overrides.id,
    element_type: 3,
    first_name: "Test",
    second_name: "Player",
    web_name: `Player${overrides.id}`,
    team_code: overrides.team,
    status: "a",
    now_cost: 80,
    cost_change_start: 0,
    cost_change_event: 0,
    total_points: 100,
    event_points: 8,
    points_per_game: "5.0",
    ep_this: "5.0",
    ep_next: "5.0",
    form: "5.0",
    selected_by_percent: "15.0",
    transfers_in: 1000,
    transfers_out: 500,
    transfers_in_event: 100,
    transfers_out_event: 50,
    chance_of_playing_this_round: 100,
    chance_of_playing_next_round: 100,
    value_form: "1.0",
    value_season: "1.0",
    minutes: 900,
    goals_scored: 5,
    assists: 3,
    clean_sheets: 2,
    goals_conceded: 10,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 2,
    red_cards: 0,
    saves: 0,
    bonus: 10,
    bps: 200,
    influence: "200.0",
    creativity: "150.0",
    threat: "180.0",
    ict_index: "530.0",
    starts: 10,
    expected_goals: "3.5",
    expected_assists: "2.0",
    expected_goal_involvements: "5.5",
    expected_goals_conceded: "8.0",
    ...overrides,
  };
}

function makeFixture(
  id: number,
  gw: number,
  homeTeam: number,
  awayTeam: number,
  homeDiff: number = 3,
  awayDiff: number = 3
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
    team_h_difficulty: homeDiff,
    team_a_difficulty: awayDiff,
    pulse_id: id,
  };
}

describe("rankCaptainCandidates", () => {
  const teams = [makeTeam(1, "ARS"), makeTeam(2, "CHE"), makeTeam(3, "TOT")];

  it("returns candidates sorted by captain score", () => {
    const players = [
      makePlayer({ id: 1, team: 1, form: "8.0", ep_next: "7.0", expected_goal_involvements: "10.0" }),
      makePlayer({ id: 2, team: 2, form: "3.0", ep_next: "3.0", expected_goal_involvements: "2.0" }),
    ];
    const fixtures = [
      makeFixture(1, 10, 1, 3, 2, 4), // Arsenal home easy
      makeFixture(2, 10, 3, 2, 2, 4), // Chelsea away hard
    ];

    const result = rankCaptainCandidates(players, fixtures, teams, 10);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].playerId).toBe(1); // Higher form + easier fixture
    expect(result[0].captainScore).toBeGreaterThan(result[1]?.captainScore ?? 0);
  });

  it("filters out unavailable players", () => {
    const players = [
      makePlayer({ id: 1, team: 1, status: "u" }),
      makePlayer({ id: 2, team: 2 }),
    ];
    const fixtures = [
      makeFixture(1, 10, 1, 3, 2, 4),
      makeFixture(2, 10, 3, 2, 2, 4),
    ];

    const result = rankCaptainCandidates(players, fixtures, teams, 10);
    expect(result.find((c) => c.playerId === 1)).toBeUndefined();
  });

  it("filters out players with low chance of playing", () => {
    const players = [
      makePlayer({ id: 1, team: 1, chance_of_playing_next_round: 25 }),
      makePlayer({ id: 2, team: 2 }),
    ];
    const fixtures = [
      makeFixture(1, 10, 1, 3),
      makeFixture(2, 10, 3, 2),
    ];

    const result = rankCaptainCandidates(players, fixtures, teams, 10);
    expect(result.find((c) => c.playerId === 1)).toBeUndefined();
  });

  it("respects the limit parameter", () => {
    const players = Array.from({ length: 20 }, (_, i) =>
      makePlayer({ id: i + 1, team: (i % 3) + 1 })
    );
    const fixtures = [
      makeFixture(1, 10, 1, 2),
      makeFixture(2, 10, 2, 3),
      makeFixture(3, 10, 3, 1),
    ];

    const result = rankCaptainCandidates(players, fixtures, teams, 10, 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("shows fixture info in candidates", () => {
    const players = [makePlayer({ id: 1, team: 1 })];
    const fixtures = [makeFixture(1, 10, 1, 2, 2, 4)];

    const result = rankCaptainCandidates(players, fixtures, teams, 10);
    expect(result[0].isHome).toBe(true);
    expect(result[0].opponent).toContain("CHE");
    expect(result[0].fixtureDifficulty).toBe(2);
  });
});
