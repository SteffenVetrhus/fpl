import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameweekNavigator } from "./GameweekNavigator";

describe("GameweekNavigator", () => {
  const mockOnNavigate = vi.fn();

  afterEach(() => {
    mockOnNavigate.mockClear();
  });

  it("should render current gameweek number", () => {
    render(
      <GameweekNavigator
        currentGameweek={5}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText(/Gameweek 5/i)).toBeInTheDocument();
  });

  it("should show previous and next buttons", () => {
    render(
      <GameweekNavigator
        currentGameweek={5}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("should disable previous button on first gameweek", () => {
    render(
      <GameweekNavigator
        currentGameweek={1}
        availableGameweeks={[1, 2, 3]}
        onNavigate={mockOnNavigate}
      />
    );

    const prevButton = screen.getByRole("button", { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it("should disable next button on last gameweek", () => {
    render(
      <GameweekNavigator
        currentGameweek={6}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("should call onNavigate with previous gameweek when clicking previous", () => {
    render(
      <GameweekNavigator
        currentGameweek={5}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    const prevButton = screen.getByRole("button", { name: /previous/i });
    fireEvent.click(prevButton);

    expect(mockOnNavigate).toHaveBeenCalledWith(4);
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  it("should call onNavigate with next gameweek when clicking next", () => {
    render(
      <GameweekNavigator
        currentGameweek={5}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(mockOnNavigate).toHaveBeenCalledWith(6);
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  it("should show dropdown selector with all gameweeks", () => {
    render(
      <GameweekNavigator
        currentGameweek={5}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(6);
  });

  it("should call onNavigate when selecting different gameweek from dropdown", () => {
    render(
      <GameweekNavigator
        currentGameweek={5}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "3" } });

    expect(mockOnNavigate).toHaveBeenCalledWith(3);
  });

  it("should display selected gameweek in dropdown", () => {
    render(
      <GameweekNavigator
        currentGameweek={5}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("5");
  });

  it("should render with dark mode styling classes", () => {
    const { container } = render(
      <GameweekNavigator
        currentGameweek={5}
        availableGameweeks={[1, 2, 3, 4, 5, 6]}
        onNavigate={mockOnNavigate}
      />
    );

    // Check that dark mode classes are present
    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.className).toMatch(/dark:/);
    });
  });

  it("should handle empty available gameweeks gracefully", () => {
    render(
      <GameweekNavigator
        currentGameweek={1}
        availableGameweeks={[]}
        onNavigate={mockOnNavigate}
      />
    );

    // Should still render without crashing
    expect(screen.getByText(/Gameweek 1/i)).toBeInTheDocument();

    // Both buttons should be disabled
    const prevButton = screen.getByRole("button", { name: /previous/i });
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });
});
