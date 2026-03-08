import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { GameweekHistory } from "~/components/GameweekHistory/GameweekHistory";
import { PlayerSelector } from "~/components/PlayerSelector/PlayerSelector";
import type { Route } from "./+types/gameweeks";
import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

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

export default function Gameweeks({ loaderData }: Route.ComponentProps) {
  const { managers } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const playerParam = searchParams.get("player");
  const selectedPlayerName =
    playerParam && managers.find((m) => m.name === playerParam)
      ? playerParam
      : managers[0]?.name || "";

  const selectedManager = managers.find((m) => m.name === selectedPlayerName);

  const handlePlayerSelect = (managerName: string) => {
    navigate(`/gameweeks?player=${encodeURIComponent(managerName)}`);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-gameweeks)" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-gameweeks)" }}>
        <div className="kit-watermark">GW</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-gameweeks-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Performance across all gameweeks
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Gameweek History
          </h1>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16">
        <div className="kit-card p-6 md:p-8">
          <PlayerSelector
            managers={managers}
            selectedManager={selectedPlayerName}
            onSelect={handlePlayerSelect}
          />

          {selectedManager && (
            <>
              <div className="mb-6">
                <h2 className="kit-headline text-2xl text-gray-900">
                  {selectedManager.name}
                </h2>
                <p className="text-sm text-gray-500 italic">
                  {selectedManager.teamName}
                </p>
              </div>
              <GameweekHistory
                gameweeks={selectedManager.gameweeks}
                managerName={selectedManager.name}
                allManagers={managers}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
