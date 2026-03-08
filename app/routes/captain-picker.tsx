import { fetchBootstrapStatic, fetchFixtures } from "~/lib/fpl-api/client";
import { rankCaptainCandidates } from "~/utils/captain-score";
import { Crown } from "lucide-react";
import type { Route } from "./+types/captain-picker";
import type { CaptainCandidate } from "~/utils/captain-score";

export async function loader() {
  const [bootstrap, fixtures] = await Promise.all([
    fetchBootstrapStatic(),
    fetchFixtures(),
  ]);

  const nextGW = bootstrap.events.find((e) => e.is_next);
  const nextGameweek = nextGW?.id ?? 1;
  const gameweekName = nextGW?.name ?? `Gameweek ${nextGameweek}`;

  const candidates = rankCaptainCandidates(
    bootstrap.elements,
    fixtures,
    bootstrap.teams,
    nextGameweek,
    15
  );

  return { candidates, gameweekName, nextGameweek };
}

const DIFFICULTY_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-green-100", text: "text-green-800" },
  2: { bg: "bg-emerald-100", text: "text-emerald-800" },
  3: { bg: "bg-amber-100", text: "text-amber-800" },
  4: { bg: "bg-orange-100", text: "text-orange-800" },
  5: { bg: "bg-red-100", text: "text-red-800" },
};

const BREAKDOWN_FACTORS: {
  key: keyof CaptainCandidate["breakdown"];
  label: string;
  color: string;
  weight: string;
}[] = [
  { key: "formScore", label: "Form", color: "bg-violet-500", weight: "25%" },
  { key: "fixtureScore", label: "Fixture", color: "bg-sky-500", weight: "20%" },
  { key: "expectedPointsScore", label: "xPts", color: "bg-emerald-500", weight: "30%" },
  { key: "availabilityScore", label: "Avail", color: "bg-amber-500", weight: "10%" },
  { key: "xgiScore", label: "xGI", color: "bg-rose-500", weight: "15%" },
];

function ScoreBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function CaptainPickerPage({ loaderData }: Route.ComponentProps) {
  const { candidates, gameweekName } = loaderData;

  const maxScore = candidates.length > 0 ? candidates[0].captainScore : 1;

  return (
    <div className="min-h-screen" style={{ background: "#D97706" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "#D97706" }}>
        <div className="kit-watermark">CAPTAIN</div>
        <div className="kit-stripe" style={{ background: "#F59E0B" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            {gameweekName} · Top captain picks
          </p>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            Captain Picker
          </h1>
          <div
            className="flex items-center gap-2 mt-4 kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            <Crown className="w-5 h-5 text-yellow-200" />
            <span className="text-white/80 text-sm font-medium">
              {candidates.length} candidates ranked
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16">
        {/* Candidate Cards */}
        <div className="space-y-4">
          {candidates.map((candidate, index) => {
            const isTop = index === 0;
            const delay = 100 + index * 60;
            const difficulty = DIFFICULTY_COLORS[candidate.fixtureDifficulty] ?? DIFFICULTY_COLORS[3];
            const scorePct = (candidate.captainScore / maxScore) * 100;

            return (
              <div
                key={candidate.playerId}
                className={`kit-card kit-animate-slide-up overflow-hidden ${
                  isTop ? "ring-2 ring-amber-400 ring-offset-2" : ""
                }`}
                style={{ "--delay": `${delay}ms` } as React.CSSProperties}
              >
                {isTop && (
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-bold uppercase tracking-wider">
                      Top Captain Pick
                    </span>
                  </div>
                )}

                <div className="p-4 md:p-6">
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${
                        isTop
                          ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="font-[Anton] text-xl md:text-2xl leading-none">
                        {index + 1}
                      </span>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`kit-headline text-xl md:text-2xl ${
                            isTop ? "text-amber-700" : "text-gray-900"
                          }`}
                        >
                          {candidate.webName}
                        </h3>
                        <span className={`${difficulty.bg} ${difficulty.text} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                          {candidate.opponent}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                        <span>{candidate.teamName}</span>
                        <span className="text-gray-300">|</span>
                        <span>{candidate.position}</span>
                        <span className="text-gray-300">|</span>
                        <span>&pound;{candidate.cost.toFixed(1)}m</span>
                        <span className="text-gray-300">|</span>
                        <span>{candidate.ownership}% owned</span>
                      </div>

                      {/* Overall Score Bar */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isTop
                                ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>
                        <span className="font-[Anton] text-lg text-gray-800 tabular-nums w-12 text-right">
                          {candidate.captainScore.toFixed(1)}
                        </span>
                      </div>

                      {/* Breakdown Bars */}
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {BREAKDOWN_FACTORS.map((factor) => (
                          <div key={factor.key} className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide block">
                              {factor.label}
                            </span>
                            <ScoreBar
                              value={candidate.breakdown[factor.key]}
                              color={factor.color}
                            />
                            <span className="text-[10px] text-gray-500 tabular-nums block">
                              {candidate.breakdown[factor.key].toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Score Breakdown Legend */}
        <div
          className="kit-card p-6 md:p-8 mt-8 kit-animate-slide-up"
          style={{ "--delay": `${100 + candidates.length * 60 + 100}ms` } as React.CSSProperties}
        >
          <h2 className="kit-headline text-xl text-gray-900 mb-4">Score Breakdown</h2>
          <p className="text-sm text-gray-500 mb-6">
            Each candidate is scored 0-10 across five weighted factors. The total captain score
            determines the ranking.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {BREAKDOWN_FACTORS.map((factor) => (
              <div key={factor.key} className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full ${factor.color} mt-0.5 flex-shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {factor.label}{" "}
                    <span className="text-gray-400 font-normal">({factor.weight})</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {factor.key === "formScore" && "Recent points per match performance"}
                    {factor.key === "fixtureScore" && "Opponent difficulty rating (FDR)"}
                    {factor.key === "expectedPointsScore" && "FPL projected points for next GW"}
                    {factor.key === "availabilityScore" && "Chance of playing next round"}
                    {factor.key === "xgiScore" && "Expected goals + assists per 90 mins"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-24 sm:pb-8 text-center">
        <p className="text-white/30 text-xs">
          Built with React Router v7 · Data from FPL API
        </p>
      </footer>
    </div>
  );
}
