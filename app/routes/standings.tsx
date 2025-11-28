import { useState } from "react";
import { useLoaderData, Link } from "react-router";
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

export default function Standings({ loaderData }: Route.ComponentProps) {
  const { managers } = useLoaderData<typeof loader>();

  // Get available gameweeks and default to most recent
  const availableGameweeks = getAvailableGameweeks(managers);
  const mostRecentGameweek =
    availableGameweeks.length > 0
      ? availableGameweeks[availableGameweeks.length - 1]
      : 1;

  const [currentGameweek, setCurrentGameweek] = useState(mostRecentGameweek);

  // Calculate standings for current gameweek
  const handleNavigate = (gameweek: number) => {
    setCurrentGameweek(gameweek);
  };

  // Show empty state if no managers
  if (managers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Historical Standings
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              League standings across all gameweeks
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 px-4">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              📊 No data available for this league
            </p>
          </div>
        </main>
      </div>
    );
  }

  const standingsData = calculateHistoricalStandings(managers, currentGameweek);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Historical Standings
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            League standings across all gameweeks
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
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Gameweek History
            </Link>
            <Link
              to="/standings"
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Historical Standings
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
        {/* Gameweek Navigator */}
        <GameweekNavigator
          currentGameweek={currentGameweek}
          availableGameweeks={availableGameweeks}
          onNavigate={handleNavigate}
        />

        {/* Historical League Table */}
        <HistoricalLeagueTable data={standingsData} />
      </main>
    </div>
  );
}
