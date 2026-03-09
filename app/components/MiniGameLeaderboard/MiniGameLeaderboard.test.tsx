import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniGameLeaderboard } from "./MiniGameLeaderboard";
import type { MiniGameLeaderboardEntry } from "~/lib/mini-games/types";

const mockEntries: MiniGameLeaderboardEntry[] = [
  { managerId: 1, managerName: "Alice", totalPoints: 12, wins: 3, draws: 1, losses: 1, gamesPlayed: 5 },
  { managerId: 2, managerName: "Bob", totalPoints: 8, wins: 2, draws: 0, losses: 3, gamesPlayed: 5 },
  { managerId: 3, managerName: "Charlie", totalPoints: 5, wins: 1, draws: 1, losses: 3, gamesPlayed: 5 },
];

describe("MiniGameLeaderboard", () => {
  it("renders empty state when no entries", () => {
    render(<MiniGameLeaderboard entries={[]} />);
    expect(screen.getByText(/No results yet/)).toBeInTheDocument();
  });

  it("renders all entries", () => {
    render(<MiniGameLeaderboard entries={mockEntries} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("shows crown for leader", () => {
    render(<MiniGameLeaderboard entries={mockEntries} />);
    expect(screen.getByText("👑")).toBeInTheDocument();
  });

  it("shows points", () => {
    render(<MiniGameLeaderboard entries={mockEntries} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("highlights current user", () => {
    const { container } = render(
      <MiniGameLeaderboard entries={mockEntries} currentManagerId={2} />
    );
    const bobRow = container.querySelector("tr.bg-purple-50");
    expect(bobRow).toBeTruthy();
  });
});
