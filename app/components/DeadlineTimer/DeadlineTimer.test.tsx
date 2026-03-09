import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { DeadlineTimer } from "./index";

describe("DeadlineTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the gameweek name", () => {
    render(
      <DeadlineTimer
        deadlineTime="2025-03-03T12:00:00Z"
        gameweekName="Gameweek 29"
      />
    );
    expect(screen.getByText("Gameweek 29")).toBeInTheDocument();
  });

  it("should display countdown with days when more than 24h away", () => {
    render(
      <DeadlineTimer
        deadlineTime="2025-03-03T12:00:00Z"
        gameweekName="Gameweek 29"
      />
    );
    const countdown = screen.getByTestId("deadline-countdown");
    expect(countdown.textContent).toContain("2d");
    expect(countdown.textContent).toContain("00:00:00");
  });

  it("should display countdown without days when less than 24h away", () => {
    render(
      <DeadlineTimer
        deadlineTime="2025-03-01T18:30:00Z"
        gameweekName="Gameweek 29"
      />
    );
    const countdown = screen.getByTestId("deadline-countdown");
    expect(countdown.textContent).not.toContain("d");
    expect(countdown.textContent).toContain("06:30:00");
  });

  it("should show 'Deadline passed' when deadline is in the past", () => {
    render(
      <DeadlineTimer
        deadlineTime="2025-02-28T12:00:00Z"
        gameweekName="Gameweek 28"
      />
    );
    expect(screen.getByTestId("deadline-expired")).toHaveTextContent("Deadline passed");
  });

  it("should add urgent class when less than 2 hours remain", () => {
    render(
      <DeadlineTimer
        deadlineTime="2025-03-01T13:30:00Z"
        gameweekName="Gameweek 29"
      />
    );
    const timer = screen.getByTestId("deadline-timer");
    expect(timer.className).toContain("kit-deadline-urgent");
  });

  it("should not add urgent class when more than 2 hours remain", () => {
    render(
      <DeadlineTimer
        deadlineTime="2025-03-01T15:00:00Z"
        gameweekName="Gameweek 29"
      />
    );
    const timer = screen.getByTestId("deadline-timer");
    expect(timer.className).not.toContain("kit-deadline-urgent");
  });

  it("should update countdown every second", () => {
    render(
      <DeadlineTimer
        deadlineTime="2025-03-01T12:00:05Z"
        gameweekName="Gameweek 29"
      />
    );

    const countdown = screen.getByTestId("deadline-countdown");
    expect(countdown.textContent).toContain("00:00:05");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(countdown.textContent).toContain("00:00:04");
  });

  it("should stop counting at zero and show expired message", () => {
    render(
      <DeadlineTimer
        deadlineTime="2025-03-01T12:00:02Z"
        gameweekName="Gameweek 29"
      />
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("deadline-expired")).toHaveTextContent("Deadline passed");
  });
});
