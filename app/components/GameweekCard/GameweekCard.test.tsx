import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameweekCard } from "./GameweekCard";

describe("GameweekCard", () => {
  const mockGameweek = {
    event: 5,
    points: 87,
    total_points: 432,
    rank: 2,
    rank_sort: 2,
    overall_rank: 145000,
    bank: 15,
    value: 1020,
    event_transfers: 2,
    event_transfers_cost: 4,
    points_on_bench: 9,
  };

  it("should display gameweek number", () => {
    render(<GameweekCard gameweek={mockGameweek} />);
    expect(screen.getByText(/Gameweek 5/i)).toBeInTheDocument();
  });

  it("should display points prominently", () => {
    render(<GameweekCard gameweek={mockGameweek} />);
    expect(screen.getByText("87")).toBeInTheDocument();
  });

  it("should show rank", () => {
    render(<GameweekCard gameweek={mockGameweek} />);
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("should display bench points", () => {
    render(<GameweekCard gameweek={mockGameweek} />);
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("should show transfer information when transfers made", () => {
    render(<GameweekCard gameweek={mockGameweek} />);
    expect(screen.getByText(/2.*transfer/i)).toBeInTheDocument();
  });

  it("should highlight wins with special styling", () => {
    const winningGW = { ...mockGameweek, rank: 1 };
    const { container } = render(<GameweekCard gameweek={winningGW} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/winner|gold|yellow/i);
  });
});
