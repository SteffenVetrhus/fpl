import { describe, it, expect } from "vitest";
import {
  calculateOverperformance,
  calculateLuckIndex,
  calculateDefensiveScore,
  calculateCreativityScore,
  calculateFormTrend,
  formatStat,
  classifyFinishing,
} from "./stat-corner";
import type { GameweekStat } from "~/lib/stat-corner/types";

describe("calculateOverperformance", () => {
  it("returns positive when goals exceed xG (clinical)", () => {
    expect(calculateOverperformance(10, 7.5)).toBe(2.5);
  });

  it("returns negative when goals are below xG (underperforming)", () => {
    expect(calculateOverperformance(3, 5.2)).toBeCloseTo(-2.2);
  });

  it("returns zero when goals equal xG", () => {
    expect(calculateOverperformance(5, 5)).toBe(0);
  });
});

describe("calculateLuckIndex", () => {
  it("returns positive when actual exceeds expected (lucky)", () => {
    expect(calculateLuckIndex(80, 65)).toBe(15);
  });

  it("returns negative when actual is below expected (unlucky)", () => {
    expect(calculateLuckIndex(40, 55)).toBe(-15);
  });
});

describe("calculateDefensiveScore", () => {
  it("calculates per-90 defensive actions", () => {
    // 20 CBIT + 10 recoveries over 450 mins = 30 / 5 nineties = 6.0
    expect(calculateDefensiveScore(20, 10, 450)).toBe(6);
  });

  it("returns zero for zero minutes", () => {
    expect(calculateDefensiveScore(10, 5, 0)).toBe(0);
  });

  it("handles partial matches", () => {
    // 5 CBIT + 3 recoveries over 45 mins = 8 / 0.5 = 16.0
    expect(calculateDefensiveScore(5, 3, 45)).toBe(16);
  });
});

describe("calculateCreativityScore", () => {
  it("calculates weighted per-90 creativity", () => {
    // xA=2, SCA=10, key_passes=15, 180 mins = 2 nineties
    // (2*3 + 10*0.5 + 15*0.3) / 2 = (6 + 5 + 4.5) / 2 = 7.75
    expect(calculateCreativityScore(2, 10, 15, 180)).toBe(7.75);
  });

  it("returns zero for zero minutes", () => {
    expect(calculateCreativityScore(1, 5, 10, 0)).toBe(0);
  });
});

describe("calculateFormTrend", () => {
  function makeStat(gw: number, fpl_points: number): GameweekStat {
    return {
      id: `stat-${gw}`,
      player: "player-1",
      gw,
      minutes: 90,
      goals: 0,
      assists: 0,
      xg: 0,
      npxg: 0,
      xa: 0,
      shots: 0,
      key_passes: 0,
      cbit: 0,
      ball_recoveries: 0,
      progressive_carries: 0,
      sca: 0,
      fpl_points,
    };
  }

  it("returns positive slope for improving form", () => {
    const stats = [
      makeStat(1, 2),
      makeStat(2, 4),
      makeStat(3, 6),
      makeStat(4, 8),
      makeStat(5, 10),
    ];
    expect(calculateFormTrend(stats)).toBe(2);
  });

  it("returns negative slope for declining form", () => {
    const stats = [
      makeStat(1, 10),
      makeStat(2, 8),
      makeStat(3, 6),
      makeStat(4, 4),
      makeStat(5, 2),
    ];
    expect(calculateFormTrend(stats)).toBe(-2);
  });

  it("returns zero for flat form", () => {
    const stats = [
      makeStat(1, 5),
      makeStat(2, 5),
      makeStat(3, 5),
    ];
    expect(calculateFormTrend(stats)).toBe(0);
  });

  it("returns zero for fewer than 2 data points", () => {
    expect(calculateFormTrend([makeStat(1, 5)])).toBe(0);
    expect(calculateFormTrend([])).toBe(0);
  });

  it("ignores gw=0 season aggregates", () => {
    const stats = [makeStat(0, 100), makeStat(1, 5)];
    expect(calculateFormTrend(stats)).toBe(0);
  });
});

describe("formatStat", () => {
  it("formats with default 2 decimal places", () => {
    expect(formatStat(3.14159)).toBe("3.14");
  });

  it("formats with custom decimal places", () => {
    expect(formatStat(3.14159, 1)).toBe("3.1");
  });
});

describe("classifyFinishing", () => {
  it("classifies positive overperformance as clinical", () => {
    expect(classifyFinishing(2.5)).toBe("clinical");
  });

  it("classifies negative overperformance as lucky", () => {
    expect(classifyFinishing(-1.5)).toBe("lucky");
  });

  it("classifies near-zero as average", () => {
    expect(classifyFinishing(0.5)).toBe("average");
    expect(classifyFinishing(-0.5)).toBe("average");
  });
});
