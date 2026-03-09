/**
 * MiniGameHistory - Past rounds list with results summary
 */

import { ChevronDown, ChevronUp, Swords, BarChart3 } from "lucide-react";
import { useState } from "react";
import type { MiniGameRound, MiniGamePairing, MiniGameResult } from "~/lib/mini-games/types";
import { MINI_GAMES } from "~/lib/mini-games/types";

export interface PastRound {
  round: MiniGameRound;
  pairings: MiniGamePairing[];
  results: MiniGameResult[];
}

export interface MiniGameHistoryProps {
  pastRounds: PastRound[];
}

function getWinners(round: PastRound): string[] {
  if (round.round.game_type === "h2h") {
    const winners: string[] = [];
    for (const pairing of round.pairings) {
      if (pairing.points_a === 3) winners.push(pairing.manager_a_name);
      if (pairing.points_b === 3) winners.push(pairing.manager_b_name);
    }
    return winners.length > 0 ? winners : ["Draw"];
  }

  const topResults = round.results.filter((r) => r.rank === 1);
  return topResults.map((r) => r.manager_name);
}

export function MiniGameHistory({ pastRounds }: MiniGameHistoryProps) {
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  if (pastRounds.length === 0) {
    return (
      <div className="kit-card p-8 text-center">
        <p className="text-gray-500">No past games yet. The history will build up over the season!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pastRounds.map((pastRound) => {
        const game = MINI_GAMES[pastRound.round.game_index];
        const isExpanded = expandedRound === pastRound.round.id;
        const winners = pastRound.round.status === "completed" ? getWinners(pastRound) : [];
        const isH2H = pastRound.round.game_type === "h2h";
        const GameIcon = game?.icon;

        return (
          <div key={pastRound.round.id} className="kit-card overflow-hidden">
            <button
              onClick={() => setExpandedRound(isExpanded ? null : pastRound.round.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              {GameIcon && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-page-minigames)" }}
                >
                  <GameIcon size={14} className="text-white" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400">GW{pastRound.round.gameweek}</span>
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {pastRound.round.game_name}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-gray-400">
                    {isH2H ? <Swords size={10} /> : <BarChart3 size={10} />}
                    {isH2H ? "H2H" : "Rank"}
                  </span>
                </div>

                {pastRound.round.status === "completed" && winners.length > 0 && (
                  <p className="text-xs text-green-600 mt-0.5 truncate">
                    {isH2H ? "Winners" : "Winner"}: {winners.join(", ")}
                  </p>
                )}

                {pastRound.round.status !== "completed" && (
                  <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                )}
              </div>

              <div className="flex-shrink-0 text-gray-400">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isExpanded && pastRound.round.status === "completed" && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                {isH2H ? (
                  <div className="space-y-2">
                    {pastRound.pairings.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <span className={p.points_a === 3 ? "font-bold text-green-700" : "text-gray-600"}>
                          {p.manager_a_name} ({p.score_a})
                        </span>
                        <span className="text-gray-400 font-mono">
                          {p.points_a} - {p.points_b}
                        </span>
                        <span className={p.points_b === 3 ? "font-bold text-green-700" : p.manager_b_id === 0 ? "text-gray-400 italic" : "text-gray-600"}>
                          {p.manager_b_id === 0 ? "BYE" : `${p.manager_b_name} (${p.score_b})`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {[...pastRound.results].sort((a, b) => a.rank - b.rank).map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-400 w-6">#{r.rank}</span>
                        <span className={`flex-1 ${r.rank <= 3 ? "font-bold text-gray-900" : "text-gray-600"}`}>
                          {r.manager_name}
                        </span>
                        <span className="text-gray-500 mr-3">Score: {r.score}</span>
                        <span className={r.points > 0 ? "font-bold text-green-700" : "text-gray-400"}>
                          {r.points > 0 ? `+${r.points}` : "0"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
