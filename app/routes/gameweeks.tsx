import { useLoaderData, Link } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { GameweekHistory } from "~/components/GameweekHistory/GameweekHistory";
import type { Route } from "./+types/gameweeks";
import type { FPLManagerGameweek } from "~/lib/fpl-api/types";

export async function loader() {
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.FPL_LEAGUE_ID);

  // Fetch gameweek history for each manager
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gameweek History
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Performance across all gameweeks
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              to="/"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
            >
              League Table
            </Link>
            <Link
              to="/gameweeks"
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Gameweek History
            </Link>
            <Link
              to="/transfers"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Transfer Activity
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {managers.map((manager) => (
            <div
              key={manager.name}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {manager.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {manager.teamName}
                </p>
              </div>
              <GameweekHistory gameweeks={manager.gameweeks} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
