import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MiniGameHistory } from "./MiniGameHistory";
import type { PastRound } from "./MiniGameHistory";

const mockPastRounds: PastRound[] = [
  {
    round: {
      id: "r1",
      league_id: "123",
      gameweek: 10,
      game_index: 0,
      game_name: "Captain Clash",
      game_type: "h2h",
      reveal_time: "2026-03-08T12:00:00.000Z",
      status: "completed",
      seed: 12345,
    },
    pairings: [
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
    ],
    results: [],
  },
  {
    round: {
      id: "r2",
      league_id: "123",
      gameweek: 9,
      game_index: 5,
      game_name: "Differential King",
      game_type: "ranking",
      reveal_time: "2026-03-01T12:00:00.000Z",
      status: "completed",
      seed: 54321,
    },
    pairings: [],
    results: [
      { id: "res1", round: "r2", manager_id: 1, manager_name: "Alice", score: 20, rank: 1, points: 3 },
      { id: "res2", round: "r2", manager_id: 2, manager_name: "Bob", score: 10, rank: 2, points: 2 },
    ],
  },
];

describe("MiniGameHistory", () => {
  it("renders empty state when no past rounds", () => {
    render(<MiniGameHistory pastRounds={[]} />);
    expect(screen.getByText(/No past games yet/)).toBeInTheDocument();
  });

  it("renders past round summaries", () => {
    render(<MiniGameHistory pastRounds={mockPastRounds} />);
    expect(screen.getByText("Captain Clash")).toBeInTheDocument();
    expect(screen.getByText("Differential King")).toBeInTheDocument();
    expect(screen.getByText("GW10")).toBeInTheDocument();
    expect(screen.getByText("GW9")).toBeInTheDocument();
  });

  it("shows winners for H2H games", () => {
    render(<MiniGameHistory pastRounds={mockPastRounds} />);
    expect(screen.getByText(/Winners: Alice/)).toBeInTheDocument();
  });

  it("shows winner for ranking games", () => {
    render(<MiniGameHistory pastRounds={mockPastRounds} />);
    expect(screen.getByText(/Winner: Alice/)).toBeInTheDocument();
  });

  it("expands round on click to show details", () => {
    render(<MiniGameHistory pastRounds={mockPastRounds} />);

    // Click on the Captain Clash round
    fireEvent.click(screen.getByText("Captain Clash"));

    // Should show pairing details
    expect(screen.getByText(/Alice \(10\)/)).toBeInTheDocument();
    expect(screen.getByText(/Bob \(5\)/)).toBeInTheDocument();
  });
});
