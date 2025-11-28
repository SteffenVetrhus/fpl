import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameweekHistory } from "./GameweekHistory";
import type { FPLManagerGameweek } from "~/lib/fpl-api/types";
import type { ManagerGameweekData } from "~/utils/gameweek-winner";

describe("GameweekHistory", () => {
  const createGameweek = (
    event: number,
    points: number,
    rank: number
  ): FPLManagerGameweek => ({
    event,
    points,
    total_points: points,
    rank,
    rank_sort: rank,
    overall_rank: 125000,
    bank: 0,
    value: 1000,
    event_transfers: event === 2 ? 1 : 0,
    event_transfers_cost: 0,
    points_on_bench: event === 1 ? 12 : event === 3 ? 15 : 8,
  });

  const aliceGameweeks = [
    createGameweek(1, 92, 1),  // Alice wins GW1 (92 > 85)
    createGameweek(2, 65, 2),  // Bob wins GW2 (72 > 65)
    createGameweek(3, 78, 1),  // Alice wins GW3 (78 > 68)
  ];

  const bobGameweeks = [
    createGameweek(1, 85, 2),
    createGameweek(2, 72, 1),
    createGameweek(3, 68, 3),
  ];

  const allManagers: ManagerGameweekData[] = [
    {
      name: "Alice",
      gameweeks: aliceGameweeks,
    },
    {
      name: "Bob",
      gameweeks: bobGameweeks,
    },
  ];

  it("should render all gameweeks", () => {
    render(
      <GameweekHistory
        gameweeks={aliceGameweeks}
        managerName="Alice"
        allManagers={allManagers}
      />
    );

    expect(screen.getByText(/Gameweek 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Gameweek 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Gameweek 3/i)).toBeInTheDocument();
  });

  it("should display points for each gameweek", () => {
    render(
      <GameweekHistory
        gameweeks={aliceGameweeks}
        managerName="Alice"
        allManagers={allManagers}
      />
    );

    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("78")).toBeInTheDocument();
  });

  it("should highlight correct gameweek winners based on points", () => {
    render(
      <GameweekHistory
        gameweeks={aliceGameweeks}
        managerName="Alice"
        allManagers={allManagers}
      />
    );

    // Alice won GW1 and GW3 (highest points), so 2 winner badges
    const winnerBadges = screen.getAllByText(/GAMEWEEK WINNER/i);
    expect(winnerBadges).toHaveLength(2);
  });

  it("should calculate wins correctly in summary", () => {
    render(
      <GameweekHistory
        gameweeks={aliceGameweeks}
        managerName="Alice"
        allManagers={allManagers}
      />
    );

    // Alice won 2 gameweeks (GW1: 92pts, GW3: 78pts)
    const summaryElements = screen.getAllByText((content, element) => {
      return (element?.textContent?.includes("3 gameweeks played") &&
              element?.textContent?.includes("2 wins")) ?? false;
    });
    expect(summaryElements[0]).toBeInTheDocument();
  });

  it("should not highlight non-winning gameweeks", () => {
    render(
      <GameweekHistory
        gameweeks={bobGameweeks}
        managerName="Bob"
        allManagers={allManagers}
      />
    );

    // Bob only won GW2, so should show 1 win
    const summaryElements = screen.getAllByText((content, element) => {
      return (element?.textContent?.includes("3 gameweeks played") &&
              element?.textContent?.includes("1 win")) ?? false;
    });
    expect(summaryElements[0]).toBeInTheDocument();
  });

  it("should show transfer information when transfers were made", () => {
    render(
      <GameweekHistory
        gameweeks={aliceGameweeks}
        managerName="Alice"
        allManagers={allManagers}
      />
    );

    // GW2 had 1 transfer
    expect(screen.getByText(/1.*transfer/i)).toBeInTheDocument();
  });

  it("should render empty state when no gameweeks", () => {
    render(
      <GameweekHistory
        gameweeks={[]}
        managerName="Alice"
        allManagers={allManagers}
      />
    );

    expect(
      screen.getByText(/no gameweeks|season hasn't started|time loop/i)
    ).toBeInTheDocument();
  });

  it("should display gameweeks in chronological order", () => {
    render(
      <GameweekHistory
        gameweeks={aliceGameweeks}
        managerName="Alice"
        allManagers={allManagers}
      />
    );

    const gameweekTexts = screen
      .getAllByText(/Gameweek \d+/i)
      .map((el) => el.textContent);

    expect(gameweekTexts[0]).toContain("1");
    expect(gameweekTexts[1]).toContain("2");
    expect(gameweekTexts[2]).toContain("3");
  });

  it("should handle tied winners", () => {
    const tiedManagers: ManagerGameweekData[] = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 85, 1)],
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 85, 1)], // Same points = tied
      },
    ];

    render(
      <GameweekHistory
        gameweeks={[createGameweek(1, 85, 1)]}
        managerName="Alice"
        allManagers={tiedManagers}
      />
    );

    // Alice tied for GW1, so should show as winner
    expect(screen.getByText(/GAMEWEEK WINNER/i)).toBeInTheDocument();
    const summaryElements = screen.getAllByText((content, element) => {
      return (element?.textContent?.includes("1 gameweeks played") &&
              element?.textContent?.includes("1 win")) ?? false;
    });
    expect(summaryElements[0]).toBeInTheDocument();
  });
});
