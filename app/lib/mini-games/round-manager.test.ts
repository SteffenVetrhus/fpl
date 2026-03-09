import { describe, it, expect, vi, beforeEach } from "vitest";
import { isRevealed } from "./round-manager";
import type { MiniGameRound } from "./types";

function makeRound(overrides: Partial<MiniGameRound> = {}): MiniGameRound {
  return {
    id: "round1",
    league_id: "123",
    gameweek: 10,
    game_index: 0,
    game_name: "Captain Clash",
    game_type: "h2h",
    reveal_time: "2026-03-08T12:00:00.000Z",
    status: "upcoming",
    seed: 12345,
    ...overrides,
  };
}

describe("isRevealed", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("returns true when current time is past reveal time", () => {
    const round = makeRound({
      reveal_time: "2020-01-01T00:00:00.000Z",
    });
    expect(isRevealed(round)).toBe(true);
  });

  it("returns false when current time is before reveal time", () => {
    const round = makeRound({
      reveal_time: "2099-12-31T23:59:59.000Z",
    });
    expect(isRevealed(round)).toBe(false);
  });
});
