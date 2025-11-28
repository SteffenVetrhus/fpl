import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import Transfers, { loader } from "./transfers";
import type { FPLLeagueStandings, FPLManagerTransfers } from "~/lib/fpl-api/types";

vi.mock("~/lib/fpl-api/client");
vi.mock("~/config/env", () => ({
  getEnvConfig: () => ({ FPL_LEAGUE_ID: "1313411" }),
}));

describe("Transfers Route", () => {
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
      ],
    },
  };

  const mockTransfers: FPLManagerTransfers = [
    {
      element_in: 123,
      element_in_cost: 100,
      element_out: 456,
      element_out_cost: 95,
      entry: 123456,
      event: 5,
      time: "2024-09-20T12:00:00Z",
    },
    {
      element_in: 789,
      element_in_cost: 120,
      element_out: 234,
      element_out_cost: 110,
      entry: 123456,
      event: 6,
      time: "2024-09-27T12:00:00Z",
    },
  ];

  it("should render transfer tracker", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/transfers",
          Component: Transfers,
          loader: () => ({
            transferSummary: [
              { managerName: "Alice Johnson", teamName: "Alice's Aces", transferCount: 2, lastTransferGW: 6 },
              { managerName: "Bob Smith", teamName: "Bob's Bangers", transferCount: 5, lastTransferGW: 8 },
            ],
          }),
        },
      ],
      { initialEntries: ["/transfers"] }
    );

    render(<RouteStub initialEntries={["/transfers"]} />);

    // Should show transfer activity heading (appears in header, nav, component)
    const headings = await screen.findAllByText(/transfer activity/i, {}, { timeout: 3000 });
    expect(headings.length).toBeGreaterThan(0);
  });

  it("should display manager transfer counts", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/transfers",
          Component: Transfers,
          loader: () => ({
            transferSummary: [
              { managerName: "Alice Johnson", teamName: "Alice's Aces", transferCount: 2, lastTransferGW: 6 },
              { managerName: "Bob Smith", teamName: "Bob's Bangers", transferCount: 5, lastTransferGW: 8 },
            ],
          }),
        },
      ],
      { initialEntries: ["/transfers"] }
    );

    render(<RouteStub initialEntries={["/transfers"]} />);

    await screen.findAllByText(/transfer activity/i, {}, { timeout: 3000 });

    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
  });

  it("should show navigation", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/transfers",
          Component: Transfers,
          loader: () => ({
            transferSummary: [
              { managerName: "Alice Johnson", teamName: "Alice's Aces", transferCount: 2, lastTransferGW: 6 },
            ],
          }),
        },
      ],
      { initialEntries: ["/transfers"] }
    );

    render(<RouteStub initialEntries={["/transfers"]} />);

    await screen.findAllByText(/transfer activity/i, {}, { timeout: 3000 });

    expect(screen.getByText(/League Table/i)).toBeInTheDocument();
    expect(screen.getByText(/Gameweek History/i)).toBeInTheDocument();
  });

  it("loader should fetch transfer data", async () => {
    const { fetchLeagueStandings, fetchManagerTransfers } = await import(
      "~/lib/fpl-api/client"
    );

    vi.mocked(fetchLeagueStandings).mockResolvedValue(mockLeagueData);
    vi.mocked(fetchManagerTransfers).mockResolvedValue(mockTransfers);

    const result = await loader();

    expect(fetchLeagueStandings).toHaveBeenCalledWith("1313411");
    expect(fetchManagerTransfers).toHaveBeenCalledWith("123456");
    expect(fetchManagerTransfers).toHaveBeenCalledWith("234567");
    expect(result.transferSummary).toHaveLength(2);
  });
});
