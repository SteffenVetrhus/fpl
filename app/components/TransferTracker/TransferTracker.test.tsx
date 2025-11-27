import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferTracker } from "./TransferTracker";

describe("TransferTracker", () => {
  const mockTransfers = [
    {
      managerName: "Alice",
      teamName: "Alice's Aces",
      transferCount: 5,
      lastTransferGW: 15,
    },
    {
      managerName: "Bob",
      teamName: "Bob's Bangers",
      transferCount: 12,
      lastTransferGW: 14,
    },
    {
      managerName: "Charlie",
      teamName: "Charlie's Champions",
      transferCount: 3,
      lastTransferGW: 10,
    },
  ];

  it("should display all managers", () => {
    render(<TransferTracker transfers={mockTransfers} />);

    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("should show transfer counts", () => {
    render(<TransferTracker transfers={mockTransfers} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should highlight most active manager", () => {
    const { container } = render(<TransferTracker transfers={mockTransfers} />);

    // Bob has 12 transfers (most active)
    const bobElement = container.querySelector('[data-manager="Bob"]');
    const className = bobElement?.className || "";
    expect(className).toMatch(/orange|blue/);
  });

  it("should render empty state when no transfers", () => {
    render(<TransferTracker transfers={[]} />);

    expect(
      screen.getByText(/no transfer|no activity|quiet/i)
    ).toBeInTheDocument();
  });

  it("should show last transfer gameweek", () => {
    render(<TransferTracker transfers={mockTransfers} />);

    expect(screen.getByText(/GW.*15/)).toBeInTheDocument();
  });
});
