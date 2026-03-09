import type { Route } from "./+types/ai-advisor";
import { requireAuth } from "~/lib/pocketbase/auth";
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchLeagueStandings,
  fetchGameweekPicks,
  fetchManagerEntry,
  fetchManagerHistory,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { rankCaptainCandidates } from "~/utils/captain-score";
import { identifySellCandidates, findReplacements } from "~/utils/transfer-score";
import { getChipStatuses } from "~/utils/chip-strategy";
import { isAdvisorAvailable, getAdvisorAdvice } from "~/lib/ai/advisor";
import { buildAdvisorPrompt } from "~/lib/ai/prompts";
import { Brain, Key, Sparkles } from "lucide-react";

const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  if (!isAdvisorAvailable()) {
    return { available: false as const, error: "ANTHROPIC_API_KEY not set" };
  }

  const config = getEnvConfig();
  if (!config.fplManagerId) {
    return { available: false as const, error: "FPL_MANAGER_ID not set" };
  }

  try {
    const [bootstrap, fixtures, league, entry, history] = await Promise.all([
      fetchBootstrapStatic(),
      fetchFixtures(),
      fetchLeagueStandings(config.fplLeagueId),
      fetchManagerEntry(config.fplManagerId),
      fetchManagerHistory(config.fplManagerId),
    ]);

    const currentGW =
      bootstrap.events.find((e) => e.is_current)?.id ??
      bootstrap.events.find((e) => e.is_next)?.id ??
      1;
    const nextGW =
      bootstrap.events.find((e) => e.is_next)?.id ?? currentGW + 1;

    const picks = await fetchGameweekPicks(
      config.fplManagerId,
      currentGW
    );

    const playerMap = new Map(
      bootstrap.elements.map((p) => [p.id, p])
    );
    const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

    // Build squad data for prompt
    const currentSquad = picks.picks.map((pick) => {
      const player = playerMap.get(pick.element)!;
      const team = teamMap.get(player.team);

      // Get next fixture difficulty
      const gwFix = fixtures.filter(
        (f) =>
          f.event === nextGW &&
          (f.team_h === player.team || f.team_a === player.team)
      );
      let difficulty = 3;
      let opponent = "???";
      if (gwFix.length > 0) {
        const fix = gwFix[0];
        const isHome = fix.team_h === player.team;
        difficulty = isHome ? fix.team_h_difficulty : fix.team_a_difficulty;
        const oppId = isHome ? fix.team_a : fix.team_h;
        const opp = teamMap.get(oppId);
        opponent = `${opp?.short_name ?? "???"}${isHome ? "(H)" : "(A)"}`;
      }

      return {
        name: player.web_name,
        team: team?.short_name ?? "???",
        position: POSITION_MAP[player.element_type] ?? "???",
        isCaptain: pick.is_captain,
        isOnBench: pick.position > 11,
        form: parseFloat(player.form) || 0,
        expectedPoints: parseFloat(player.ep_next ?? "0"),
        fixtureDifficulty: difficulty,
        opponent,
        status: player.status,
        chanceOfPlaying: player.chance_of_playing_next_round,
      };
    });

    // Captain picks
    const captainPicks = rankCaptainCandidates(
      bootstrap.elements,
      fixtures,
      bootstrap.teams,
      nextGW,
      5
    ).map((c) => ({
      name: c.webName,
      team: c.teamShort,
      captainScore: c.captainScore,
      opponent: c.opponent,
      form: parseFloat(
        bootstrap.elements.find((e) => e.id === c.playerId)?.form ?? "0"
      ),
    }));

    // Sell alerts
    const sellCandidates = identifySellCandidates(
      picks.picks,
      bootstrap.elements,
      fixtures,
      bootstrap.teams,
      nextGW
    ).map((s) => ({ name: s.player.webName, reasons: s.reasons }));

    // Top buys
    const currentTeamIds = new Set(picks.picks.map((p) => p.element));
    const topBuys = [3, 4] // MID and FWD
      .flatMap((pos) =>
        findReplacements(
          pos,
          15,
          currentTeamIds,
          bootstrap.elements,
          fixtures,
          bootstrap.teams,
          nextGW,
          3
        )
      )
      .sort((a, b) => b.transferScore - a.transferScore)
      .slice(0, 5)
      .map((b) => ({
        name: b.player.webName,
        team: b.player.teamShort,
        cost: b.player.cost,
        form: b.player.form,
        fixtureRun: b.fixtureRun,
      }));

    // Chip status
    const chipStatuses = getChipStatuses(history.chips);
    const chipsAvailable = chipStatuses
      .filter((c) => !c.used)
      .map((c) => c.chipLabel);

    // Build prompt and get AI advice
    const prompt = buildAdvisorPrompt({
      managerName: `${entry.player_first_name} ${entry.player_last_name}`,
      teamName: entry.name,
      bank: entry.last_deadline_bank,
      overallRank: entry.summary_overall_rank,
      nextGameweek: nextGW,
      currentSquad,
      chipsAvailable,
      topCaptainPicks: captainPicks,
      sellAlerts: sellCandidates,
      topBuys,
    });

    const response = await getAdvisorAdvice(prompt);

    return {
      available: true as const,
      advice: response.advice,
      model: response.model,
      managerName: `${entry.player_first_name} ${entry.player_last_name}`,
      teamName: entry.name,
      nextGW,
    };
  } catch (error) {
    return {
      available: false as const,
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export default function AIAdvisorPage({ loaderData }: Route.ComponentProps) {
  if (!loaderData.available) {
    return (
      <main className="min-h-screen" style={{ background: "#4338CA" }}>
        <section
          className="kit-hero kit-diagonal-cut relative"
          style={{
            background: "linear-gradient(135deg, #4338CA, #312E81)",
          }}
        >
          <div className="kit-stripe" style={{ background: "#6366F1" }} />
          <span className="kit-watermark">AI</span>
          <div className="relative z-10 w-full max-w-6xl mx-auto">
            <h1 className="kit-headline text-white text-5xl md:text-7xl">
              AI Advisor
            </h1>
          </div>
        </section>
        <div className="max-w-6xl mx-auto px-4 -mt-12 pb-16">
          <div className="kit-card p-8 text-center">
            <Key size={48} className="text-gray-300 mx-auto mb-4" />
            <h2 className="kit-headline text-xl text-gray-900 mb-2">
              Setup Required
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {"error" in loaderData && loaderData.error === "ANTHROPIC_API_KEY not set"
                ? "Add ANTHROPIC_API_KEY to your .env file to enable AI-powered advice."
                : "error" in loaderData && loaderData.error === "FPL_MANAGER_ID not set"
                  ? "Add FPL_MANAGER_ID to your .env file so the advisor knows which team to analyze."
                  : `Error: ${"error" in loaderData ? loaderData.error : "Unknown"}`}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { advice, model, managerName, teamName, nextGW } = loaderData;

  return (
    <main className="min-h-screen" style={{ background: "#4338CA" }}>
      {/* Hero */}
      <section
        className="kit-hero kit-diagonal-cut relative"
        style={{
          background: "linear-gradient(135deg, #4338CA, #312E81)",
        }}
      >
        <div className="kit-stripe" style={{ background: "#6366F1" }} />
        <span className="kit-watermark">AI</span>
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Brain size={24} color="white" />
            </div>
            <p className="text-white/70 text-sm font-medium tracking-wider uppercase">
              GW{nextGW} Briefing
            </p>
          </div>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            AI Advisor
          </h1>
          <p className="text-white/60 mt-3 max-w-lg">
            Personalized analysis for {managerName} ({teamName})
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 pb-16">
        <div
          className="kit-card p-8 kit-animate-slide-up"
          style={{ "--delay": "0ms" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={20} className="text-indigo-500" />
            <h2 className="kit-headline text-lg text-gray-900">
              Your GW{nextGW} Briefing
            </h2>
          </div>

          {/* Render advice as markdown-like content */}
          <div className="prose prose-sm max-w-none">
            {advice.split("\n").map((line, i) => {
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <h3
                    key={i}
                    className="kit-headline text-base text-indigo-700 mt-6 mb-2"
                  >
                    {line.replace(/\*\*/g, "")}
                  </h3>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h3
                    key={i}
                    className="kit-headline text-base text-indigo-700 mt-6 mb-2"
                  >
                    {line.replace("## ", "")}
                  </h3>
                );
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <p
                    key={i}
                    className="text-gray-700 pl-4 border-l-2 border-indigo-200 my-1"
                  >
                    {line.replace(/^[-*] /, "")}
                  </p>
                );
              }
              if (line.trim() === "") return <br key={i} />;
              return (
                <p key={i} className="text-gray-700 my-1">
                  {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                </p>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400">
            Powered by {model} · Analysis based on current FPL data ·
            Not financial advice
          </div>
        </div>
      </div>
    </main>
  );
}
