import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import Profile from "./profile";

vi.mock("~/lib/pocketbase/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: "user1",
    email: "alice@fpl.local",
    fplManagerId: 123456,
    playerName: "Alice Johnson",
    teamName: "Alice's Aces",
    passwordChanged: true,
  }),
}));

vi.mock("~/lib/pocketbase/client", () => ({
  createServerClient: vi.fn(),
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
  passwordChanged: true,
};

function renderWithRouter(user = defaultUser) {
  const Stub = createRoutesStub([
    {
      path: "/profile",
      Component: Profile,
      loader: () => ({ user }),
    },
  ]);
  return render(<Stub initialEntries={["/profile"]} />);
}

describe("Profile Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user profile information", async () => {
    renderWithRouter();
    const names = await screen.findAllByText("Alice Johnson");
    expect(names.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Alice's Aces")).toBeTruthy();
    expect(screen.getByText("alice@fpl.local")).toBeTruthy();
    expect(screen.getByText("123456")).toBeTruthy();
  });

  it("shows password changed badge when password has been changed", async () => {
    renderWithRouter();
    expect(await screen.findByText("Changed")).toBeTruthy();
    expect(screen.queryByText(/Default/)).toBeNull();
  });

  it("shows default password badge when password has not been changed", async () => {
    renderWithRouter({ ...defaultUser, passwordChanged: false });
    expect(
      await screen.findByText("Default — change recommended"),
    ).toBeTruthy();
    expect(screen.queryByText("Changed")).toBeNull();
  });

  it("has a change password link", async () => {
    renderWithRouter();
    expect(await screen.findByText("Change Password")).toBeTruthy();
    expect(screen.getByText("Update your account password")).toBeTruthy();
  });

  it("displays the hero section with user name", async () => {
    renderWithRouter();
    const headings = await screen.findAllByText("Alice Johnson");
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("displays the email field", async () => {
    renderWithRouter();
    expect(await screen.findByText("Email")).toBeTruthy();
    expect(screen.getByText("alice@fpl.local")).toBeTruthy();
  });

  it("displays the FPL Manager ID", async () => {
    renderWithRouter();
    expect(await screen.findByText("FPL Manager ID")).toBeTruthy();
    expect(screen.getByText("123456")).toBeTruthy();
  });
});
