/**
 * System prompts and prompt builder for Claude-powered FPL advisor
 */

import type {
  SquadPlayer,
  ManagerFormTrend,
  RivalSnapshot,
  TransferMarketInsight,
  SquadBalance,
} from "~/utils/advisor-data";
import type { CaptainCandidate } from "~/utils/captain-score";
import type { SellCandidate, BuyCandidate } from "~/utils/transfer-score";

export const FPL_ADVISOR_SYSTEM_PROMPT = `You are an elite Fantasy Premier League (FPL) analyst — the kind of advisor that top 1k managers consult before every deadline. You combine deep statistical analysis with practical FPL strategy.

## Your expertise
- xG/xA/xGI underlying data interpretation
- Fixture difficulty sequencing and rotation planning
- Captaincy EV maximization
- Transfer timing and price change management
- Chip strategy optimization (TC on DGW premiums, BB with strong bench, FH on blank GWs)
- Mini-league dynamics and differential strategy
- Bench optimization and auto-sub insurance

## Response structure
Always respond with these exact sections using ## headers:

## Verdict
One bold sentence summarizing the overall GW outlook for this manager.

## Captain Pick
Your #1 captain recommendation with clear data reasoning. Mention the runner-up VC option.

## Starting XI Check
Flag any issues: wrong bench order, injured starters, players with 0% chance. Recommend bench changes if needed.

## Transfer Priority
1-2 most impactful transfers with specific in/out swaps and reasoning. Consider multi-GW value, not just one week. Say "HOLD" only if the squad is genuinely strong.

## Differential Edge
If relevant: a low-ownership player already in the squad to start, or a left-field transfer that could gain ground on rivals.

## Chip Strategy
Only include if a chip should be activated THIS week or prepared for in the next 2-3 GWs. Reference specific DGW/BGW windows if they exist.

## Rival Watch
Brief note on league position dynamics — who's closing in, who has chips left, where the threats are.

## Rules
- Be direct and confident. Say "Captain Salah" not "You might want to consider Salah."
- Reference actual numbers: form ratings, xGI, FDR scores, expected points.
- Think multi-GW: a transfer that helps for 5 GWs beats one that helps for 1.
- Consider ownership and effective ownership in the mini-league context.
- If a player is flagged or doubtful, explicitly address the risk level.
- Keep total response under 600 words. Dense, not padded.
- Use player web names exactly as provided in the data.`;

// ── Prompt data interface ────────────────────────────────────────────

export interface AdvisorPromptData {
  managerName: string;
  teamName: string;
  bank: number;
  overallRank: number;
  nextGameweek: number;
  gameweeksRemaining: number;
  seasonPhase: string;
  managerForm: ManagerFormTrend;
  currentSquad: SquadPlayer[];
  squadBalance: SquadBalance;
  chipsAvailable: string[];
  chipWindows: string[];
  topCaptainPicks: CaptainCandidate[];
  sellAlerts: SellCandidate[];
  topBuys: BuyCandidate[];
  rivals: RivalSnapshot[];
  transferMarket: TransferMarketInsight;
}

/**
 * Build the comprehensive user prompt with all available data
 */
