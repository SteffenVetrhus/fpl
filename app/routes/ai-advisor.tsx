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
import {
  identifySellCandidates,
  findReplacements,
} from "~/utils/transfer-score";
import { getChipStatuses } from "~/utils/chip-strategy";
import { isAdvisorAvailable, getAdvisorAdvice } from "~/lib/ai/advisor";
import type { AdvisorSection } from "~/lib/ai/advisor";
import { buildAdvisorPrompt } from "~/lib/ai/prompts";
import {
  buildSquadPlayers,
  buildManagerForm,
  buildRivalSnapshots,
  buildTransferMarketInsights,
  buildSquadBalance,
  getSeasonPhase,
  summarizeChipWindows,
} from "~/utils/advisor-data";
import type { RivalSnapshot, ManagerFormTrend } from "~/utils/advisor-data";
import {
  Brain,
  Key,
  Sparkles,
  Crown,
  ArrowRightLeft,
  Shield,
  Gem,
  Timer,
  Swords,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  if (!isAdvisorAvailable()) {
    return { available: false as const, error: "ANTHROPIC_API_KEY not set" };
  }

  const config = getEnvConfig();
  const managerId = user.fplManagerId.toString();

  try {
    const [bootstrap, fixtures, league, entry, history] = await Promise.all([
      fetchBootstrapStatic(),
      fetchFixtures(),
      fetchLeagueStandings(config.fplLeagueId),
      fetchManagerEntry(managerId),
      fetchManagerHistory(managerId),
    ]);

    const currentGW =
      bootstrap.events.find((e) => e.is_current)?.id ??
      bootstrap.events.find((e) => e.is_next)?.id ??
      1;
    const nextGW =
      bootstrap.events.find((e) => e.is_next)?.id ?? currentGW + 1;
    const totalGWs = bootstrap.events.length;

    const picks = await fetchGameweekPicks(managerId, currentGW);

    // Build enriched squad data
    const squad = buildSquadPlayers(
      picks.picks,
      bootstrap.elements,
      fixtures,
      bootstrap.teams,
      nextGW
    );

    const managerForm = buildManagerForm(
      `${entry.player_first_name} ${entry.player_last_name}`,
      entry.name,
      history.current,
      entry.summary_overall_rank
    );

    const squadBalance = buildSquadBalance(squad, entry.last_deadline_bank);

    // Fetch rival data in parallel
    const rivalEntries = league.standings.results
      .filter((r) => r.entry !== user.fplManagerId)
      .slice(0, 8);

    const [rivalHistoriesArr, rivalChipsArr] = await Promise.all([
      Promise.all(
        rivalEntries.map((r) =>
          fetchManagerHistory(r.entry.toString()).catch(() => ({
            current: [],
            past: [],
            chips: [],
          }))
        )
      ),
      Promise.all(
        rivalEntries.map((r) =>
          fetchManagerHistory(r.entry.toString())
            .then((h) => h.chips)
            .catch(() => [])
        )
      ),
    ]);

    const rivalHistories = new Map(
      rivalEntries.map((r, i) => [r.entry, rivalHistoriesArr[i].current])
    );
    const rivalChips = new Map(
      rivalEntries.map((r, i) => [r.entry, rivalChipsArr[i]])
    );

    const rivals = buildRivalSnapshots(
      league.standings.results,
      rivalHistories,
      rivalChips,
      user.fplManagerId
    );

    // Captain picks
    const captainPicks = rankCaptainCandidates(
      bootstrap.elements,
      fixtures,
      bootstrap.teams,
      nextGW,
      5
    );

    // Sell alerts
    const sellCandidates = identifySellCandidates(
      picks.picks,
      bootstrap.elements,
      fixtures,
      bootstrap.teams,
      nextGW
    );

    // Top buys across attacking positions
    const currentTeamIds = new Set(picks.picks.map((p) => p.element));
    const topBuys = [2, 3, 4]
      .flatMap((pos) =>
        findReplacements(
          pos,
          15,
          currentTeamIds,
          bootstrap.elements,
          fixtures,
          bootstrap.teams,
          nextGW,
          4
        )
      )
      .sort((a, b) => b.transferScore - a.transferScore)
      .slice(0, 6);

    // Chip status
    const chipStatuses = getChipStatuses(history.chips);
    const chipsAvailable = chipStatuses
      .filter((c) => !c.used)
      .map((c) => c.chipLabel);

    // Chip windows
    const chipWindows = summarizeChipWindows(
      fixtures,
      bootstrap.teams,
      bootstrap.events,
      nextGW
    );

    // Transfer market insights
    const transferMarket = buildTransferMarketInsights(
      bootstrap.elements,
      bootstrap.teams
    );

    // Season phase
    const seasonPhase = getSeasonPhase(currentGW, totalGWs);

    // Get deadline
    const nextEvent = bootstrap.events.find((e) => e.is_next);
    const deadlineTime = nextEvent?.deadline_time ?? null;

    // Build prompt and get AI advice
    const prompt = buildAdvisorPrompt({
      managerName: `${entry.player_first_name} ${entry.player_last_name}`,
      teamName: entry.name,
      bank: entry.last_deadline_bank,
      overallRank: entry.summary_overall_rank,
      nextGameweek: nextGW,
      gameweeksRemaining: totalGWs - currentGW,
      seasonPhase,
      managerForm,
      currentSquad: squad,
      squadBalance,
      chipsAvailable,
      chipWindows,
      topCaptainPicks: captainPicks,
      sellAlerts: sellCandidates,
      topBuys,
      rivals,
      transferMarket,
    });

    const response = await getAdvisorAdvice(prompt);

    return {
      available: true as const,
      sections: response.sections,
      model: response.model,
      managerName: `${entry.player_first_name} ${entry.player_last_name}`,
      teamName: entry.name,
      nextGW,
      overallRank: entry.summary_overall_rank,
      managerForm,
      rivals: rivals.slice(0, 5),
      chipsAvailable,
      seasonPhase,
      deadlineTime,
    };
  } catch (error) {
    return {
      available: false as const,
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ── Section icon + color mapping ─────────────────────────────────────

const SECTION_CONFIG: Record<
  string,
  { icon: typeof Brain; gradient: string; accent: string }
> = {
  verdict: {
    icon: Zap,
    gradient: "from-indigo-500 to-purple-600",
    accent: "text-indigo-600",
  },
  "captain-pick": {
    icon: Crown,
    gradient: "from-amber-500 to-orange-600",
    accent: "text-amber-600",
  },
  "starting-xi-check": {
    icon: Shield,
    gradient: "from-emerald-500 to-teal-600",
    accent: "text-emerald-600",
  },
  "transfer-priority": {
    icon: ArrowRightLeft,
    gradient: "from-blue-500 to-cyan-600",
    accent: "text-blue-600",
  },
  "differential-edge": {
    icon: Gem,
    gradient: "from-pink-500 to-rose-600",
    accent: "text-pink-600",
  },
  "chip-strategy": {
    icon: Timer,
    gradient: "from-violet-500 to-fuchsia-600",
    accent: "text-violet-600",
  },
  "rival-watch": {
    icon: Swords,
    gradient: "from-red-500 to-rose-600",
    accent: "text-red-600",
  },
};

function getConfig(id: string) {
  return (
    SECTION_CONFIG[id] ?? {
      icon: Sparkles,
      gradient: "from-gray-500 to-gray-600",
      accent: "text-gray-600",
    }
  );
}

// ── Trend icon helper ────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: "rising" | "falling" | "steady" }) {
  if (trend === "rising")
    return <TrendingUp size={14} className="text-emerald-500" />;
  if (trend === "falling")
    return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-gray-400" />;
}

// ── Render markdown-lite content ─────────────────────────────────────

function AdviceContent({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (line.trim() === "") return null;

        // Bold emphasis lines
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-gray-900">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }

        // Bullet points
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <p
              key={i}
              className="text-gray-700 pl-4 border-l-2 border-indigo-200 ml-1"
            >
              {renderInlineBold(line.replace(/^[-*] /, ""))}
            </p>
          );
        }

        // Numbered items
        if (/^\d+\.\s/.test(line)) {
          return (
            <p key={i} className="text-gray-700 pl-4 border-l-2 border-indigo-200 ml-1">
              {renderInlineBold(line)}
            </p>
          );
        }

        return (
          <p key={i} className="text-gray-700">
            {renderInlineBold(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// ── Section card component ───────────────────────────────────────────

function SectionCard({
  section,
  index,
}: {
  section: AdvisorSection;
  index: number;
}) {
  const config = getConfig(section.id);
  const Icon = config.icon;
  const isVerdict = section.id === "verdict";

  return (
    <div
      className="kit-card overflow-hidden kit-animate-slide-up"
      style={{ "--delay": `${index * 80}ms` } as React.CSSProperties}
    >
      {/* Section header bar */}
      <div
        className={`bg-gradient-to-r ${config.gradient} px-5 py-3 flex items-center gap-2.5`}
      >
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Icon size={16} color="white" />
        </div>
        <h3 className="kit-headline text-white text-sm tracking-wider">
          {section.title}
        </h3>
      </div>

      {/* Content */}
      <div className={`p-5 ${isVerdict ? "bg-indigo-50/50" : ""}`}>
        {isVerdict ? (
          <p className="text-lg font-semibold text-indigo-900 leading-relaxed">
            {renderInlineBold(section.content)}
          </p>
        ) : (
          <AdviceContent text={section.content} />
        )}
      </div>
    </div>
  );
}

// ── Main page component ──────────────────────────────────────────────

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
            {("error" in loaderData &&
              loaderData.error === "ANTHROPIC_API_KEY not set") ? (
              <>
                <Key size={48} className="text-gray-300 mx-auto mb-4" />
                <h2 className="kit-headline text-xl text-gray-900 mb-2">
                  Setup Required
                </h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Add ANTHROPIC_API_KEY to your .env file to enable AI-powered
                  advice.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle
                  size={48}
                  className="text-amber-400 mx-auto mb-4"
                />
                <h2 className="kit-headline text-xl text-gray-900 mb-2">
                  Something Went Wrong
                </h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  {"error" in loaderData ? loaderData.error : "Unknown error"}
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  const {
    sections,
    model,
    managerName,
    teamName,
    nextGW,
    overallRank,
    managerForm,
    rivals,
    chipsAvailable,
    seasonPhase,
    deadlineTime,
  } = loaderData;

  const deadline = deadlineTime
    ? new Date(deadlineTime).toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

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
            <div>
              <p className="text-white/70 text-sm font-medium tracking-wider uppercase">
                GW{nextGW} Briefing
              </p>
              {deadline && (
                <p className="text-white/40 text-xs">Deadline: {deadline}</p>
              )}
            </div>
          </div>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            AI Advisor
          </h1>
          <p className="text-white/60 mt-3 max-w-lg">
            Elite analysis for {managerName} ({teamName})
          </p>
        </div>
      </section>

      {/* Manager context strip */}
      <div className="max-w-4xl mx-auto px-4 -mt-14 relative z-10 mb-4">
        <div
          className="kit-card p-4 kit-animate-slide-up flex flex-wrap items-center gap-4 text-sm"
          style={{ "--delay": "0ms" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2">
            <Users size={14} className="text-indigo-500" />
            <span className="text-gray-500">Rank</span>
            <span className="font-bold text-gray-900">
              {overallRank.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon trend={managerForm.trend} />
            <span className="text-gray-500">Form</span>
            <span className="font-bold text-gray-900">
              {managerForm.avgLast5} avg
            </span>
            <span className="text-gray-400 text-xs">
              ({managerForm.trend})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-violet-500" />
            <span className="text-gray-500">Chips</span>
            <span className="font-bold text-gray-900">
              {chipsAvailable.length > 0
                ? chipsAvailable.join(", ")
                : "None left"}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span
              className={`kit-badge text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                seasonPhase === "endgame"
                  ? "bg-red-100 text-red-700"
                  : seasonPhase === "late"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {seasonPhase} season
            </span>
          </div>
        </div>
      </div>

      {/* Advice sections */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
        {sections.map((section, i) => (
          <SectionCard key={section.id} section={section} index={i + 1} />
        ))}

        {/* Rival mini-table */}
        {rivals && rivals.length > 0 && (
          <div
            className="kit-card overflow-hidden kit-animate-slide-up"
            style={
              {
                "--delay": `${(sections.length + 1) * 80}ms`,
              } as React.CSSProperties
            }
          >
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Users size={16} color="white" />
              </div>
              <h3 className="kit-headline text-white text-sm tracking-wider">
                League Standings Context
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {rivals.map((rival, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-400 w-5 text-right font-mono text-xs">
                      #{i + 2}
                    </span>
                    <span className="font-medium text-gray-900 flex-1 truncate">
                      {rival.managerName}
                    </span>
                    <TrendIcon trend={rival.trend} />
                    <span className="text-gray-600 font-mono text-xs w-16 text-right">
                      {rival.totalPoints} pts
                    </span>
                    <span
                      className={`font-mono text-xs w-12 text-right ${
                        rival.pointsGap > 0
                          ? "text-red-500"
                          : rival.pointsGap < 0
                            ? "text-emerald-500"
                            : "text-gray-400"
                      }`}
                    >
                      {rival.pointsGap > 0 ? "+" : ""}
                      {rival.pointsGap}
                    </span>
                    <span className="text-gray-400 text-xs w-20 text-right truncate">
                      {rival.chipsRemaining.length > 0
                        ? `${rival.chipsRemaining.length} chips`
                        : "No chips"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="text-center text-xs text-indigo-200/60 pt-4 kit-animate-slide-up"
          style={
            {
              "--delay": `${(sections.length + 2) * 80}ms`,
            } as React.CSSProperties
          }
        >
          Powered by {model} · Analysis based on live FPL data · Not financial
          advice
        </div>
      </div>
    </main>
  );
}
