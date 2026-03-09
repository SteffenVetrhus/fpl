import { useLoaderData } from "react-router";
import { getEnvConfig } from "~/config/env";
import { getOptionalAuth } from "~/lib/pocketbase/auth";
import { createServerClient } from "~/lib/pocketbase/client";
import { MiniGameCard } from "~/components/MiniGameCard/MiniGameCard";
import { MiniGameLeaderboard } from "~/components/MiniGameLeaderboard/MiniGameLeaderboard";
import { MiniGamePairings } from "~/components/MiniGamePairings/MiniGamePairings";
import { MiniGameHistory } from "~/components/MiniGameHistory/MiniGameHistory";
import type { PastRound } from "~/components/MiniGameHistory/MiniGameHistory";
import {
  getOrCreateRound,
  isRevealed,
  getLeaderboard,
  getRoundHistory,
  getRoundPairings,
  getRoundResults,
  storeH2HResults,
  storeRankingResults,
} from "~/lib/mini-games/round-manager";
import { fetchLeagueData, calculateGameScores } from "~/lib/mini-games/data-fetcher";
import type { MiniGameRound, MiniGamePairing, MiniGameResult, MiniGameLeaderboardEntry } from "~/lib/mini-games/types";
import { MINI_GAMES } from "~/lib/mini-games/types";
import type { Route } from "./+types/mini-games";
import { Dice6 } from "lucide-react";

interface LoaderData {
  currentRound: MiniGameRound | null;
  isCurrentRevealed: boolean;
  countdownText: string | null;
  pairings: MiniGamePairing[];
  results: MiniGameResult[];
  leaderboard: MiniGameLeaderboardEntry[];
  pastRounds: PastRound[];
  currentManagerId: number | null;
  error: string | null;
}

export async function loader({ request }: Route.LoaderArgs): Promise<LoaderData> {
  const user = await getOptionalAuth(request);
  const config = getEnvConfig();

  const emptyResult: LoaderData = {
    currentRound: null,
    isCurrentRevealed: false,
    countdownText: null,
    pairings: [],
    results: [],
    leaderboard: [],
    pastRounds: [],
    currentManagerId: user?.fplManagerId ?? null,
    error: null,
  };

  try {
    const pb = createServerClient(request);
    const leagueData = await fetchLeagueData(config.fplLeagueId);

    // Determine which gameweek to use
    const targetEvent = leagueData.currentEvent ?? leagueData.nextEvent;
    if (!targetEvent) {
      return { ...emptyResult, error: "No active or upcoming gameweek found." };
    }

    // Get or create round for this gameweek
    const round = await getOrCreateRound(
      pb,
      config.fplLeagueId,
      targetEvent.id,
      targetEvent.deadline_time
    );

    const revealed = isRevealed(round);

    // Calculate countdown text if not revealed
    let countdownText: string | null = null;
    if (!revealed) {
      const revealDate = new Date(round.reveal_time);
      const now = new Date();
      const diffMs = revealDate.getTime() - now.getTime();
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        countdownText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }
    }

    // If GW is finished and round not completed, calculate results
    let pairings: MiniGamePairing[] = [];
    let results: MiniGameResult[] = [];

    if (targetEvent.finished && round.status !== "completed") {
      try {
        const scores = await calculateGameScores(
          round.game_index,
          targetEvent.id,
          leagueData.standings
        );

        if (round.game_type === "h2h") {
          pairings = await storeH2HResults(pb, round, leagueData.managers, scores);
        } else {
          results = await storeRankingResults(pb, round, scores);
        }

        // Update round status in our local reference
        round.status = "completed";
      } catch (err) {
        console.error("[mini-games] Failed to calculate results:", err);
      }
    } else if (round.status === "completed") {
      // Fetch existing results
      if (round.game_type === "h2h") {
        pairings = await getRoundPairings(pb, round.id);
      } else {
        results = await getRoundResults(pb, round.id);
      }
    }

    // Fetch leaderboard
    const leaderboard = await getLeaderboard(pb, config.fplLeagueId);

    // Fetch past rounds history
    const historyRounds = await getRoundHistory(pb, config.fplLeagueId, 10);
    const pastRounds: PastRound[] = [];

    for (const histRound of historyRounds) {
      if (histRound.id === round.id) continue; // Skip current round

      const roundPairings = histRound.game_type === "h2h"
        ? await getRoundPairings(pb, histRound.id)
        : [];
      const roundResults = histRound.game_type === "ranking"
        ? await getRoundResults(pb, histRound.id)
        : [];

      pastRounds.push({
        round: histRound,
        pairings: roundPairings,
        results: roundResults,
      });
    }

    return {
      currentRound: round,
      isCurrentRevealed: revealed,
      countdownText,
      pairings,
      results,
      leaderboard,
      pastRounds,
      currentManagerId: user?.fplManagerId ?? null,
      error: null,
    };
  } catch (err) {
    console.error("[mini-games] Loader error:", err);
    return {
      ...emptyResult,
      error: "Failed to load mini games. Make sure PocketBase is running and collections are configured.",
    };
  }
}

