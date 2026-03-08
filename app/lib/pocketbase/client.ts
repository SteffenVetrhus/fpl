import PocketBase from "pocketbase";
import { getEnvConfig } from "~/config/env";

declare global {
  interface Window {
    ENV?: {
      POCKETBASE_URL: string;
    };
  }
}

const PB_AUTH_COOKIE = "pb_auth";

/**
 * Create a PocketBase client for server-side use in loaders/actions.
 * Restores auth state from the request cookie header.
 */
export function createServerClient(request: Request): PocketBase {
  const config = getEnvConfig();
  const pb = new PocketBase(config.pocketbaseUrl);

  const cookieHeader = request.headers.get("cookie") || "";
  pb.authStore.loadFromCookie(cookieHeader, PB_AUTH_COOKIE);

  return pb;
}

/**
 * Create a PocketBase client for browser-side use (login/logout).
 */
export function createBrowserClient(): PocketBase {
  const pb = new PocketBase(window.ENV?.POCKETBASE_URL || "http://localhost:8090");
  const cookies = document.cookie;
  pb.authStore.loadFromCookie(cookies, PB_AUTH_COOKIE);
  return pb;
}

/**
 * Serialize the PocketBase auth state into a Set-Cookie header value.
 */
export function getAuthCookieHeader(pb: PocketBase): string {
  return pb.authStore.exportToCookie({
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    path: "/",
  }, PB_AUTH_COOKIE);
}

/**
 * Create a Set-Cookie header that clears the auth cookie.
 */
export function getClearAuthCookieHeader(): string {
  return `${PB_AUTH_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export { PB_AUTH_COOKIE };
