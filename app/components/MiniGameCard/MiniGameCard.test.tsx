import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniGameCard } from "./MiniGameCard";
import type { MiniGameRound } from "~/lib/mini-games/types";

function makeRound(overrides: Partial<MiniGameRound> = {}): MiniGameRound {
  return {
    id: "round1",
    league_id: "123",
    gameweek: 10,
    game_index: 0,
    game_name: "Captain Clash",
    game_type: "h2h",
    reveal_time: "2026-03-08T12:00:00.000Z",
    status: "revealed",
    seed: 12345,
    ...overrides,
  };
}

describe("MiniGameCard", () => {
  it("renders empty state when no round", () => {
    render(<MiniGameCard round={null} isRevealed={false} />);
    expect(screen.getByText("No active mini game this gameweek")).toBeInTheDocument();
  });

  it("renders mystery state when not revealed", () => {
    const round = makeRound({ status: "upcoming" });
    render(<MiniGameCard round={round} isRevealed={false} countdownText="12h 30m" />);
    expect(screen.getByText("MYSTERY GAME")).toBeInTheDocument();
    expect(screen.getByText(/Reveals in 12h 30m/)).toBeInTheDocument();
  });

  it("renders revealed H2H game", () => {
    const round = makeRound();
    render(<MiniGameCard round={round} isRevealed={true} />);
    expect(screen.getByText("Captain Clash")).toBeInTheDocument();
    expect(screen.getByText("H2H")).toBeInTheDocument();
    expect(screen.getByText("Win = 3 pts")).toBeInTheDocument();
  });

  it("renders ranking game badge", () => {
    const round = makeRound({ game_index: 5, game_type: "ranking" });
    render(<MiniGameCard round={round} isRevealed={true} />);
    expect(screen.getByText("Ranking")).toBeInTheDocument();
    expect(screen.getByText("1st = 3 pts")).toBeInTheDocument();
  });

  it("shows completed status", () => {
    const round = makeRound({ status: "completed" });
    render(<MiniGameCard round={round} isRevealed={true} />);
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  it("shows gameweek number", () => {
    const round = makeRound({ gameweek: 15 });
    render(<MiniGameCard round={round} isRevealed={true} />);
    expect(screen.getByText("Gameweek 15")).toBeInTheDocument();
  });
});
