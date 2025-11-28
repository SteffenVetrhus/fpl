import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayerSelector } from "./PlayerSelector";

describe("PlayerSelector", () => {
  const mockManagers = [
    { name: "Alice", teamName: "Alice's Team" },
    { name: "Bob", teamName: "Bob's Team" },
    { name: "Charlie", teamName: "Charlie's Team" },
  ];

  it("should render a dropdown with all managers", () => {
    const onSelect = vi.fn();
    render(
      <PlayerSelector
        managers={mockManagers}
        selectedManager="Alice"
        onSelect={onSelect}
      />
    );

    // Should show the select element
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    // Should have options for all managers
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Alice");
    expect(options[1]).toHaveTextContent("Bob");
    expect(options[2]).toHaveTextContent("Charlie");
  });

  it("should show the currently selected manager", () => {
    const onSelect = vi.fn();
    render(
      <PlayerSelector
        managers={mockManagers}
        selectedManager="Bob"
        onSelect={onSelect}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("Bob");
  });

  it("should call onSelect when a different manager is selected", () => {
    const onSelect = vi.fn();
    render(
      <PlayerSelector
        managers={mockManagers}
        selectedManager="Alice"
        onSelect={onSelect}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Charlie" } });

    expect(onSelect).toHaveBeenCalledWith("Charlie");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("should display a label for the selector", () => {
    const onSelect = vi.fn();
    render(
      <PlayerSelector
        managers={mockManagers}
        selectedManager="Alice"
        onSelect={onSelect}
      />
    );

    expect(screen.getByText(/select player/i)).toBeInTheDocument();
  });

  it("should handle empty managers array gracefully", () => {
    const onSelect = vi.fn();
    render(
      <PlayerSelector
        managers={[]}
        selectedManager=""
        onSelect={onSelect}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1); // Only the placeholder option
    expect(options[0]).toHaveTextContent("No players available");
  });

  it("should apply proper styling for light and dark modes", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PlayerSelector
        managers={mockManagers}
        selectedManager="Alice"
        onSelect={onSelect}
      />
    );

    const select = screen.getByRole("combobox");
    // Check for dark mode classes
    expect(select.className).toMatch(/dark:/);
  });

  it("should show manager count in label", () => {
    const onSelect = vi.fn();
    render(
      <PlayerSelector
        managers={mockManagers}
        selectedManager="Alice"
        onSelect={onSelect}
      />
    );

    // Should show count of managers
    expect(screen.getByText(/3.*players/i)).toBeInTheDocument();
  });
});
