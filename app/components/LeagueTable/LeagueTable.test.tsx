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

  it("should render a single-manager league", () => {
    const singleManager: FPLStandingsResult[] = [
      {
        id: 1,
        event_total: 65,
        player_name: "Solo Player",
        rank: 1,
        last_rank: 1,
        rank_sort: 1,
        total: 900,
        entry: 111111,
        entry_name: "Lone Wolves",
      },
    ];

    render(<LeagueTable standings={singleManager} />);

    expect(screen.getAllByText("Solo Player").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lone Wolves").length).toBeGreaterThan(0);
    expect(screen.getByText("900")).toBeInTheDocument();
    // Header row + 1 data row
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("should render a large number of managers", () => {
    const largeStandings: FPLStandingsResult[] = Array.from(
      { length: 20 },
      (_, i) => ({
        id: i + 1,
        event_total: 80 - i,
        player_name: `Manager ${i + 1}`,
        rank: i + 1,
        last_rank: i + 1,
        rank_sort: i + 1,
        total: 2000 - i * 50,
        entry: 100000 + i,
        entry_name: `Team ${i + 1}`,
      })
    );

    render(<LeagueTable standings={largeStandings} />);

    // Header row + 20 data rows
    expect(screen.getAllByRole("row")).toHaveLength(21);
    // Verify first and last managers rendered
    expect(screen.getAllByText("Manager 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Manager 20").length).toBeGreaterThan(0);
  });

  it("should display managers in rank order", () => {
    render(<LeagueTable standings={mockStandings} />);

    const rows = screen.getAllByRole("row");
    // Skip header row (index 0)
    const dataRows = rows.slice(1);

    expect(dataRows[0].textContent).toContain("Alice Johnson");
    expect(dataRows[1].textContent).toContain("Bob Smith");
    expect(dataRows[2].textContent).toContain("Charlie Brown");
  });

  it("should handle event_total of 0 (blank gameweek)", () => {
    const blankGameweek: FPLStandingsResult[] = [
      {
        id: 1,
        event_total: 0,
        player_name: "Zero Points",
        rank: 1,
        last_rank: 1,
        rank_sort: 1,
        total: 500,
        entry: 999999,
        entry_name: "Blankers",
      },
    ];

    render(<LeagueTable standings={blankGameweek} />);

    expect(screen.getAllByText("Zero Points").length).toBeGreaterThan(0);
    // event_total of 0 should render
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("should handle identical ranks (two managers at rank 1)", () => {
    const tiedStandings: FPLStandingsResult[] = [
      {
        id: 1,
        event_total: 75,
        player_name: "Tied First A",
        rank: 1,
        last_rank: 1,
        rank_sort: 1,
        total: 1200,
        entry: 500001,
        entry_name: "Team Tied A",
      },
      {
        id: 2,
        event_total: 75,
        player_name: "Tied First B",
        rank: 1,
        last_rank: 2,
        rank_sort: 2,
        total: 1200,
        entry: 500002,
        entry_name: "Team Tied B",
      },
    ];

    render(<LeagueTable standings={tiedStandings} />);

    expect(screen.getAllByText("Tied First A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tied First B").length).toBeGreaterThan(0);
    // Both managers display rank 1
    const rankCells = screen.getAllByText("1");
    expect(rankCells.length).toBeGreaterThanOrEqual(2);
  });
});
