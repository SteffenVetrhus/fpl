import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaptainRegretBadge } from "./CaptainRegretBadge";
import type { CaptainRegretData } from "~/utils/captain-regret";

describe("CaptainRegretBadge", () => {
  it("should display perfect captain choice", () => {
    const regretData: CaptainRegretData = {
      captainId: 1,
      captainName: "Salah",
      captainPoints: 18,
      captainTotalPoints: 36,
      bestPlayerId: 1,
      bestPlayerName: "Salah",
      bestPlayerPoints: 18,
      bestPlayerPotentialPoints: 36,
      regretPoints: 0,
    };

    render(<CaptainRegretBadge regretData={regretData} />);

    expect(screen.getByText("Salah")).toBeInTheDocument();
    expect(screen.getByText("Perfect captain choice!")).toBeInTheDocument();
    expect(screen.getByText(/18.*×.*2.*=.*36/)).toBeInTheDocument();
    expect(screen.queryByText(/-.*pts/)).not.toBeInTheDocument();
  });

  it("should display regret when captain was not the best choice", () => {
    const regretData: CaptainRegretData = {
      captainId: 1,
      captainName: "Haaland",
      captainPoints: 12,
      captainTotalPoints: 24,
      bestPlayerId: 2,
      bestPlayerName: "Salah",
      bestPlayerPoints: 18,
      bestPlayerPotentialPoints: 36,
      regretPoints: 12,
    };

    render(<CaptainRegretBadge regretData={regretData} />);

    expect(screen.getByText("Haaland")).toBeInTheDocument();
    expect(screen.getByText("Salah")).toBeInTheDocument();
    expect(screen.getByText("-12 pts")).toBeInTheDocument();
    expect(screen.getByText("Best choice:")).toBeInTheDocument();
    expect(screen.getByText(/12.*×.*2.*=.*24/)).toBeInTheDocument();
    expect(screen.getByText(/18.*×.*2.*=.*36/)).toBeInTheDocument();
  });

  it("should display low regret with yellow styling", () => {
    const regretData: CaptainRegretData = {
      captainId: 1,
      captainName: "Haaland",
      captainPoints: 15,
      captainTotalPoints: 30,
      bestPlayerId: 2,
      bestPlayerName: "Salah",
      bestPlayerPoints: 18,
      bestPlayerPotentialPoints: 36,
      regretPoints: 6,
    };

    render(<CaptainRegretBadge regretData={regretData} />);

    expect(screen.getByText("-6 pts")).toBeInTheDocument();
  });

  it("should display high regret with red styling", () => {
    const regretData: CaptainRegretData = {
      captainId: 1,
      captainName: "Haaland",
      captainPoints: 4,
      captainTotalPoints: 8,
      bestPlayerId: 2,
      bestPlayerName: "Salah",
      bestPlayerPoints: 18,
      bestPlayerPotentialPoints: 36,
      regretPoints: 28,
    };

    render(<CaptainRegretBadge regretData={regretData} />);

    expect(screen.getByText("-28 pts")).toBeInTheDocument();
    expect(screen.getByText("Haaland")).toBeInTheDocument();
    expect(screen.getByText("Salah")).toBeInTheDocument();
  });

  it("should show CAPTAIN CHOICE header", () => {
    const regretData: CaptainRegretData = {
      captainId: 1,
      captainName: "Salah",
      captainPoints: 18,
      captainTotalPoints: 36,
      bestPlayerId: 1,
      bestPlayerName: "Salah",
      bestPlayerPoints: 18,
      bestPlayerPotentialPoints: 36,
      regretPoints: 0,
    };

    render(<CaptainRegretBadge regretData={regretData} />);

    expect(screen.getByText("CAPTAIN CHOICE")).toBeInTheDocument();
  });

  it("should display captain label", () => {
    const regretData: CaptainRegretData = {
      captainId: 1,
      captainName: "Haaland",
      captainPoints: 12,
      captainTotalPoints: 24,
      bestPlayerId: 2,
      bestPlayerName: "Salah",
      bestPlayerPoints: 18,
      bestPlayerPotentialPoints: 36,
      regretPoints: 12,
    };

    render(<CaptainRegretBadge regretData={regretData} />);

    expect(screen.getByText("Captain:")).toBeInTheDocument();
  });
});
