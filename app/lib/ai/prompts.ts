/**
 * System prompts for Claude-powered FPL advisor
 */

export const FPL_ADVISOR_SYSTEM_PROMPT = `You are an expert Fantasy Premier League (FPL) advisor. You analyze FPL data and provide personalized, actionable advice to help managers make optimal decisions.

Your advice style:
- Direct and confident — don't hedge excessively
- Data-driven — reference specific numbers (form, xGI, fixture difficulty)
- Prioritized — lead with the most impactful actions
- Brief but thorough — cover captain, transfers, and chips concisely

Always structure your response with these sections:
1. **Captain Pick** — Your recommended captain with clear reasoning
2. **Transfer Priority** — 1-2 most impactful transfers to make (or "hold" if no good moves)
3. **Danger Watch** — Any players in the squad at risk (injury, bad form, tough fixtures)
4. **Chip Timing** — If a chip should be considered soon, mention it; otherwise skip this section

Keep your total response under 400 words. Be conversational but analytical.`;

/**
 * Build a user prompt with the manager's team data
 */
export function buildAdvisorPrompt(data: {
  managerName: string;
  teamName: string;
  bank: number;
  overallRank: number;
  nextGameweek: number;
  currentSquad: {
    name: string;
    team: string;
    position: string;
    isCaptain: boolean;
    isOnBench: boolean;
    form: number;
    expectedPoints: number;
    fixtureDifficulty: number;
    opponent: string;
    status: string;
    chanceOfPlaying: number | null;
  }[];
  chipsAvailable: string[];
  topCaptainPicks: {
    name: string;
    team: string;
    captainScore: number;
    opponent: string;
    form: number;
  }[];
  sellAlerts: {
    name: string;
    reasons: string[];
  }[];
  topBuys: {
    name: string;
    team: string;
    cost: number;
    form: number;
    fixtureRun: string[];
  }[];
}): string {
  const squad = data.currentSquad
    .map(
      (p) =>
        `${p.name} (${p.team}, ${p.position}${p.isCaptain ? ", C" : ""}${p.isOnBench ? ", BENCH" : ""}) — Form: ${p.form}, EP: ${p.expectedPoints.toFixed(1)}, vs ${p.opponent} (FDR ${p.fixtureDifficulty})${p.status !== "a" ? `, STATUS: ${p.status}` : ""}${p.chanceOfPlaying !== null && p.chanceOfPlaying < 100 ? `, ${p.chanceOfPlaying}% chance` : ""}`
    )
    .join("\n");

  const captains = data.topCaptainPicks
    .slice(0, 5)
    .map(
      (p) =>
        `${p.name} (${p.team}) — Score: ${p.captainScore.toFixed(1)}, vs ${p.opponent}, Form: ${p.form}`
    )
    .join("\n");

  const sells = data.sellAlerts
    .slice(0, 3)
    .map((p) => `${p.name}: ${p.reasons.join(", ")}`)
    .join("\n");

  const buys = data.topBuys
    .slice(0, 5)
    .map(
      (p) =>
        `${p.name} (${p.team}) — £${p.cost.toFixed(1)}m, Form: ${p.form}, Fixtures: ${p.fixtureRun.join(", ")}`
    )
    .join("\n");

  return `Analyze my FPL team for Gameweek ${data.nextGameweek} and give me advice.

**Manager:** ${data.managerName} (${data.teamName})
**Bank:** £${(data.bank / 10).toFixed(1)}m
**Overall Rank:** ${data.overallRank.toLocaleString()}
**Chips Available:** ${data.chipsAvailable.length > 0 ? data.chipsAvailable.join(", ") : "None"}

**My Squad:**
${squad}

**Top Captain Picks This Week:**
${captains}

**Players to Consider Selling:**
${sells || "None flagged"}

**Top Transfer Targets:**
${buys}

Give me your GW${data.nextGameweek} briefing.`;
}
