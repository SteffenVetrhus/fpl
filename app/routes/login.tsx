import { useState } from "react";
import { useNavigate } from "react-router";
import { createServerClient } from "~/lib/pocketbase/client";
import { createBrowserClient, getAuthCookieHeader } from "~/lib/pocketbase/client";
import { redirect } from "react-router";
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
      console.log("[login loader] auth refresh failed, showing login", err);
    }
  }
  return {};
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const pb = createBrowserClient();
      console.log("[login] attempting auth", { email, pbUrl: pb.baseURL });
      await pb.collection("users").authWithPassword(email, password);
      console.log("[login] auth successful", { userId: pb.authStore.record?.id });

      document.cookie = pb.authStore.exportToCookie({
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
      }, "pb_auth");

      if (!pb.authStore.record?.password_changed) {
        navigate("/profile/change-password");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      const pbErr = err as { status?: number; message?: string; response?: { message?: string } };
      console.error("[login] auth failed", {
        status: pbErr.status,
        message: pbErr.message,
        response: pbErr.response,
        raw: err,
      });
      if (pbErr.status === 0 || !pbErr.status) {
        setError("Cannot reach auth server. Check POCKETBASE_URL configuration.");
      } else if (pbErr.status === 400) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(`Login failed (${pbErr.status}): ${pbErr.response?.message || pbErr.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-5">
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
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--color-page-league)" }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Contact your league admin for login credentials
        </p>
      </div>
    </div>
  );
}
