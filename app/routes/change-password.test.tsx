import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import ChangePassword, { action } from "./change-password";

vi.mock("~/lib/pocketbase/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: "user1",
    email: "alice@fpl.local",
    fplManagerId: 123456,
    playerName: "Alice Johnson",
    teamName: "Alice's Aces",
    passwordChanged: false,
  }),
}));

vi.mock("~/lib/pocketbase/client", () => ({
  createServerClient: vi.fn(() => ({
    collection: () => ({
      update: vi.fn().mockResolvedValue({}),
      authWithPassword: vi.fn().mockResolvedValue({}),
    }),
    authStore: {
      isValid: true,
      record: { id: "user1" },
      loadFromCookie: vi.fn(),
      exportToCookie: vi.fn(() => "pb_auth=token; Path=/; HttpOnly"),
    },
  })),
  getAuthCookieHeader: vi.fn(() => "pb_auth=token; Path=/; HttpOnly"),
}));

vi.mock("~/config/env", () => ({
  getEnvConfig: () => ({ pocketbaseUrl: "http://localhost:8090" }),
}));

const defaultUser = {
  id: "user1",
  email: "alice@fpl.local",
  fplManagerId: 123456,
  playerName: "Alice Johnson",
  teamName: "Alice's Aces",
  passwordChanged: false,
};

function renderWithRouter(user = defaultUser) {
  const Stub = createRoutesStub([
    {
      path: "/profile/change-password",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Component: ChangePassword as any,
      loader: () => ({ user }),
      action,
    },
  ]);
  return render(<Stub initialEntries={["/profile/change-password"]} />);
}

describe("Change Password Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the change password form", async () => {
    renderWithRouter();
    expect(await screen.findByText("Change Password")).toBeTruthy();
    expect(screen.getByLabelText("Current password")).toBeTruthy();
    expect(screen.getByLabelText("New password")).toBeTruthy();
    expect(screen.getByLabelText("Confirm new password")).toBeTruthy();
    expect(screen.getByRole("button", { name: /update password/i })).toBeTruthy();
  });

  it("shows forced change banner when password not changed", async () => {
    renderWithRouter();
    expect(await screen.findByText("Default password detected")).toBeTruthy();
    expect(screen.getByText(/using the default password/)).toBeTruthy();
  });

  it("hides forced change banner when password already changed", async () => {
    renderWithRouter({ ...defaultUser, passwordChanged: true });
    expect(await screen.findByText("Change Password")).toBeTruthy();
    expect(screen.queryByText("Default password detected")).toBeNull();
  });

  it("shows back to profile link when password already changed", async () => {
    renderWithRouter({ ...defaultUser, passwordChanged: true });
    expect(await screen.findByText("Back to profile")).toBeTruthy();
  });

  it("hides back to profile link when forced change", async () => {
    renderWithRouter();
    expect(await screen.findByText("Change Password")).toBeTruthy();
    expect(screen.queryByText("Back to profile")).toBeNull();
  });

  it("displays user name in the form header", async () => {
    renderWithRouter();
    expect(await screen.findByText("Alice Johnson")).toBeTruthy();
  });
});
