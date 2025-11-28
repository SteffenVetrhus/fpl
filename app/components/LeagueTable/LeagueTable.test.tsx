import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeagueTable } from "./LeagueTable";
import type { FPLStandingsResult } from "~/lib/fpl-api/types";

describe("LeagueTable", () => {
  const mockStandings: FPLStandingsResult[] = [
    {
      id: 1,
      event_total: 92,
      player_name: "Alice Johnson",
      rank: 1,
      last_rank: 2,
      rank_sort: 1,
      total: 1543,
      entry: 123456,
      entry_name: "Alice's Aces",
    },
    {
      id: 2,
      event_total: 85,
      player_name: "Bob Smith",
      rank: 2,
      last_rank: 1,
      rank_sort: 2,
      total: 1521,
      entry: 234567,
      entry_name: "Bob's Bangers",
    },
    {
      id: 3,
      event_total: 78,
      player_name: "Charlie Brown",
      rank: 3,
      last_rank: 3,
      rank_sort: 3,
      total: 1498,
      entry: 345678,
      entry_name: "Charlie's Champions",
    },
  ];

  it("should render league table with all managers", () => {
    render(<LeagueTable standings={mockStandings} />);

    // Manager names appear multiple times (mobile + desktop + footer)
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Charlie Brown").length).toBeGreaterThan(0);
  });

  it("should display team names", () => {
    render(<LeagueTable standings={mockStandings} />);

    // Team names appear multiple times (mobile + desktop views)
    expect(screen.getAllByText("Alice's Aces").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob's Bangers").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Charlie's Champions").length).toBeGreaterThan(0);
  });

  it("should display total points for each manager", () => {
    render(<LeagueTable standings={mockStandings} />);

    expect(screen.getByText("1,543")).toBeInTheDocument();
    expect(screen.getByText("1,521")).toBeInTheDocument();
    expect(screen.getByText("1,498")).toBeInTheDocument();
  });

  it("should display current rank for each manager", () => {
    render(<LeagueTable standings={mockStandings} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should show rank change indicator (up arrow) when rank improved", () => {
    render(<LeagueTable standings={mockStandings} />);

    // Alice moved from 2 to 1 (up)
    const rows = screen.getAllByRole("row");
    const aliceRow = rows.find((row) =>
      row.textContent?.includes("Alice Johnson")
    );
    expect(aliceRow?.textContent).toMatch(/↑|▲/); // Up arrow
  });

  it("should show rank change indicator (down arrow) when rank worsened", () => {
    render(<LeagueTable standings={mockStandings} />);

    // Bob moved from 1 to 2 (down)
    const rows = screen.getAllByRole("row");
    const bobRow = rows.find((row) => row.textContent?.includes("Bob Smith"));
    expect(bobRow?.textContent).toMatch(/↓|▼/); // Down arrow
  });

  it("should show no change indicator when rank stayed same", () => {
    render(<LeagueTable standings={mockStandings} />);

    // Charlie stayed at 3
    const rows = screen.getAllByRole("row");
    const charlieRow = rows.find((row) =>
      row.textContent?.includes("Charlie Brown")
    );
    expect(charlieRow?.textContent).toMatch(/[-=]/); // Dash or equals
  });

  it("should highlight the league leader", () => {
    const { container } = render(<LeagueTable standings={mockStandings} />);

    // First row should have leader styling (yellow background)
    const firstRow = container.querySelector("tbody tr:first-child");
    const className = firstRow?.className || "";
    expect(className).toMatch(/bg-yellow|yellow/);
  });

  it("should display gameweek points", () => {
    render(<LeagueTable standings={mockStandings} />);

    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("78")).toBeInTheDocument();
  });

  it("should render empty state when no standings provided", () => {
    render(<LeagueTable standings={[]} />);

    expect(
      screen.getByText(/no managers|no data|empty/i)
    ).toBeInTheDocument();
  });

  it("should be accessible with proper table structure", () => {
    render(<LeagueTable standings={mockStandings} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // Header + 3 data rows
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
  });
});
