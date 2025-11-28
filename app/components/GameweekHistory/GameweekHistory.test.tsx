import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameweekHistory } from "./GameweekHistory";
import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

describe("GameweekHistory", () => {
  const mockGameweeks: FPLManagerGameweek[] = [
    {
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
    {
      event: 2,
      points: 65,
      total_points: 157,
      rank: 3,
      rank_sort: 3,
      overall_rank: 135000,
      bank: 5,
      value: 1005,
      event_transfers: 1,
      event_transfers_cost: 0,
      points_on_bench: 8,
    },
    {
      event: 3,
      points: 78,
      total_points: 235,
      rank: 2,
      rank_sort: 2,
      overall_rank: 128000,
      bank: 10,
      value: 1010,
      event_transfers: 0,
      event_transfers_cost: 0,
      points_on_bench: 15,
    },
  ];

  it("should render all gameweeks", () => {
    render(<GameweekHistory gameweeks={mockGameweeks} />);

    expect(screen.getByText(/Gameweek 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Gameweek 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Gameweek 3/i)).toBeInTheDocument();
  });

  it("should display points for each gameweek", () => {
    render(<GameweekHistory gameweeks={mockGameweeks} />);

    // Points appear in both main display and total, so check they exist
    expect(screen.getAllByText("92").length).toBeGreaterThan(0);
    expect(screen.getAllByText("65").length).toBeGreaterThan(0);
    expect(screen.getAllByText("78").length).toBeGreaterThan(0);
  });

  it("should display rank for each gameweek", () => {
    render(<GameweekHistory gameweeks={mockGameweeks} />);

    // Should show ranks
    const ranks = screen.getAllByText(/rank|position/i);
    expect(ranks.length).toBeGreaterThan(0);
  });

  it("should highlight gameweek wins (rank 1)", () => {
    const { container } = render(<GameweekHistory gameweeks={mockGameweeks} />);

    // GW1 was a win (rank 1)
    const gw1Element = container.querySelector('[data-event="1"]');
    const className = gw1Element?.className || "";
    expect(className).toMatch(/winner|gold|yellow|win/);
  });

  it("should show transfer information when transfers were made", () => {
    render(<GameweekHistory gameweeks={mockGameweeks} />);

    // GW2 had 1 transfer
    const transferInfo = screen.getByText(/1.*transfer/i);
    expect(transferInfo).toBeInTheDocument();
  });

  it("should display cumulative total points", () => {
    render(<GameweekHistory gameweeks={mockGameweeks} />);

    // Check totals appear somewhere on page
    expect(screen.getAllByText("92").length).toBeGreaterThan(0); // After GW1
    expect(screen.getByText("157")).toBeInTheDocument(); // After GW2
    expect(screen.getByText("235")).toBeInTheDocument(); // After GW3
  });

  it("should render empty state when no gameweeks", () => {
    render(<GameweekHistory gameweeks={[]} />);

    expect(
      screen.getByText(/no gameweeks|season hasn't started|no data/i)
    ).toBeInTheDocument();
  });

  it("should show points on bench information", () => {
    render(<GameweekHistory gameweeks={mockGameweeks} />);

    // Should display bench points
    expect(screen.getByText("12")).toBeInTheDocument(); // GW1 bench
    expect(screen.getByText("15")).toBeInTheDocument(); // GW3 bench
  });

  it("should display gameweeks in chronological order", () => {
    render(<GameweekHistory gameweeks={mockGameweeks} />);

    const gameweekTexts = screen
      .getAllByText(/Gameweek \d+/i)
      .map((el) => el.textContent);

    expect(gameweekTexts[0]).toContain("1");
    expect(gameweekTexts[1]).toContain("2");
    expect(gameweekTexts[2]).toContain("3");
  });
});