export function buildAdvisorPrompt(data: AdvisorPromptData): string {
  const sections: string[] = [];

  // Manager overview
  sections.push(`## Manager Overview
- **Name:** ${data.managerName} (${data.teamName})
- **Overall Rank:** ${data.overallRank.toLocaleString()}
- **Bank:** £${(data.bank / 10).toFixed(1)}m | **Squad Value:** £${data.squadBalance.totalValue.toFixed(1)}m
- **Season Phase:** ${data.seasonPhase} (GW${data.nextGameweek}, ${data.gameweeksRemaining} GWs left)
- **Form Trend:** ${data.managerForm.trend.toUpperCase()} — Last 5 GW avg: ${data.managerForm.avgLast5} pts (season avg: ${data.managerForm.seasonAvg})
- **Last 5 Scores:** ${data.managerForm.last5GWScores.join(", ")}
- **Rank Change (5 GW):** ${data.managerForm.rankChange5GW > 0 ? "+" : ""}${data.managerForm.rankChange5GW.toLocaleString()}
- **Chips Available:** ${data.chipsAvailable.length > 0 ? data.chipsAvailable.join(", ") : "None"}`);

  // Squad with full context
  const starting = data.currentSquad.filter((p) => !p.isOnBench);
  const bench = data.currentSquad.filter((p) => p.isOnBench);

  const formatPlayer = (p: SquadPlayer) => {
    let line = `${p.name} (${p.team}, ${p.position}`;
    if (p.isCaptain) line += ", C";
    if (p.isViceCaptain) line += ", VC";
    line += `) — £${p.cost.toFixed(1)}m, Form: ${p.form}, EP: ${p.expectedPoints.toFixed(1)}, xGI/90: ${p.xGIPer90}`;
    line += `, Next: vs ${p.opponent} (FDR ${p.fixtureDifficulty})`;
    line += `, Run: ${p.fixtureRun.slice(0, 5).join(", ")} (avg FDR ${p.avgFixtureDifficulty.toFixed(1)})`;
    if (p.status !== "a")
      line += `, STATUS: ${p.status}`;
    if (p.chanceOfPlaying !== null && p.chanceOfPlaying < 100)
      line += `, ${p.chanceOfPlaying}% chance`;
    line += `, Own: ${p.ownership}%`;
    return line;
  };

  sections.push(`## Starting XI\n${starting.map(formatPlayer).join("\n")}`);
  sections.push(`## Bench\n${bench.map(formatPlayer).join("\n")}`);

  // Squad balance
  const exposure = data.squadBalance.teamExposure
    .filter((t) => t.count >= 2)
    .map((t) => `${t.team} x${t.count}`)
    .join(", ");
  sections.push(`## Squad Balance
- Starting Value: £${data.squadBalance.startingValue.toFixed(1)}m | Bench Value: £${data.squadBalance.benchValue.toFixed(1)}m
- Team Exposure (2+): ${exposure || "Well diversified"}`);

  // Captain picks
  if (data.topCaptainPicks.length > 0) {
    const caps = data.topCaptainPicks.slice(0, 5).map(
      (c) =>
        `${c.webName} (${c.teamShort}) — Score: ${c.captainScore.toFixed(1)}, vs ${c.opponent}, Form: ${parseFloat((c as any).form ?? "0") || c.captainScore}, ${c.isHome ? "HOME" : "AWAY"}`
    );
    sections.push(`## Top Captain Picks\n${caps.join("\n")}`);
  }

  // Sell alerts
  if (data.sellAlerts.length > 0) {
    const sells = data.sellAlerts.slice(0, 4).map(
      (s) => `${s.player.webName} (${s.urgency.toUpperCase()}): ${s.reasons.join(", ")}`
    );
    sections.push(`## Sell Alerts\n${sells.join("\n")}`);
  }

  // Buy candidates
  if (data.topBuys.length > 0) {
    const buys = data.topBuys.slice(0, 6).map(
      (b) =>
        `${b.player.webName} (${b.player.teamShort}, ${b.player.position}) — £${b.player.cost.toFixed(1)}m, Form: ${b.player.form}, Fixtures: ${b.fixtureRun.join(", ")}`
    );
    sections.push(`## Top Transfer Targets\n${buys.join("\n")}`);
  }

  // Rival context
  if (data.rivals.length > 0) {
    const rivs = data.rivals.slice(0, 5).map(
      (r) =>
        `${r.managerName} — ${r.totalPoints}pts (${r.pointsGap > 0 ? "+" : ""}${r.pointsGap} gap), ${r.trend}, Chips left: ${r.chipsRemaining.length > 0 ? r.chipsRemaining.join(", ") : "None"}`
    );
    sections.push(`## League Rivals\n${rivs.join("\n")}`);
  }

  // Transfer market
  if (data.transferMarket.mostTransferredIn.length > 0) {
    const trending = data.transferMarket.mostTransferredIn
      .slice(0, 3)
      .map((t) => `${t.name} (${t.team}) +${t.netTransfers.toLocaleString()}`)
      .join(", ");
    sections.push(`## Transfer Market Trends\n- Most transferred in: ${trending}`);

    if (data.transferMarket.priceRisers.length > 0) {
      const risers = data.transferMarket.priceRisers
        .slice(0, 3)
        .map((t) => `${t.name} (+£${t.costChange.toFixed(1)}m)`)
        .join(", ");
      sections.push(`- Price risers: ${risers}`);
    }
  }

  // Chip windows
  if (data.chipWindows.length > 0) {
    sections.push(`## Upcoming Chip Windows\n${data.chipWindows.join("\n")}`);
  }

  return `Analyze my FPL team for Gameweek ${data.nextGameweek} and give your elite advisory briefing.\n\n${sections.join("\n\n")}`;
}
