import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { LandingPage } from "./LandingPage";

function renderWithRouter() {
  const router = createMemoryRouter(
    [{ path: "/", element: <LandingPage /> }],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("LandingPage", () => {
  it("renders the main headline", () => {
    renderWithRouter();
    expect(screen.getByText("FPL Tracker")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    renderWithRouter();
    expect(
      screen.getByText(/track your league, roast your rivals/i),
    ).toBeInTheDocument();
  });

  it("renders sign-in buttons linking to /login", () => {
    renderWithRouter();
    const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThanOrEqual(1);
    signInLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/login");
    });
  });

  it("renders core feature cards", () => {
    renderWithRouter();
    expect(screen.getByText("League Table")).toBeInTheDocument();
    expect(screen.getByText("Gameweek History")).toBeInTheDocument();
    expect(screen.getByText("Historical Standings")).toBeInTheDocument();
    expect(screen.getByText("Transfer Tracker")).toBeInTheDocument();
  });

  it("renders decision tool cards", () => {
    renderWithRouter();
    expect(screen.getAllByText("Captain Picker").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("AI Advisor").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Rival Spy").length).toBeGreaterThanOrEqual(1);
  });

  it("renders banter zone cards", () => {
    renderWithRouter();
    expect(screen.getAllByText("Captain Hindsight").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Transfer Clowns").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Banter Bot").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the stats section with feature counts", () => {
    renderWithRouter();
    expect(screen.getByText("30+")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  it("renders section headings", () => {
    renderWithRouter();
    expect(screen.getByText("Track everything")).toBeInTheDocument();
    expect(screen.getByText("Play smarter")).toBeInTheDocument();
    expect(screen.getByText("Roast your mates")).toBeInTheDocument();
    expect(screen.getByText("Ready to dominate?")).toBeInTheDocument();
  });
});
