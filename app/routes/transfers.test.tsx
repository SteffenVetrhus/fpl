import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import Transfers, { loader } from "./transfers";

vi.mock("~/lib/fpl-api/league-data");
vi.mock("~/config/env", () => ({
  getEnvConfig: () => ({ fplLeagueId: "1313411", pocketbaseUrl: "http://localhost:8090" }),
}));
vi.mock("~/lib/pocketbase/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: "user1",
    email: "alice@fpl.local",
    fplManagerId: 123456,
    playerName: "Alice Johnson",
    teamName: "Alice's Aces",
  }),
}));

describe("Transfers Route", () => {
  it("should render transfer tracker", async () => {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/transfers",
          Component: Transfers as any,
          loader: () => ({
            currentPlayerName: "Alice Johnson",
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
          Component: Transfers as any,
          loader: () => ({
            currentPlayerName: "Alice Johnson",
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
          Component: Transfers as any,
          loader: () => ({
            currentPlayerName: "Alice Johnson",
            transferSummary: [
              { managerName: "Alice Johnson", teamName: "Alice's Aces", transferCount: 2, lastTransferGW: 6 },
            ],
          }),
        },
      ],
      { initialEntries: ["/transfers"] }
    );

    render(<RouteStub initialEntries={["/transfers"]} />);

    await screen.findAllByText(/transfer/i, {}, { timeout: 3000 });

    // Navigation is now in the shared root layout; verify page-specific content
    expect(screen.getAllByText(/Transfer Market/i).length).toBeGreaterThan(0);
  });

  it("loader should fetch transfer data", async () => {
    const { fetchLeagueTransferSummaries } = await import(
      "~/lib/fpl-api/league-data"
    );

    vi.mocked(fetchLeagueTransferSummaries).mockResolvedValue([
      { managerName: "Alice Johnson", teamName: "Alice's Aces", transferCount: 2, lastTransferGW: 6 },
      { managerName: "Bob Smith", teamName: "Bob's Bangers", transferCount: 5, lastTransferGW: 8 },
    ]);

    const request = new Request("http://localhost:3000/transfers");
    const result = await loader({ request, params: {}, context: {} } as any);

    expect(fetchLeagueTransferSummaries).toHaveBeenCalledWith("1313411");
    expect(result.transferSummary).toHaveLength(2);
  });
});
