import { NavLink } from "react-router";
import { requireAuth } from "~/lib/pocketbase/auth";
import { User, Mail, Shield, Hash, Lock, ChevronRight } from "lucide-react";
import type { Route } from "./+types/profile";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  return { user };
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-page-league)" }}
    >
      <section
        className="kit-hero kit-diagonal-cut"
        style={{ background: "var(--color-page-league)" }}
      >
        <div className="kit-watermark">PROFILE</div>
        <div
          className="kit-stripe"
          style={{ background: "var(--color-page-league-light)" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Your Account
          </p>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            {user.playerName}
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-lg mx-auto px-4 -mt-8 pb-24 sm:pb-16">
        <div className="kit-card p-6 md:p-8 kit-animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-page-league)" }}
            >
              <User size={22} color="white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">
                {user.playerName}
              </h2>
              <p className="text-sm text-gray-500">{user.teamName}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Mail size={18} className="text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-sm text-gray-900 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Hash size={18} className="text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  FPL Manager ID
                </p>
                <p className="text-sm text-gray-900">{user.fplManagerId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Shield size={18} className="text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Password Status
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {user.passwordChanged ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Changed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Default — change recommended
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <NavLink
              to="/profile/change-password"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                <Lock size={16} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Change Password
                </p>
                <p className="text-xs text-gray-500">
                  Update your account password
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-gray-300 group-hover:text-gray-500 transition-colors"
              />
            </NavLink>
          </div>
        </div>
      </main>

      <footer className="pb-24 sm:pb-8 text-center">
        <p className="text-white/30 text-xs">
          FPL League Tracker — your profile
        </p>
      </footer>
    </div>
  );
}
