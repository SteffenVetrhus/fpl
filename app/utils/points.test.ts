import { describe, it, expect } from "vitest";
import { calculateGameweekWinner } from "./points";

describe("calculateGameweekWinner", () => {
  it("should return the manager with the highest points", () => {
    const managers = [
      { id: 1, name: "Alice", points: 75 },
      { id: 2, name: "Bob", points: 92 },
      { id: 3, name: "Charlie", points: 68 },
    ];

    const winner = calculateGameweekWinner(managers);

    expect(winner).toEqual({ id: 2, name: "Bob", points: 92 });
  });

  it("should return the first manager when there's a tie", () => {
    const managers = [
      { id: 1, name: "Alice", points: 85 },
      { id: 2, name: "Bob", points: 85 },
    ];

    const winner = calculateGameweekWinner(managers);

    expect(winner).toEqual({ id: 1, name: "Alice", points: 85 });
  });

  it("should handle a single manager", () => {
    const managers = [{ id: 1, name: "Alice", points: 75 }];

    const winner = calculateGameweekWinner(managers);

    expect(winner).toEqual({ id: 1, name: "Alice", points: 75 });
  });
});
