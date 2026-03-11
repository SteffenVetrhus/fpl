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
    render(<GameweekCard gameweek={mockGameweek} isWinner={false} />);
    expect(screen.getByText(/Gameweek 5/i)).toBeInTheDocument();
  });

  it("should display net points prominently (points minus transfer hits)", () => {
    render(<GameweekCard gameweek={mockGameweek} isWinner={false} />);
    // 87 points - 4 hit = 83 net
    expect(screen.getByText("83")).toBeInTheDocument();
  });

  it("should show breakdown when transfer hit taken", () => {
    render(<GameweekCard gameweek={mockGameweek} isWinner={false} />);
    // Shows "87 - 4 hit" breakdown
    expect(screen.getByText(/87 - 4 hit/)).toBeInTheDocument();
  });

  it("should not show breakdown when no transfer hit", () => {
    const noHitGameweek = { ...mockGameweek, event_transfers_cost: 0 };
    render(<GameweekCard gameweek={noHitGameweek} isWinner={false} />);
    expect(screen.queryByText(/hit/)).not.toBeInTheDocument();
  });

  it("should show rank", () => {
    render(<GameweekCard gameweek={mockGameweek} isWinner={false} />);
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("should display bench points", () => {
    render(<GameweekCard gameweek={mockGameweek} isWinner={false} />);
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("should show transfer information with hit cost when transfers made", () => {
    render(<GameweekCard gameweek={mockGameweek} isWinner={false} />);
    expect(screen.getByText(/2.*transfer.*-4.*hit/i)).toBeInTheDocument();
  });

  it("should highlight winner with special styling when isWinner is true", () => {
    const { container } = render(<GameweekCard gameweek={mockGameweek} isWinner={true} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/yellow/i);
  });

  it("should not highlight when isWinner is false", () => {
    const { container } = render(<GameweekCard gameweek={mockGameweek} isWinner={false} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toMatch(/yellow-400|yellow-50/i);
  });

  it("should show winner badge when isWinner is true", () => {
    render(<GameweekCard gameweek={mockGameweek} isWinner={true} />);

    expect(screen.getByText(/winner/i)).toBeInTheDocument();
  });

  it("should not show winner badge when isWinner is false", () => {
    render(<GameweekCard gameweek={mockGameweek} isWinner={false} />);

    expect(screen.queryByText(/gameweek winner/i)).not.toBeInTheDocument();
  });

  it("should display rank regardless of winner status", () => {
    const { rerender } = render(<GameweekCard gameweek={mockGameweek} isWinner={true} />);
    expect(screen.getByText("#2")).toBeInTheDocument();

    rerender(<GameweekCard gameweek={mockGameweek} isWinner={false} />);
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("should handle 0 points gameweek", () => {
    const zeroPointsGw = { ...mockGameweek, points: 0, event_transfers_cost: 0 };
    render(<GameweekCard gameweek={zeroPointsGw} isWinner={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("pts")).toBeInTheDocument();
  });

  it("should handle very large points value (999)", () => {
    const largePointsGw = { ...mockGameweek, points: 999, event_transfers_cost: 0 };
    render(<GameweekCard gameweek={largePointsGw} isWinner={false} />);
    expect(screen.getByText("999")).toBeInTheDocument();
  });

  it("should handle a large transfer hit (e.g. -20)", () => {
    const largeHitGw = { ...mockGameweek, points: 50, event_transfers: 6, event_transfers_cost: 20 };
    render(<GameweekCard gameweek={largeHitGw} isWinner={false} />);
    // Net points: 50 - 20 = 30
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText(/50 - 20 hit/)).toBeInTheDocument();
    expect(screen.getByText(/6 transfers.*-20.*hit/i)).toBeInTheDocument();
  });

  it("should handle bench points of 0", () => {
    const zeroBenchGw = { ...mockGameweek, points_on_bench: 0 };
    const { container } = render(<GameweekCard gameweek={zeroBenchGw} isWinner={false} />);
    const benchLabel = screen.getByText("Bench");
    const benchValue = benchLabel.parentElement?.querySelector(".font-bold");
    expect(benchValue).toHaveTextContent("0");
  });

  it("should handle GW1 (first gameweek boundary)", () => {
    const gw1 = { ...mockGameweek, event: 1 };
    render(<GameweekCard gameweek={gw1} isWinner={false} />);
    expect(screen.getByText(/Gameweek 1/i)).toBeInTheDocument();
  });

  it("should handle GW38 (last gameweek boundary)", () => {
    const gw38 = { ...mockGameweek, event: 38 };
    render(<GameweekCard gameweek={gw38} isWinner={false} />);
    expect(screen.getByText(/Gameweek 38/i)).toBeInTheDocument();
  });

  it("should display net points correctly when no transfers made", () => {
    const noTransfersGw = { ...mockGameweek, event_transfers: 0, event_transfers_cost: 0, points: 65 };
    render(<GameweekCard gameweek={noTransfersGw} isWinner={false} />);
    // Net points = 65 - 0 = 65
    expect(screen.getByText("65")).toBeInTheDocument();
    // No hit breakdown shown
    expect(screen.queryByText(/hit/)).not.toBeInTheDocument();
    // No transfer info shown
    expect(screen.queryByText(/transfer/i)).not.toBeInTheDocument();
  });
});
