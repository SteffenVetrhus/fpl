import { useState } from "react";
import { useNavigate, NavLink } from "react-router";
import { requireAuth } from "~/lib/pocketbase/auth";
import { createBrowserClient } from "~/lib/pocketbase/client";
import { Lock, ArrowLeft, AlertTriangle, Eye, EyeOff } from "lucide-react";
import type { Route } from "./+types/change-password";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request, { allowPasswordUnchanged: true });
  return { user };
}

export default function ChangePassword({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const navigate = useNavigate();

  const isForced = !user.passwordChanged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (oldPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setIsLoading(true);

    try {
      const pb = createBrowserClient();

      await pb.collection("users").update(user.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
        password_changed: true,
      });

      await pb.collection("users").authWithPassword(user.email, newPassword);

      document.cookie = pb.authStore.exportToCookie(
        { httpOnly: false, secure: false, sameSite: "lax", path: "/" },
        "pb_auth",
      );

      navigate("/");
    } catch (err: unknown) {
      const pbErr = err as {
        status?: number;
        message?: string;
        response?: { message?: string };
      };
      if (pbErr.status === 400) {
        setError("Current password is incorrect. Please try again.");
      } else if (pbErr.status === 0 || !pbErr.status) {
        setError("Cannot reach auth server. Please try again later.");
      } else {
        setError(
          `Password change failed: ${pbErr.response?.message || pbErr.message || "Unknown error"}`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-page-league)" }}
    >
      <section
        className="kit-hero kit-diagonal-cut"
        style={{ background: "var(--color-page-league)" }}
      >
        <div className="kit-watermark">PASSWORD</div>
        <div
          className="kit-stripe"
          style={{ background: "var(--color-page-league-light)" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Account Security
          </p>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            Change Password
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-lg mx-auto px-4 -mt-8 pb-24 sm:pb-16">
        {isForced && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 kit-animate-slide-up">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-800 font-medium text-sm">
                Default password detected
              </p>
              <p className="text-amber-700 text-sm mt-1">
                You&apos;re using the default password. Please set a new password
                to secure your account before continuing.
              </p>
            </div>
          </div>
        )}

        <div className="kit-card p-6 md:p-8 kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-page-league)" }}
            >
              <Lock size={18} color="white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Set new password</h2>
              <p className="text-sm text-gray-500">{user.playerName}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="oldPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current password
              </label>
              <div className="relative">
                <input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow pr-12"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showOldPassword ? "Hide password" : "Show password"}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow pr-12"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                placeholder="Re-enter new password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--color-page-league)" }}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>

          {!isForced && (
            <div className="mt-4 text-center">
              <NavLink
                to="/profile"
                className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                Back to profile
              </NavLink>
            </div>
          )}
        </div>
      </main>

      <footer className="pb-24 sm:pb-8 text-center">
        <p className="text-white/30 text-xs">
          Keep your account secure with a strong password
        </p>
      </footer>
    </div>
  );
}