export default function MiniGames({ loaderData }: Route.ComponentProps) {
  const {
    currentRound,
    isCurrentRevealed,
    countdownText,
    pairings,
    results,
    leaderboard,
    pastRounds,
    currentManagerId,
    error,
  } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-minigames)" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-minigames)" }}>
        <div className="kit-watermark">GAMES</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-minigames-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Weekly challenges for your league
          </p>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            MINI GAMES
          </h1>
          <p
            className="text-white/70 text-base md:text-lg mt-4 max-w-xl kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            Each gameweek, a random challenge is revealed. Compete head-to-head or climb the rankings
            to earn points on the mini game leaderboard!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 -mt-8 pb-24 relative z-10 space-y-8">
        {error && (
          <div className="kit-card p-6 bg-red-50 border border-red-200">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-500 text-sm mt-2">
              Ensure PocketBase is running and the mini_game_rounds, mini_game_pairings,
              and mini_game_results collections exist.
            </p>
          </div>
        )}

        {/* Current Game */}
        <section>
          <h2 className="kit-headline text-white text-xl md:text-2xl mb-4 kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
            THIS WEEK&apos;S GAME
          </h2>
          <MiniGameCard
            round={currentRound}
            isRevealed={isCurrentRevealed}
            countdownText={countdownText ?? undefined}
          />
        </section>

        {/* Results / Pairings */}
        {currentRound && isCurrentRevealed && (
          <section className="kit-animate-slide-up" style={{ "--delay": "400ms" } as React.CSSProperties}>
            <h2 className="kit-headline text-white text-xl md:text-2xl mb-4">
              {currentRound.game_type === "h2h" ? "MATCHUPS" : "RESULTS"}
            </h2>
            <MiniGamePairings
              pairings={pairings}
              results={results}
              gameType={currentRound.game_type}
              isCompleted={currentRound.status === "completed"}
            />
          </section>
        )}

        {/* Leaderboard */}
        <section className="kit-animate-slide-up" style={{ "--delay": "500ms" } as React.CSSProperties}>
          <h2 className="kit-headline text-white text-xl md:text-2xl mb-4">
            SEASON LEADERBOARD
          </h2>
          <MiniGameLeaderboard
            entries={leaderboard}
            currentManagerId={currentManagerId ?? undefined}
          />
        </section>

        {/* History */}
        {pastRounds.length > 0 && (
          <section className="kit-animate-slide-up" style={{ "--delay": "600ms" } as React.CSSProperties}>
            <h2 className="kit-headline text-white text-xl md:text-2xl mb-4">
              PAST ROUNDS
            </h2>
            <MiniGameHistory pastRounds={pastRounds} />
          </section>
        )}

        {/* Game catalog footer */}
        <section className="kit-animate-slide-up" style={{ "--delay": "700ms" } as React.CSSProperties}>
          <h2 className="kit-headline text-white text-xl md:text-2xl mb-4">
            ALL GAMES
          </h2>
          <GameCatalog />
        </section>
      </main>
    </div>
  );
}

function GameCatalog() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {MINI_GAMES.map((game) => {
        const GameIcon = game.icon;
        const isH2H = game.type === "h2h";

        return (
          <div key={game.index} className="kit-card p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-page-minigames)" }}
            >
              <GameIcon size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{game.name}</p>
              <p className="text-xs text-gray-500 truncate">{game.description}</p>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {isH2H ? "H2H" : "Rank"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
