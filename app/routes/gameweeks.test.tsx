import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import Gameweeks, { loader } from "./gameweeks";
import type { FPLManagerHistory, FPLLeagueStandings } from "~/lib/fpl-api/types";

vi.mock("~/lib/fpl-api/client");
vi.mock("~/config/env", () => ({
  getEnvConfig: () => ({ fplLeagueId: "1313411" }),
}));

describe("Gameweeks Route", () => {
  const mockLeagueData: FPLLeagueStandings = {
    league: {
      id: 1313411,
      name: "Test League",
      created: "2024-08-01T00:00:00Z",
      closed: false,
      max_entries: null,
      league_type: "x",
      scoring: "c",
      start_event: 1,
      code_privacy: "p",
      has_cup: false,
      cup_league: null,
      rank: null,
    },
    standings: {
      has_next: false,
      page: 1,
      results: [
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
      ],
    },
  };

  const mockHistory: FPLManagerHistory = {
    current: [
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
    ],
    past: [],
    chips: [],
  };

  it("should render gameweek history", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/gameweeks",
          Component: Gameweeks,
          loader: () => ({ managers: [{ name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistory.current }] }),
        },
      ],
      { initialEntries: ["/gameweeks"] }
    );

    render(<RouteStub initialEntries={["/gameweeks"]} />);

    // Should show gameweeks
    expect(
      await screen.findByText(/Gameweek 1/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Gameweek 2/i).length).toBeGreaterThan(0);
  });

  it("should display manager name", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/gameweeks",
          Component: Gameweeks,
          loader: () => ({ managers: [{ name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistory.current }] }),
        },
      ],
      { initialEntries: ["/gameweeks"] }
    );

    render(<RouteStub initialEntries={["/gameweeks"]} />);

    const aliceElements = await screen.findAllByText("Alice Johnson", {}, { timeout: 3000 });
    // Should show name in player selector dropdown and in the header
    expect(aliceElements.length).toBeGreaterThan(0);
    expect(screen.getByText("Alice's Aces")).toBeInTheDocument();
  });

  it("should show navigation back to home", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/gameweeks",
          Component: Gameweeks,
          loader: () => ({ managers: [{ name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistory.current }] }),
        },
      ],
      { initialEntries: ["/gameweeks"] }
    );

    render(<RouteStub initialEntries={["/gameweeks"]} />);

    await screen.findByText(/Gameweek 1/i, {}, { timeout: 3000 });

    expect(screen.getByText(/League Table/i)).toBeInTheDocument();
  });

  it("loader should fetch manager histories", async () => {
    const { fetchLeagueStandings, fetchManagerHistory } = await import(
      "~/lib/fpl-api/client"
    );

    vi.mocked(fetchLeagueStandings).mockResolvedValue(mockLeagueData);
    vi.mocked(fetchManagerHistory).mockResolvedValue(mockHistory);

    const result = await loader();

    expect(fetchLeagueStandings).toHaveBeenCalledWith("1313411");
    expect(fetchManagerHistory).toHaveBeenCalledWith("123456");
    expect(result.managers).toHaveLength(1);
    expect(result.managers[0].name).toBe("Alice Johnson");
  });

  it("should show player selector dropdown", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/gameweeks",
          Component: Gameweeks,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistory.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistory.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/gameweeks"] }
    );

    render(<RouteStub initialEntries={["/gameweeks"]} />);

    // Should show player selector
    expect(await screen.findByRole("combobox", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText(/select player/i)).toBeInTheDocument();
  });

  it("should show only the selected player's gameweeks", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/gameweeks",
          Component: Gameweeks,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistory.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: [] },
            ],
          }),
        },
      ],
      { initialEntries: ["/gameweeks"] }
    );

    render(<RouteStub initialEntries={["/gameweeks"]} />);

    // Should show Alice's name (first player by default)
    await screen.findByText(/Gameweek 1/i, {}, { timeout: 3000 });

    // Should show Alice's gameweeks
    const aliceHeaders = screen.getAllByText("Alice Johnson");
    expect(aliceHeaders.length).toBeGreaterThan(0);

    // Should NOT show Bob's name as a header (he's not selected)
    expect(screen.queryByText("Bob's Best")).not.toBeInTheDocument();
  });

  it("should respect URL player parameter", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/gameweeks",
          Component: Gameweeks,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: [] },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistory.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/gameweeks?player=Bob+Smith"] }
    );

    render(<RouteStub initialEntries={["/gameweeks?player=Bob+Smith"]} />);

    // Should show Bob's gameweeks based on URL param
    await screen.findByText(/Gameweek 1/i, {}, { timeout: 3000 });

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("Bob Smith");
  });
});
