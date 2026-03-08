import { redirect } from "react-router";
import { createServerClient } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  fplManagerId: number;
  playerName: string;
  teamName: string;
}

/**
 * Require authentication in a loader. Redirects to /login if not authenticated.
 * Returns the authenticated user with FPL manager details.
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const pb = createServerClient(request);

  if (!pb.authStore.isValid || !pb.authStore.record) {
    throw redirect("/login");
  }

  try {
    await pb.collection("users").authRefresh();
  } catch {
    throw redirect("/login");
  }

  const record = pb.authStore.record;

  return {
    id: record.id,
    email: record.email,
    fplManagerId: record.fpl_manager_id,
    playerName: record.player_name,
    teamName: record.team_name,
  };
}

/**
 * Get optional auth user. Returns null if not authenticated (no redirect).
 */
export async function getOptionalAuth(request: Request): Promise<AuthUser | null> {
  const pb = createServerClient(request);

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return null;
  }

  try {
    await pb.collection("users").authRefresh();
  } catch {
    return null;
  }

  const record = pb.authStore.record;

  return {
    id: record.id,
    email: record.email,
    fplManagerId: record.fpl_manager_id,
    playerName: record.player_name,
    teamName: record.team_name,
  };
}
