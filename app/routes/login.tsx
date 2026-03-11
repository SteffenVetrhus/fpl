import { Form, useNavigation, redirect } from "react-router";
import PocketBase from "pocketbase";
import { createServerClient, getAuthCookieHeader } from "~/lib/pocketbase/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const pb = createServerClient(request);
  if (pb.authStore.isValid && pb.authStore.record) {
    try {
      await pb.collection("users").authRefresh();
      if (!pb.authStore.record?.password_changed) {
        throw redirect("/profile/change-password");
      }
      throw redirect("/");
    } catch (err) {
      if (err instanceof Response) throw err;
      // Auth refresh failed, show login page
    }
  }
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const config = getEnvConfig();
  const pb = new PocketBase(config.pocketbaseUrl);

  try {
    await pb.collection("users").authWithPassword(email, password);
  } catch (err: unknown) {
    const pbErr = err as { status?: number };
    if (pbErr.status === 400) {
      return { error: "Invalid email or password. Please try again." };
    }
    if (pbErr.status === 0 || !pbErr.status) {
      return { error: "Cannot reach auth server. Please try again later." };
    }
    return { error: "Login failed. Please try again or contact your league admin." };
  }

  const cookieHeader = getAuthCookieHeader(pb);

  if (!pb.authStore.record?.password_changed) {
    throw redirect("/profile/change-password", {
      headers: { "Set-Cookie": cookieHeader },
    });
  }

  throw redirect("/", {
    headers: { "Set-Cookie": cookieHeader },
  });
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const error = actionData?.error;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-page-league)" }}>
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="kit-headline text-white text-5xl md:text-6xl mb-2">
            FPL Tracker
          </h1>
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium">
            Sign in to your league
          </p>
        </div>

        <div className="kit-card p-8">
          <Form method="post" className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                style={{ focusRingColor: "var(--color-page-league)" } as React.CSSProperties}
                placeholder="you@fpl.local"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--color-page-league)" }}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </Form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Contact your league admin for login credentials
        </p>
      </div>
    </div>
  );
}
