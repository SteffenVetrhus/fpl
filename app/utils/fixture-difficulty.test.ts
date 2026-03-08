import { describe, it, expect } from "vitest";
import {
  buildFixtureGrid,
  getDifficultyColor,
  countDoubleGameweeks,
  findBlankGameweeks,
} from "./fixture-difficulty";
import type { FPLFixture, FPLTeam } from "~/lib/fpl-api/types";

function makeTeam(id: number, name: string, shortName: string): FPLTeam {
  return {
    id,
    name,
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

describe("buildFixtureGrid", () => {
  const teams = [makeTeam(1, "Arsenal", "ARS"), makeTeam(2, "Chelsea", "CHE")];

  it("returns fixture grid sorted by average difficulty", () => {
    const fixtures = [
      makeFixture(1, 2, 1, 2, 2, 4), // Arsenal home (easy), Chelsea away (hard)
      makeFixture(2, 3, 2, 1, 2, 4), // Chelsea home (easy), Arsenal away (hard)
    ];

    const grid = buildFixtureGrid(fixtures, teams, 1, 2);

    expect(grid).toHaveLength(2);
    // Both teams have avg 3.0 (one easy, one hard)
    expect(grid[0].fixtures).toHaveLength(2);
    expect(grid[0].fixtures[0].gameweek).toBe(2);
    expect(grid[0].fixtures[1].gameweek).toBe(3);
  });

  it("handles blank gameweeks", () => {
    const fixtures: FPLFixture[] = []; // No fixtures at all

    const grid = buildFixtureGrid(fixtures, teams, 1, 2);

    expect(grid[0].fixtures[0].opponent).toBe("BLANK");
    expect(grid[0].fixtures[0].difficulty).toBe(0);
  });

  it("marks home/away correctly", () => {
    const fixtures = [makeFixture(1, 2, 1, 2, 2, 4)];

    const grid = buildFixtureGrid(fixtures, teams, 1, 1);
    const arsenal = grid.find((t) => t.teamId === 1)!;
    const chelsea = grid.find((t) => t.teamId === 2)!;

    expect(arsenal.fixtures[0].isHome).toBe(true);
    expect(arsenal.fixtures[0].opponentShort).toContain("(H)");
    expect(chelsea.fixtures[0].isHome).toBe(false);
    expect(chelsea.fixtures[0].opponentShort).toContain("(A)");
  });

  it("calculates average difficulty", () => {
    const fixtures = [
      makeFixture(1, 2, 1, 2, 2, 4),
      makeFixture(2, 3, 1, 2, 2, 4),
    ];

    const grid = buildFixtureGrid(fixtures, teams, 1, 2);
    const arsenal = grid.find((t) => t.teamId === 1)!;
    expect(arsenal.avgDifficulty).toBe(2); // Both home with diff 2
  });

  it("counts easy fixtures", () => {
    const fixtures = [
      makeFixture(1, 2, 1, 2, 1, 5),
      makeFixture(2, 3, 1, 2, 2, 4),
    ];

    const grid = buildFixtureGrid(fixtures, teams, 1, 2);
    const arsenal = grid.find((t) => t.teamId === 1)!;
    expect(arsenal.easyFixtureCount).toBe(2); // Both <= 2
  });
});

describe("getDifficultyColor", () => {
  it("returns correct colors for each difficulty level", () => {
    expect(getDifficultyColor(0)).toContain("gray");
    expect(getDifficultyColor(1)).toContain("emerald");
    expect(getDifficultyColor(2)).toContain("green");
    expect(getDifficultyColor(3)).toContain("amber");
    expect(getDifficultyColor(4)).toContain("red-400");
    expect(getDifficultyColor(5)).toContain("red-700");
  });
});

describe("countDoubleGameweeks", () => {
  it("detects double gameweeks", () => {
    const fixtures = [
      makeFixture(1, 5, 1, 2),
      makeFixture(2, 5, 1, 3), // Arsenal plays twice in GW5
    ];
    const teams = [makeTeam(1, "Arsenal", "ARS"), makeTeam(2, "Chelsea", "CHE"), makeTeam(3, "Spurs", "TOT")];

    expect(countDoubleGameweeks(fixtures, 1, 5, 5)).toBe(1);
    expect(countDoubleGameweeks(fixtures, 2, 5, 5)).toBe(0); // Chelsea only once
  });
});

describe("findBlankGameweeks", () => {
  it("detects blank gameweeks", () => {
    const fixtures = [makeFixture(1, 5, 2, 3)]; // Arsenal not playing in GW5

    expect(findBlankGameweeks(fixtures, 1, 5, 5)).toEqual([5]);
    expect(findBlankGameweeks(fixtures, 2, 5, 5)).toEqual([]); // Chelsea plays
  });
});
