import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniGamePairings } from "./MiniGamePairings";
import type { MiniGamePairing, MiniGameResult } from "~/lib/mini-games/types";

const mockPairings: MiniGamePairing[] = [
  {
    id: "p1",
    round: "r1",
    manager_a_id: 1,
    manager_a_name: "Alice",
    manager_b_id: 2,
    manager_b_name: "Bob",
    score_a: 10,
    score_b: 5,
    points_a: 3,
    points_b: 0,
  },
  {
    id: "p2",
    round: "r1",
    manager_a_id: 3,
    manager_a_name: "Charlie",
    manager_b_id: 0,
    manager_b_name: "BYE",
    score_a: 8,
    score_b: 0,
    points_a: 1,
    points_b: 0,
  },
];

const mockResults: MiniGameResult[] = [
  { id: "r1", round: "round1", manager_id: 1, manager_name: "Alice", score: 100, rank: 1, points: 3 },
  { id: "r2", round: "round1", manager_id: 2, manager_name: "Bob", score: 80, rank: 2, points: 2 },
  { id: "r3", round: "round1", manager_id: 3, manager_name: "Charlie", score: 60, rank: 3, points: 1 },
];

describe("MiniGamePairings", () => {
  it("shows pending message when not completed", () => {
    render(
      <MiniGamePairings pairings={[]} results={[]} gameType="h2h" isCompleted={false} />
    );
    expect(screen.getByText(/Results will appear/)).toBeInTheDocument();
  });

  it("renders H2H pairings", () => {
    render(
      <MiniGamePairings pairings={mockPairings} results={[]} gameType="h2h" isCompleted={true} />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("BYE")).toBeInTheDocument();
  });

  it("renders ranking results", () => {
    render(
      <MiniGamePairings pairings={[]} results={mockResults} gameType="ranking" isCompleted={true} />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("shows bye indicator", () => {
    render(
      <MiniGamePairings pairings={mockPairings} results={[]} gameType="h2h" isCompleted={true} />
    );
    expect(screen.getByText("BYE")).toBeInTheDocument();
    expect(screen.getByText("Free round")).toBeInTheDocument();
  });
});
