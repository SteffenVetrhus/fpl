import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricLeaderboard } from "./MetricLeaderboard";
import type { PlayerStatSummary } from "~/lib/stat-corner/types";

function makeSummary(
  overrides: Partial<PlayerStatSummary> & { name?: string; team?: string; position?: string },
): PlayerStatSummary {
  return {
    player: {
      id: overrides.name ?? "player-1",
      fpl_id: 1,
      name: overrides.name ?? "Salah",
      full_name: overrides.name ?? "Mohamed Salah",
      team: overrides.team ?? "LIV",
      position: (overrides.position as "FWD") ?? "FWD",
    },
    totalMinutes: 900,
    totalGoals: 10,
    totalAssists: 5,
    totalXg: 8.5,
    totalNpxg: 7.2,
    totalXa: 4.1,
    totalShots: 30,
    totalKeyPasses: 15,
    totalCbit: 0,
    totalBallRecoveries: 0,
    totalProgressiveCarries: 0,
    totalSca: 0,
    totalFplPoints: 95,
    overperformance: 1.5,
    xgPer90: 0.85,
    xaPer90: 0.41,
    cbitPer90: 0,
    gameweeks: 10,
    totalChancesCreated: 0,
    totalSuccessfulDribbles: 0,
    totalTouchesOppositionBox: 0,
    totalRecoveries: 0,
    totalDuelsWon: 0,
    totalAerialDuelsWon: 0,
    totalBigChancesMissed: 0,
    totalGoalsPrevented: 0,
    totalDefensiveContributions: 0,
    ...overrides,
  };
}

describe("MetricLeaderboard", () => {
  it("renders the title", () => {
    render(
      <MetricLeaderboard
        title="Top xG"
        metric="xg"
        players={[makeSummary({})]}
      />,
    );
    expect(screen.getByText("Top xG")).toBeInTheDocument();
  });

  it("renders player names", () => {
    render(
      <MetricLeaderboard
        title="Top xG"
        metric="xg"
        players={[
          makeSummary({ name: "Salah" }),
          makeSummary({ name: "Haaland" }),
        ]}
      />,
    );
    expect(screen.getByText("Salah")).toBeInTheDocument();
    expect(screen.getByText("Haaland")).toBeInTheDocument();
  });

  it("shows empty state when no players", () => {
    render(
      <MetricLeaderboard title="Top xG" metric="xg" players={[]} />,
    );
    expect(screen.getByText("No data available yet.")).toBeInTheDocument();
  });

  it("shows position badges", () => {
    render(
      <MetricLeaderboard
        title="Test"
        metric="xg"
        players={[makeSummary({ position: "MID" })]}
      />,
    );
    expect(screen.getByText("MID")).toBeInTheDocument();
  });

  it("uses custom formatter", () => {
    render(
      <MetricLeaderboard
        title="Goals - xG"
        metric="overperformance"
        players={[makeSummary({ overperformance: 2.5 })]}
        formatter={(v) => `+${v.toFixed(1)}`}
      />,
    );
    expect(screen.getByText("+2.5")).toBeInTheDocument();
  });
});
