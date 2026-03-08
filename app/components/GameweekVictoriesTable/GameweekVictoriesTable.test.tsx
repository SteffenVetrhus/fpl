import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  GameweekVictoriesTable,
  calculateVictoryRecords,
} from "./GameweekVictoriesTable";
import type { FPLManagerGameweek } from "~/lib/fpl-api/types";
import type { ManagerGameweekData } from "~/utils/gameweek-winner";

describe("GameweekVictoriesTable", () => {
  const createGameweek = (
    event: number,
    points: number
  ): FPLManagerGameweek => ({
    event,
    points,
    total_points: points,
    rank: 1,
    rank_sort: 1,
    overall_rank: 125000,
    bank: 0,
    value: 1000,
    event_transfers: 0,
    event_transfers_cost: 0,
    points_on_bench: 5,
  });

  const managers: ManagerGameweekData[] = [
    {
      name: "Alice",
      gameweeks: [
        createGameweek(1, 92),
        createGameweek(2, 65),
        createGameweek(3, 78),
      ],
    },
    {
      name: "Bob",
      gameweeks: [
        createGameweek(1, 85),
        createGameweek(2, 72),
        createGameweek(3, 68),
      ],
    },
  ];

  it("should render all managers in the table", () => {
    render(
      <GameweekVictoriesTable managers={managers} onSelectPlayer={vi.fn()} />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("should display correct victory counts", () => {
    render(
      <GameweekVictoriesTable managers={managers} onSelectPlayer={vi.fn()} />
    );

    // Alice wins GW1 (92>85) and GW3 (78>68) = 2 victories
    // Bob wins GW2 (72>65) = 1 victory
    const rows = screen.getAllByRole("link");
    expect(rows[0]).toHaveTextContent("Alice");
    expect(rows[0]).toHaveTextContent("2");
    expect(rows[1]).toHaveTextContent("Bob");
    expect(rows[1]).toHaveTextContent("1");
  });

  it("should sort managers by victories descending", () => {
    render(
      <GameweekVictoriesTable managers={managers} onSelectPlayer={vi.fn()} />
    );

    const rows = screen.getAllByRole("link");
    // Alice (2 wins) should be first, Bob (1 win) second
    expect(rows[0]).toHaveTextContent("Alice");
    expect(rows[1]).toHaveTextContent("Bob");
  });

  it("should call onSelectPlayer when a row is clicked", async () => {
    const user = userEvent.setup();
    const onSelectPlayer = vi.fn();

    render(
      <GameweekVictoriesTable
        managers={managers}
        onSelectPlayer={onSelectPlayer}
      />
    );

    await user.click(screen.getByText("Alice"));
    expect(onSelectPlayer).toHaveBeenCalledWith("Alice");
  });

  it("should call onSelectPlayer on Enter key press", async () => {
    const user = userEvent.setup();
    const onSelectPlayer = vi.fn();

    render(
      <GameweekVictoriesTable
        managers={managers}
        onSelectPlayer={onSelectPlayer}
      />
    );

    const firstRow = screen.getAllByRole("link")[0];
    firstRow.focus();
    await user.keyboard("{Enter}");
    expect(onSelectPlayer).toHaveBeenCalledWith("Alice");
  });

  it("should render empty state when no managers", () => {
    render(
      <GameweekVictoriesTable managers={[]} onSelectPlayer={vi.fn()} />
    );

    expect(screen.getByText(/no gameweek data/i)).toBeInTheDocument();
  });

  it("should show the Gameweek Victories heading", () => {
    render(
      <GameweekVictoriesTable managers={managers} onSelectPlayer={vi.fn()} />
    );

    expect(screen.getByText("Gameweek Victories")).toBeInTheDocument();
  });

  it("should display position numbers", () => {
    render(
      <GameweekVictoriesTable managers={managers} onSelectPlayer={vi.fn()} />
    );

    const rows = screen.getAllByRole("link");
    expect(rows[0]).toHaveTextContent("1");
    expect(rows[1]).toHaveTextContent("2");
  });
});

describe("calculateVictoryRecords", () => {
  const createGameweek = (
    event: number,
    points: number,
    transferCost = 0
  ): FPLManagerGameweek => ({
    event,
    points,
    total_points: points,
    rank: 1,
    rank_sort: 1,
    overall_rank: 125000,
    bank: 0,
    value: 1000,
    event_transfers: transferCost > 0 ? 1 : 0,
    event_transfers_cost: transferCost,
    points_on_bench: 5,
  });

  it("should return empty array for no managers", () => {
    expect(calculateVictoryRecords([])).toEqual([]);
  });

  it("should count tied winners as victories for both players", () => {
    const tiedManagers: ManagerGameweekData[] = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 85), createGameweek(2, 70)],
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 85), createGameweek(2, 60)],
      },
    ];

    const records = calculateVictoryRecords(tiedManagers);
    // GW1: tie (85=85) -> both get victory. GW2: Alice wins (70>60)
    const alice = records.find((r) => r.name === "Alice")!;
    const bob = records.find((r) => r.name === "Bob")!;

    expect(alice.victories).toBe(2);
    expect(bob.victories).toBe(1);
  });

  it("should account for transfer costs in victory calculation", () => {
    const managersWithHits: ManagerGameweekData[] = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 80, 4)], // net: 76
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 78, 0)], // net: 78
      },
    ];

    const records = calculateVictoryRecords(managersWithHits);
    const bob = records.find((r) => r.name === "Bob")!;
    const alice = records.find((r) => r.name === "Alice")!;

    expect(bob.victories).toBe(1);
    expect(alice.victories).toBe(0);
  });

  it("should sort by victories descending", () => {
    const managers: ManagerGameweekData[] = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 50), createGameweek(2, 50)],
      },
      {
        name: "Bob",
        gameweeks: [createGameweek(1, 80), createGameweek(2, 80)],
      },
    ];

    const records = calculateVictoryRecords(managers);
    expect(records[0].name).toBe("Bob");
    expect(records[1].name).toBe("Alice");
  });

  it("should include gameweeksPlayed count", () => {
    const managers: ManagerGameweekData[] = [
      {
        name: "Alice",
        gameweeks: [createGameweek(1, 80), createGameweek(2, 70)],
      },
    ];

    const records = calculateVictoryRecords(managers);
    expect(records[0].gameweeksPlayed).toBe(2);
  });
});
