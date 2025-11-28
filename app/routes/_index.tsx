import { useLoaderData, Link } from "react-router";
import { fetchLeagueStandings } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { LeagueTable } from "~/components/LeagueTable/LeagueTable";
import type { Route } from "./+types/_index";

export async function loader() {
  const config = getEnvConfig();
  const data = await fetchLeagueStandings(config.fplLeagueId);
  return data;
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {data.league.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Fantasy Premier League Tracker
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              to="/"
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 dark:text-blue-400"
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
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
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
        <LeagueTable standings={data.standings.results} />
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Built with React Router v7 • Data from FPL API
          </p>
        </div>
      </footer>
    </div>
  );
}
