/**
 * MiniGameCard - Displays the current/upcoming mini game
 */

import { Clock, Swords, BarChart3 } from "lucide-react";
import type { MiniGameRound } from "~/lib/mini-games/types";
import { MINI_GAMES } from "~/lib/mini-games/types";

export interface MiniGameCardProps {
  round: MiniGameRound | null;
  isRevealed: boolean;
  countdownText?: string;
}

export function MiniGameCard({ round, isRevealed, countdownText }: MiniGameCardProps) {
  if (!round) {
    return (
      <div className="kit-card p-8 text-center">
        <p className="text-gray-500 text-lg">No active mini game this gameweek</p>
        <p className="text-gray-400 text-sm mt-2">Check back when the next gameweek is announced!</p>
      </div>
    );
  }

  const game = MINI_GAMES[round.game_index];
  if (!game) return null;

  const GameIcon = game.icon;
  const isH2H = game.type === "h2h";

  if (!isRevealed) {
    return (
      <div className="kit-card p-8 text-center kit-animate-slide-up">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg">
          <Clock size={36} className="text-white animate-pulse" />
        </div>
        <h3 className="kit-headline text-2xl md:text-3xl text-gray-900 mb-2">
          MYSTERY GAME
        </h3>
        <p className="text-gray-500 mb-4">
          The next mini game will be revealed soon...
        </p>
        {countdownText && (
          <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 px-4 py-2 rounded-full text-sm font-semibold">
            <Clock size={14} />
            Reveals in {countdownText}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="kit-card overflow-hidden kit-animate-slide-up">
      {/* Game header band */}
      <div
        className="px-6 py-4 flex items-center gap-4"
        style={{ background: "var(--color-page-minigames)" }}
      >
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <GameIcon size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="kit-headline text-xl md:text-2xl text-white">
            {game.name}
          </h3>
          <p className="text-white/70 text-sm">{game.description}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider">
          {isH2H ? <Swords size={12} /> : <BarChart3 size={12} />}
          {isH2H ? "H2H" : "Ranking"}
        </div>
      </div>

      {/* Rules section */}
      <div className="p-6">
        <p className="text-gray-700 leading-relaxed">{game.rules}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {isH2H ? (
            <>
              <span className="kit-badge bg-green-100 text-green-700">Win = 3 pts</span>
              <span className="kit-badge bg-yellow-100 text-yellow-700">Draw = 1 pt</span>
              <span className="kit-badge bg-red-100 text-red-700">Loss = 0 pts</span>
            </>
          ) : (
            <>
              <span className="kit-badge bg-yellow-100 text-yellow-700">1st = 3 pts</span>
              <span className="kit-badge bg-gray-100 text-gray-700">2nd = 2 pts</span>
              <span className="kit-badge bg-orange-100 text-orange-700">3rd = 1 pt</span>
            </>
          )}
        </div>

        {round.status === "completed" && (
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
            Completed — Results below!
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Gameweek {round.gameweek}
        </p>
      </div>
    </div>
  );
}
