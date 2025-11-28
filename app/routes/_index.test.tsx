import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import Index, { loader } from "./_index";
import type { FPLLeagueStandings } from "~/lib/fpl-api/types";

vi.mock("~/lib/fpl-api/client");
vi.mock("~/config/env", () => ({
  getEnvConfig: () => ({ fplLeagueId: "1313411" }),
}));

describe("Home Route (_index)", () => {
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

  it("should render league table with data from loader", async () => {
    const RouteStub = createRoutesStub([
      {
        path: "/",
        Component: Index,
        loader: () => mockLeagueData,
      },
    ]);

    render(<RouteStub />);

    // Should show league standings (Alice appears in table and footer)
    const aliceElements = await screen.findAllByText(
      "Alice Johnson",
      {},
      { timeout: 3000 }
    );
    expect(aliceElements.length).toBeGreaterThan(0);

    // Bob Smith appears multiple times due to responsive design
    const bobElements = screen.getAllByText("Bob Smith");
    expect(bobElements.length).toBeGreaterThan(0);
  });

  it("should display league name in header", async () => {
    const RouteStub = createRoutesStub([
      {
        path: "/",
        Component: Index,
        loader: () => mockLeagueData,
      },
    ]);

    render(<RouteStub />);

    expect(
      await screen.findByText(/Test League/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });

  it("should show navigation links", async () => {
    const RouteStub = createRoutesStub([
      {
        path: "/",
        Component: Index,
        loader: () => mockLeagueData,
      },
    ]);

    render(<RouteStub />);

    // Wait for component to render
    await screen.findAllByText("Alice Johnson", {}, { timeout: 3000 });

    // Should have navigation
    expect(screen.getByText(/gameweek/i)).toBeInTheDocument();
    expect(screen.getByText(/transfer/i)).toBeInTheDocument();
  });

  it("loader should fetch league standings", async () => {
    const { fetchLeagueStandings } = await import("~/lib/fpl-api/client");

    vi.mocked(fetchLeagueStandings).mockResolvedValue(mockLeagueData);

    const result = await loader();

    expect(fetchLeagueStandings).toHaveBeenCalledWith("1313411");
    expect(result).toEqual(mockLeagueData);
  });

  it("loader should handle errors", async () => {
    const { fetchLeagueStandings } = await import("~/lib/fpl-api/client");

    vi.mocked(fetchLeagueStandings).mockRejectedValue(
      new Error("API Error")
    );

    await expect(loader()).rejects.toThrow("API Error");
  });
});
