import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import StrategyCornerPage from "./strategy-corner";

describe("Strategy Corner Route", () => {
  function renderPage() {
    const RouteStub = createRoutesStub(
      [
        {
          path: "/strategy-corner",
          Component: StrategyCornerPage,
        },
      ],
      { initialEntries: ["/strategy-corner"] }
    );

    return render(<RouteStub initialEntries={["/strategy-corner"]} />);
  }

  it("should render the hero section with title", async () => {
    renderPage();
    expect(
      await screen.findByText("Strategy Corner", {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });

  it("should render all four strategy cards", async () => {
    renderPage();
    await screen.findByText("Strategy Corner", {}, { timeout: 3000 });

    expect(screen.getByText(/The Template/)).toBeInTheDocument();
    expect(screen.getByText(/The Reverse/)).toBeInTheDocument();
    expect(screen.getByText(/No Wildcard/)).toBeInTheDocument();
    expect(screen.getByText(/The Unprepared/)).toBeInTheDocument();
  });

  it("should expand strategy 1 by default", async () => {
    renderPage();
    await screen.findByText("Strategy Corner", {}, { timeout: 3000 });

    // Strategy 1 should be expanded showing its "How to play" steps
    expect(screen.getByText(/Wildcard in GW32 picking as many DGW33/)).toBeInTheDocument();
  });

  it("should toggle strategy expansion on click", async () => {
    renderPage();
    await screen.findByText("Strategy Corner", {}, { timeout: 3000 });

    // Strategy 2 content should not be visible initially
    expect(screen.queryByText(/Flip the script/)).toBeInTheDocument(); // tagline visible
    expect(screen.queryByText(/Wildcard in either GW32 or GW34/)).not.toBeInTheDocument();

    // Click strategy 2 to expand it
    fireEvent.click(screen.getByText(/The Reverse/));

    // Strategy 2 content should now be visible
    expect(screen.getByText(/Wildcard in either GW32 or GW34/)).toBeInTheDocument();

    // Strategy 1 content should now be collapsed
    expect(screen.queryByText(/Wildcard in GW32 picking as many DGW33/)).not.toBeInTheDocument();
  });

  it("should render the fixture grid", async () => {
    renderPage();
    await screen.findByText("Strategy Corner", {}, { timeout: 3000 });

    expect(screen.getByText("Fixture Grid")).toBeInTheDocument();
    // Check some teams appear in the grid (using getAllByText since teams appear in strategy badges too)
    expect(screen.getAllByText("ARS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("LIV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MCI").length).toBeGreaterThan(0);
  });

  it("should show chip badges in expanded strategy", async () => {
    renderPage();
    await screen.findByText("Strategy Corner", {}, { timeout: 3000 });

    // Strategy 1 is expanded, should show chip schedule
    expect(screen.getByText("Chip Schedule")).toBeInTheDocument();
    // Chip abbreviations should be visible
    expect(screen.getByText("WC")).toBeInTheDocument();
    expect(screen.getByText("BB")).toBeInTheDocument();
    expect(screen.getByText("FH")).toBeInTheDocument();
    expect(screen.getByText("TC")).toBeInTheDocument();
  });

  it("should show team include/exclude badges", async () => {
    renderPage();
    await screen.findByText("Strategy Corner", {}, { timeout: 3000 });

    // Strategy 1 expanded - should show Wildcard Players section
    expect(screen.getByText("Wildcard Players")).toBeInTheDocument();
    expect(screen.getByText("Free Hit Players")).toBeInTheDocument();
  });

  it("should show 'works if' conditions", async () => {
    renderPage();
    await screen.findByText("Strategy Corner", {}, { timeout: 3000 });

    expect(screen.getByText(/minimise your risk/)).toBeInTheDocument();
  });

  it("should collapse an expanded strategy when clicked again", async () => {
    renderPage();
    await screen.findByText("Strategy Corner", {}, { timeout: 3000 });

    // Strategy 1 is expanded
    expect(screen.getByText(/Wildcard in GW32 picking as many DGW33/)).toBeInTheDocument();

    // Click strategy 1 to collapse it
    fireEvent.click(screen.getByText(/The Template/));

    // Content should be hidden
    expect(screen.queryByText(/Wildcard in GW32 picking as many DGW33/)).not.toBeInTheDocument();
  });
});
