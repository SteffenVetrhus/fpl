/**
 * MiniGamePairings - Displays H2H matchup cards and ranking results
 */

import { Swords, Trophy, Minus } from "lucide-react";
import type { MiniGamePairing, MiniGameResult } from "~/lib/mini-games/types";

export interface MiniGamePairingsProps {
  pairings: MiniGamePairing[];
  results: MiniGameResult[];
  gameType: "h2h" | "ranking";
  isCompleted: boolean;
}

function getResultColor(points: number): string {
  if (points === 3) return "text-green-600 bg-green-50";
  if (points === 1) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

export function MiniGamePairings({ pairings, results, gameType, isCompleted }: MiniGamePairingsProps) {
  if (!isCompleted) {
    return (
      <div className="kit-card p-8 text-center">
        <p className="text-gray-500">Results will appear once the gameweek is finished.</p>
      </div>
    );
  }

  if (gameType === "h2h") {
    return <H2HResults pairings={pairings} />;
  }

  return <RankingResults results={results} />;
}

function H2HResults({ pairings }: { pairings: MiniGamePairing[] }) {
  if (pairings.length === 0) {
    return (
      <div className="kit-card p-8 text-center">
        <p className="text-gray-500">No pairings available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pairings.map((pairing) => {
        const isBye = pairing.manager_b_id === 0;

        return (
          <div key={pairing.id} className="kit-card p-4">
            <div className="flex items-center gap-3">
              {/* Manager A */}
              <div className="flex-1 text-right">
                <p className="font-semibold text-gray-900 text-sm md:text-base">
                  {pairing.manager_a_name}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-gray-500 text-xs">Score: {pairing.score_a}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getResultColor(pairing.points_a)}`}>
                    {pairing.points_a} pts
                  </span>
                </div>
              </div>

              {/* VS Badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                <Swords size={16} className="text-white" />
              </div>

              {/* Manager B */}
              <div className="flex-1 text-left">
                {isBye ? (
                  <>
                    <p className="font-semibold text-gray-400 text-sm md:text-base italic">BYE</p>
                    <p className="text-xs text-gray-400 mt-1">Free round</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">
                      {pairing.manager_b_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getResultColor(pairing.points_b)}`}>
                        {pairing.points_b} pts
                      </span>
                      <span className="text-gray-500 text-xs">Score: {pairing.score_b}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankingResults({ results }: { results: MiniGameResult[] }) {
  if (results.length === 0) {
    return (
      <div className="kit-card p-8 text-center">
        <p className="text-gray-500">No results available.</p>
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => a.rank - b.rank);

  return (
    <div className="kit-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="px-4 py-3 kit-stat-label text-gray-500 w-12">#</th>
            <th className="px-4 py-3 kit-stat-label text-gray-500">Player</th>
            <th className="px-4 py-3 kit-stat-label text-gray-500 text-center">Score</th>
            <th className="px-4 py-3 kit-stat-label text-gray-500 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((result) => (
            <tr
              key={result.id}
              className={`border-b border-gray-50 ${
                result.rank <= 3 ? "bg-yellow-50/50" : ""
              }`}
            >
              <td className="px-4 py-3 font-semibold text-gray-600">
                {result.rank === 1 && "🥇"}
                {result.rank === 2 && "🥈"}
                {result.rank === 3 && "🥉"}
                {result.rank > 3 && result.rank}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {result.manager_name}
              </td>
              <td className="px-4 py-3 text-center text-gray-600">{result.score}</td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    result.points > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {result.points > 0 ? `+${result.points}` : "0"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
