import { fetchLeagueStandings } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { getOptionalAuth } from "~/lib/pocketbase/auth";
import { LeagueTable } from "~/components/LeagueTable/LeagueTable";
import { LandingPage } from "~/components/LandingPage/LandingPage";
import type { Route } from "./+types/_index";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalAuth(request);

  if (!user) {
    return { authenticated: false as const };
  }

  const config = getEnvConfig();
  const data = await fetchLeagueStandings(config.fplLeagueId);
  return { authenticated: true as const, ...data, currentManagerId: user.fplManagerId };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  if (!loaderData.authenticated) {
    return <LandingPage />;
  }

  const data = loaderData;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-league)" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-league)" }}>
        <div className="kit-watermark">1</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-league-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Fantasy Premier League Tracker
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            {data.league.name}
          </h1>
        </div>
      </section>

      {/* Content — white island */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-16">
        <LeagueTable standings={data.standings.results} currentManagerId={data.currentManagerId} />
      </main>

      {/* Footer */}
      <footer className="pb-24 sm:pb-8 text-center">
        <p className="text-white/30 text-xs">
          Built with React Router v7 · Data from FPL API
        </p>
      </footer>
    </div>
  );
}
