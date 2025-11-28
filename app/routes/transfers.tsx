import { useLoaderData, Link } from "react-router";
import { fetchLeagueStandings, fetchManagerTransfers } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { TransferTracker } from "~/components/TransferTracker/TransferTracker";
import type { Route } from "./+types/transfers";

export async function loader() {
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.FPL_LEAGUE_ID);

  // Fetch transfer data for each manager
  const transferData = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const transfers = await fetchManagerTransfers(manager.entry.toString());
      return {
        managerName: manager.player_name,
        teamName: manager.entry_name,
        transfers,
      };
    })
  );

  // Calculate transfer summary
  const transferSummary = transferData.map(({ managerName, teamName, transfers }) => {
    const transferCount = transfers.length;
    const lastTransferGW = transfers.length > 0
      ? Math.max(...transfers.map(t => t.event))
      : 0;

    return {
      managerName,
      teamName,
      transferCount,
      lastTransferGW,
    };
  });

  return { transferSummary };
}

export default function Transfers({ loaderData }: Route.ComponentProps) {
  const { transferSummary } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Transfer Activity
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Who's been busy in the transfer market?
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
              to="/transfers"
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Transfer Activity
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TransferTracker transfers={transferSummary} />
      </main>
    </div>
  );
}
