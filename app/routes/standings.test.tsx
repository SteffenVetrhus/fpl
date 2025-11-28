import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import Standings, { loader } from "./standings";
import type { FPLManagerHistory, FPLLeagueStandings } from "~/lib/fpl-api/types";

vi.mock("~/lib/fpl-api/client");
vi.mock("~/config/env", () => ({
  getEnvConfig: () => ({ fplLeagueId: "1313411" }),
}));

describe("Standings Route", () => {
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
          total: 363,
          entry: 123456,
          entry_name: "Alice's Aces",
        },
        {
          id: 2,
          event_total: 62,
          player_name: "Bob Smith",
          rank: 2,
          last_rank: 1,
          rank_sort: 2,
          total: 361,
          entry: 789012,
          entry_name: "Bob's Best",
        },
      ],
    },
  };

  const mockHistoryAlice: FPLManagerHistory = {
    current: [
      {
        event: 1,
        points: 65,
        total_points: 65,
        rank: 3,
        rank_sort: 3,
        overall_rank: 125000,
        bank: 0,
        value: 1000,
        event_transfers: 0,
        event_transfers_cost: 0,
        points_on_bench: 10,
      },
      {
        event: 2,
        points: 72,
        total_points: 137,
        rank: 2,
        rank_sort: 2,
        overall_rank: 125000,
        bank: 0,
        value: 1000,
        event_transfers: 1,
        event_transfers_cost: 4,
        points_on_bench: 8,
      },
      {
        event: 3,
        points: 92,
        total_points: 229,
        rank: 1,
        rank_sort: 1,
        overall_rank: 125000,
        bank: 0,
        value: 1000,
        event_transfers: 0,
        event_transfers_cost: 0,
        points_on_bench: 15,
      },
    ],
    past: [],
    chips: [],
  };

  const mockHistoryBob: FPLManagerHistory = {
    current: [
      {
        event: 1,
        points: 78,
        total_points: 78,
        rank: 1,
        rank_sort: 1,
        overall_rank: 110000,
        bank: 5,
        value: 1005,
        event_transfers: 0,
        event_transfers_cost: 0,
        points_on_bench: 12,
      },
      {
        event: 2,
        points: 68,
        total_points: 146,
        rank: 1,
        rank_sort: 1,
        overall_rank: 110000,
        bank: 5,
        value: 1005,
        event_transfers: 0,
        event_transfers_cost: 0,
        points_on_bench: 6,
      },
      {
        event: 3,
        points: 62,
        total_points: 208,
        rank: 2,
        rank_sort: 2,
        overall_rank: 110000,
        bank: 10,
        value: 1010,
        event_transfers: 1,
        event_transfers_cost: 4,
        points_on_bench: 4,
      },
    ],
    past: [],
    chips: [],
  };

  it("should render historical standings", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings"] }
    );

    render(<RouteStub initialEntries={["/standings"]} />);

    // Should show gameweek navigator
    expect(
      await screen.findByText(/Gameweek 3/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();

    // Should show standings table
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
  });

  it("should display gameweek navigator", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings"] }
    );

    render(<RouteStub initialEntries={["/standings"]} />);

    await screen.findByText(/Gameweek 3/i, {}, { timeout: 3000 });

    // Should show navigation buttons
    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();

    // Should show dropdown selector
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should show statistics panel", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings"] }
    );

    render(<RouteStub initialEntries={["/standings"]} />);

    await screen.findByText(/Gameweek 3/i, {}, { timeout: 3000 });

    // Should show statistics
    expect(screen.getByText(/average points/i)).toBeInTheDocument();
    expect(screen.getByText(/highest points/i)).toBeInTheDocument();
    expect(screen.getByText(/lowest points/i)).toBeInTheDocument();
  });

  it("should show gameweek winner with star emoji", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings"] }
    );

    render(<RouteStub initialEntries={["/standings"]} />);

    await screen.findByText(/Gameweek 3/i, {}, { timeout: 3000 });

    // Should show star emoji for gameweek winner (Alice with 92 points)
    const stars = screen.getAllByText("⭐");
    expect(stars.length).toBeGreaterThan(0);
  });

  it("should show rank change indicators", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings"] }
    );

    render(<RouteStub initialEntries={["/standings"]} />);

    await screen.findByText(/Gameweek 3/i, {}, { timeout: 3000 });

    // Should show rank change indicators (Alice improved from 2 to 1)
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("should show navigation back to home", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings"] }
    );

    render(<RouteStub initialEntries={["/standings"]} />);

    await screen.findByText(/Gameweek 3/i, {}, { timeout: 3000 });

    expect(screen.getByText(/League Table/i)).toBeInTheDocument();
  });

  it("loader should fetch manager histories", async () => {
    const { fetchLeagueStandings, fetchManagerHistory } = await import(
      "~/lib/fpl-api/client"
    );

    vi.mocked(fetchLeagueStandings).mockResolvedValue(mockLeagueData);
    vi.mocked(fetchManagerHistory)
      .mockResolvedValueOnce(mockHistoryAlice)
      .mockResolvedValueOnce(mockHistoryBob);

    const result = await loader();

    expect(fetchLeagueStandings).toHaveBeenCalledWith("1313411");
    expect(fetchManagerHistory).toHaveBeenCalledWith("123456");
    expect(fetchManagerHistory).toHaveBeenCalledWith("789012");
    expect(result.managers).toHaveLength(2);
    expect(result.managers[0].name).toBe("Alice Johnson");
    expect(result.managers[1].name).toBe("Bob Smith");
  });

  it("should default to most recent gameweek", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings"] }
    );

    render(<RouteStub initialEntries={["/standings"]} />);

    // Should show gameweek 3 by default (most recent)
    expect(
      await screen.findByText(/Gameweek 3/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();

    // Next button should be disabled (we're at the last gameweek)
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("should respect URL gameweek parameter", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings?gw=2"] }
    );

    render(<RouteStub initialEntries={["/standings?gw=2"]} />);

    // Should show gameweek 2 based on URL param
    expect(
      await screen.findByText(/Gameweek 2/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();

    // Should show GW2 winner (Alice with 72 points)
    const stars = screen.getAllByText("⭐");
    expect(stars.length).toBeGreaterThan(0);
  });

  it("should handle invalid URL gameweek parameter", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [
              { name: "Alice Johnson", teamName: "Alice's Aces", gameweeks: mockHistoryAlice.current },
              { name: "Bob Smith", teamName: "Bob's Best", gameweeks: mockHistoryBob.current },
            ],
          }),
        },
      ],
      { initialEntries: ["/standings?gw=999"] }
    );

    render(<RouteStub initialEntries={["/standings?gw=999"]} />);

    // Should fallback to most recent gameweek when invalid gw is provided
    expect(
      await screen.findByText(/Gameweek 3/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });

  it("should handle empty gameweeks gracefully", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/standings",
          Component: Standings,
          loader: () => ({
            managers: [],
          }),
        },
      ],
      { initialEntries: ["/standings"] }
    );

    render(<RouteStub initialEntries={["/standings"]} />);

    // Should show no data message
    expect(
      await screen.findByText(/no data available/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });
});
