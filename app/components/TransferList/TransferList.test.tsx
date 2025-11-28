import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferList } from "./TransferList";

describe("TransferList", () => {
  const mockTransfers = [
    {
      gameweek: 5,
      managerName: "Alice",
      playerIn: "Salah",
      playerOut: "De Bruyne",
      cost: 0,
    },
    {
      gameweek: 5,
      managerName: "Bob",
      playerIn: "Haaland",
      playerOut: "Kane",
      cost: 4,
    },
    {
      gameweek: 6,
      managerName: "Alice",
      playerIn: "Son",
      playerOut: "Sterling",
      cost: 0,
    },
  ];

  it("should display all transfers", () => {
    render(<TransferList transfers={mockTransfers} />);

    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText(/Salah/i)).toBeInTheDocument();
    expect(screen.getByText(/Haaland/i)).toBeInTheDocument();
  });

  it("should show player in and player out", () => {
    render(<TransferList transfers={mockTransfers} />);

    expect(screen.getByText(/Salah/i)).toBeInTheDocument();
    expect(screen.getByText(/De Bruyne/i)).toBeInTheDocument();
  });

  it("should display gameweek information", () => {
    render(<TransferList transfers={mockTransfers} />);

    expect(screen.getAllByText(/GW.*5/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/GW.*6/).length).toBeGreaterThan(0);
  });

  it("should show point deductions for hits", () => {
    render(<TransferList transfers={mockTransfers} />);

    // Bob took a -4 hit
    expect(screen.getByText(/-4/)).toBeInTheDocument();
  });

  it("should render empty state when no transfers", () => {
    render(<TransferList transfers={[]} />);

    expect(
      screen.getByText(/crickets|nobody.*made.*transfer/i)
    ).toBeInTheDocument();
  });

  it("should group transfers by gameweek", () => {
    render(<TransferList transfers={mockTransfers} />);

    // Should show GW5 and GW6 headers
    const gwHeaders = screen.getAllByText(/GW/);
    expect(gwHeaders.length).toBeGreaterThan(1);
  });
});
