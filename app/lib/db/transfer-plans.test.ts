import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("pg", () => ({
  default: { Pool: vi.fn() },
}));

vi.mock("./client", () => ({
  query: vi.fn(),
  isDatabaseAvailable: vi.fn(),
}));

import { saveTransferPlan, loadTransferPlan, deleteTransferPlan } from "./transfer-plans";
import { query, isDatabaseAvailable } from "./client";
import type { TransferPlanData } from "./transfer-plans";

const mockQuery = vi.mocked(query);
const mockIsDbAvailable = vi.mocked(isDatabaseAvailable);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveTransferPlan", () => {
  it("inserts a plan with correct parameters", async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

    const planData: TransferPlanData = {
      gameweeks: {
        "31": {
          transfers: [{ elementIn: 100, elementOut: 200 }],
          captain: 100,
          viceCaptain: 300,
          chip: null,
          benchOrder: [],
        },
      },
    };

    await saveTransferPlan(12345, planData);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO transfer_plans"),
      [12345, JSON.stringify(planData)]
    );
  });
});

describe("loadTransferPlan", () => {
  it("returns plan data when found", async () => {
    mockIsDbAvailable.mockResolvedValue(true);
    const planData: TransferPlanData = {
      gameweeks: {
        "31": {
          transfers: [],
          captain: null,
          viceCaptain: null,
          chip: "wildcard",
          benchOrder: [],
        },
      },
    };
    mockQuery.mockResolvedValue({ rows: [{ plan_data: planData }], rowCount: 1 });

    const result = await loadTransferPlan(12345);
    expect(result).toEqual(planData);
  });

  it("returns null when no plan exists", async () => {
    mockIsDbAvailable.mockResolvedValue(true);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    const result = await loadTransferPlan(12345);
    expect(result).toBeNull();
  });

  it("returns null when database is unavailable", async () => {
    mockIsDbAvailable.mockResolvedValue(false);

    const result = await loadTransferPlan(12345);
    expect(result).toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns null on query error", async () => {
    mockIsDbAvailable.mockResolvedValue(true);
    mockQuery.mockRejectedValue(new Error("connection refused"));

    const result = await loadTransferPlan(12345);
    expect(result).toBeNull();
  });
});

describe("deleteTransferPlan", () => {
  it("deletes plan for given manager", async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

    await deleteTransferPlan(12345);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM transfer_plans"),
      [12345]
    );
  });
});
