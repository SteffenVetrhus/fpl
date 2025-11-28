import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistoricalLeagueTable } from "./HistoricalLeagueTable";
import type { GameweekLeagueData } from "~/utils/historical-standings";

describe("HistoricalLeagueTable", () => {
  const mockData: GameweekLeagueData = {
    gameweekNumber: 5,
    averagePoints: 69.33,
    highestPoints: 92,
    lowestPoints: 54,
    standings: [
      {
        managerName: "Alice",
        teamName: "Alice's Aces",
        rank: 1,
        prevRank: 3,
        rankChange: 2,
        gameweekPoints: 92,
        totalPoints: 363,
        isGameweekWinner: true,
      },
      {
        managerName: "Bob",
        teamName: "Bob's Best",
        rank: 2,
        prevRank: 1,
        rankChange: -1,
        gameweekPoints: 62,
        totalPoints: 361,
        isGameweekWinner: false,
      },
      {
        managerName: "Charlie",
        teamName: "Charlie's Champions",
        rank: 3,
        prevRank: 2,
        rankChange: -1,
        gameweekPoints: 54,
        totalPoints: 358,
        isGameweekWinner: false,
      },
    ],
  };

  it("should render all managers in standings", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Charlie").length).toBeGreaterThan(0);
  });

  it("should display team names", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    expect(screen.getAllByText("Alice's Aces").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob's Best").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Charlie's Champions").length).toBeGreaterThan(0);
  });

  it("should display gameweek points for each manager", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    // Points appear in both table and stats panel (for 92 and 54)
    expect(screen.getAllByText("92").length).toBeGreaterThan(0);
    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getAllByText("54").length).toBeGreaterThan(0);
  });

  it("should display total points for each manager", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    expect(screen.getByText("363")).toBeInTheDocument();
    expect(screen.getByText("361")).toBeInTheDocument();
    expect(screen.getByText("358")).toBeInTheDocument();
  });

  it("should display ranks", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    const ranks = screen.getAllByText(/^[123]$/);
    expect(ranks.length).toBeGreaterThan(0);
  });

  it("should show rank change indicator (up arrow) when rank improved", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    // Alice improved from rank 3 to 1 (+2)
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("should show rank change indicator (down arrow) when rank worsened", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    // Bob dropped from rank 1 to 2 (-1)
    // Charlie dropped from rank 2 to 3 (-1)
    const negativeChanges = screen.getAllByText("-1");
    expect(negativeChanges.length).toBe(2);
  });

  it("should highlight gameweek winner", () => {
    const { container } = render(<HistoricalLeagueTable data={mockData} />);

    // Alice is the gameweek winner (92 points)
    // Find her row and check for winner styling
    const rows = container.querySelectorAll("tr");
    const aliceRow = Array.from(rows).find((row) =>
      row.textContent?.includes("Alice")
    );

    expect(aliceRow?.className).toMatch(/yellow/);
  });

  it("should show gameweek winner badge", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    // Alice has the star emoji as gameweek winner
    const stars = screen.getAllByText("⭐");
    expect(stars.length).toBeGreaterThan(0);
  });

  it("should display statistics panel", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    // Check that statistics are displayed
    expect(screen.getByText("69.3")).toBeInTheDocument();
    expect(screen.getAllByText("92").length).toBeGreaterThan(0);
    expect(screen.getAllByText("54").length).toBeGreaterThan(0);
  });

  it("should show crown emoji for rank 1", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    expect(screen.getByText("👑")).toBeInTheDocument();
  });

  it("should show medal emojis for top 3", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    expect(screen.getByText("👑")).toBeInTheDocument(); // 1st
    expect(screen.getByText("🥈")).toBeInTheDocument(); // 2nd
    expect(screen.getByText("🥉")).toBeInTheDocument(); // 3rd
  });

  it("should render empty state when no standings provided", () => {
    const emptyData: GameweekLeagueData = {
      gameweekNumber: 1,
      averagePoints: 0,
      highestPoints: 0,
      lowestPoints: 0,
      standings: [],
    };

    render(<HistoricalLeagueTable data={emptyData} />);

    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it("should be accessible with proper table structure", () => {
    render(<HistoricalLeagueTable data={mockData} />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);

    const rows = screen.getAllByRole("row");
    // 1 header row + 3 data rows = 4 total
    expect(rows.length).toBe(4);
  });

  it("should handle tied gameweek winners", () => {
    const tiedData: GameweekLeagueData = {
      gameweekNumber: 1,
      averagePoints: 85,
      highestPoints: 85,
      lowestPoints: 85,
      standings: [
        {
          managerName: "Alice",
          teamName: "Alice's Aces",
          rank: 1,
          prevRank: null,
          rankChange: 0,
          gameweekPoints: 85,
          totalPoints: 85,
          isGameweekWinner: true,
        },
        {
          managerName: "Bob",
          teamName: "Bob's Best",
          rank: 1,
          prevRank: null,
          rankChange: 0,
          gameweekPoints: 85,
          totalPoints: 85,
          isGameweekWinner: true,
        },
      ],
    };

    render(<HistoricalLeagueTable data={tiedData} />);

    // Both should have star emoji (2 winners × 2 views = 4 stars for mobile + desktop)
    const stars = screen.getAllByText("⭐");
    expect(stars.length).toBeGreaterThanOrEqual(2);
  });

  it("should show no change indicator for first gameweek", () => {
    const gw1Data: GameweekLeagueData = {
      gameweekNumber: 1,
      averagePoints: 70,
      highestPoints: 85,
      lowestPoints: 60,
      standings: [
        {
          managerName: "Alice",
          teamName: "Alice's Aces",
          rank: 1,
          prevRank: null,
          rankChange: 0,
          gameweekPoints: 85,
          totalPoints: 85,
          isGameweekWinner: true,
        },
      ],
    };

    render(<HistoricalLeagueTable data={gw1Data} />);

    // Should show dash for no previous rank
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
