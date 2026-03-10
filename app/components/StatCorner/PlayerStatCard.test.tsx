import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerStatCard } from "./PlayerStatCard";
import type { PlayerStatSummary } from "~/lib/stat-corner/types";

function makeSummary(overrides: Partial<PlayerStatSummary> = {}): PlayerStatSummary {
  return {
    player: {
      id: "p1",
      fpl_id: 1,
      name: "Salah",
      full_name: "Mohamed Salah",
      team: "LIV",
      position: "MID",
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
    ...overrides,
  };
}

describe("PlayerStatCard", () => {
  it("renders player name and team", () => {
    render(<PlayerStatCard player={makeSummary()} />);
    expect(screen.getByText("Salah")).toBeInTheDocument();
    expect(screen.getByText(/LIV/)).toBeInTheDocument();
  });

  it("shows clinical badge for positive overperformance", () => {
    render(<PlayerStatCard player={makeSummary({ overperformance: 2.5 })} />);
    expect(screen.getByText("Clinical")).toBeInTheDocument();
  });

  it("shows overperforming badge for negative overperformance", () => {
    render(<PlayerStatCard player={makeSummary({ overperformance: -2.5 })} />);
    expect(screen.getByText("Overperforming xG")).toBeInTheDocument();
  });

  it("shows xG and xA values", () => {
    render(<PlayerStatCard player={makeSummary()} />);
    expect(screen.getByText("8.50")).toBeInTheDocument(); // xG
    expect(screen.getByText("4.10")).toBeInTheDocument(); // xA
  });

  it("shows CBIT when available", () => {
    render(<PlayerStatCard player={makeSummary({ totalCbit: 45 })} />);
    expect(screen.getByText("CBIT")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("hides CBIT section when zero", () => {
    render(<PlayerStatCard player={makeSummary({ totalCbit: 0, totalSca: 0 })} />);
    expect(screen.queryByText("CBIT")).not.toBeInTheDocument();
  });
});
