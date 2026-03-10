import { describe, it, expect, vi, beforeEach } from "vitest";
import { action } from "./transfer-planner";

const mockGetFirstListItem = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("~/lib/pocketbase/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: "user123",
    email: "alice@fpl.local",
    fplManagerId: 123456,
    playerName: "Alice Johnson",
    teamName: "Alice's Aces",
  }),
}));

vi.mock("~/lib/pocketbase/client", () => ({
  createServerClient: () => ({
    collection: () => ({
      getFirstListItem: mockGetFirstListItem,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    }),
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildActionArgs(body: Record<string, string>): any {
  const formData = new FormData();
  for (const [key, value] of Object.entries(body)) {
    formData.append(key, value);
  }
  return {
    request: new Request("http://localhost/transfer-planner", {
      method: "POST",
      body: formData,
    }),
    params: {},
    context: {},
  };
}

describe("transfer-planner action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new plan when none exists", async () => {
    mockGetFirstListItem.mockRejectedValue(new Error("not found"));
    mockCreate.mockResolvedValue({ id: "plan1" });

    const plan = JSON.stringify({
      gameweeks: { "10": { transfers: [], captain: 1, viceCaptain: 2, chip: null, benchOrder: [] } },
    });

    const result = await action(buildActionArgs({ intent: "save", plan, currentGameweek: "10" }));

    expect(result).toMatchObject({ ok: true });
    expect(mockCreate).toHaveBeenCalledWith({
      user: "user123",
      plan_data: JSON.parse(plan),
      current_gameweek: 10,
    });
  });

  it("updates an existing plan", async () => {
    mockGetFirstListItem.mockResolvedValue({ id: "existing1" });
    mockUpdate.mockResolvedValue({});

    const plan = JSON.stringify({
      gameweeks: { "11": { transfers: [{ elementIn: 1, elementOut: 2 }], captain: null, viceCaptain: null, chip: null, benchOrder: [] } },
    });

    const result = await action(buildActionArgs({ intent: "save", plan, currentGameweek: "11" }));

    expect(result).toMatchObject({ ok: true });
    expect(mockUpdate).toHaveBeenCalledWith("existing1", {
      plan_data: JSON.parse(plan),
      current_gameweek: 11,
    });
  });

  it("returns error for missing plan data", async () => {
    const result = await action(buildActionArgs({ intent: "save", currentGameweek: "10" }));

    expect(result).toEqual({ ok: false, error: "No plan data provided" });
  });

  it("returns error for invalid JSON", async () => {
    const result = await action(buildActionArgs({ intent: "save", plan: "not-json{", currentGameweek: "10" }));

    expect(result).toEqual({ ok: false, error: "Invalid plan data" });
  });

  it("deletes saved plan", async () => {
    mockGetFirstListItem.mockResolvedValue({ id: "existing1" });
    mockDelete.mockResolvedValue({});

    const result = await action(buildActionArgs({ intent: "delete" }));

    expect(result).toEqual({ ok: true });
    expect(mockDelete).toHaveBeenCalledWith("existing1");
  });

  it("handles delete when no plan exists", async () => {
    mockGetFirstListItem.mockRejectedValue(new Error("not found"));

    const result = await action(buildActionArgs({ intent: "delete" }));

    expect(result).toEqual({ ok: true });
  });

  it("returns error for unknown intent", async () => {
    const result = await action(buildActionArgs({ intent: "unknown" }));

    expect(result).toEqual({ ok: false, error: "Unknown intent" });
  });
});
