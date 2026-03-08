import { useState } from "react";
import { useLoaderData } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { GameweekNavigator } from "~/components/GameweekNavigator/GameweekNavigator";
import { HistoricalLeagueTable } from "~/components/HistoricalLeagueTable/HistoricalLeagueTable";
import {
  getAvailableGameweeks,
  calculateHistoricalStandings,
} from "~/utils/historical-standings";
import type { Route } from "./+types/standings";

export async function loader() {
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  const managers = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        gameweeks: history.current,
      };
    })
  );

  return { managers };
}

export default function Standings({ loaderData }: Route.ComponentProps) {
  const { managers } = useLoaderData<typeof loader>();

  const availableGameweeks = getAvailableGameweeks(managers);
  const mostRecentGameweek =
    availableGameweeks.length > 0
      ? availableGameweeks[availableGameweeks.length - 1]
      : 1;

  const [currentGameweek, setCurrentGameweek] = useState(mostRecentGameweek);

  const handleNavigate = (gameweek: number) => {
    setCurrentGameweek(gameweek);
  };

  if (managers.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-page-standings)" }}>
        <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-standings)" }}>
          <div className="kit-watermark">GW</div>
          <div className="kit-stripe" style={{ background: "var(--color-page-standings-light)" }} />
          <div className="relative z-10 max-w-7xl mx-auto w-full">
            <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3">
              League standings across all gameweeks
            </p>
            <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl">
              Historical Standings
            </h1>
          </div>
        </section>
        <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-16">
          <div className="kit-card p-12 text-center">
            <p className="text-xl text-gray-400">
              No data available for this league
            </p>
          </div>
        </main>
      </div>
    );
  }

  const standingsData = calculateHistoricalStandings(managers, currentGameweek);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-standings)" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-standings)" }}>
        <div className="kit-watermark">GW</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-standings-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            League standings across all gameweeks
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Historical Standings
          </h1>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        <GameweekNavigator
          currentGameweek={currentGameweek}
          availableGameweeks={availableGameweeks}
          onNavigate={handleNavigate}
        />
        <HistoricalLeagueTable data={standingsData} />
      </main>
    </div>
  );
}
