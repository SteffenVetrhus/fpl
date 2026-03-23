import type { StatsPayload } from "../stats-fetcher.js";

export function buildDeepDivePrompt(stats: StatsPayload): string {
  const lb = stats.leaderboards;

  return `You are a witty, knowledgeable FPL (Fantasy Premier League) content creator.
Write a 6-8 minute YouTube video script for a DEEP DIVE analytics episode.

TOPIC: "The Most Clinical Strikers This Season — Goals vs Expected Goals Breakdown"

TONE: Analytical but accessible. Like a football podcast meets a data science talk.
FORMAT: Narrator speaks directly to camera. Short punchy paragraphs. Include [PAUSE] markers.
STRUCTURE:
1. HOOK (15 seconds) — A shocking stat that defies conventional wisdom
2. INTRO (30 seconds) — What is xG and why FPL managers should care
3. THE CLINICAL XI (90 seconds) — Players outperforming xG the most. Are they genuinely clinical or just lucky?
4. THE UNDERPERFORMERS (60 seconds) — High xG, low goals. Buy-low candidates or avoid?
5. CREATIVE ENGINES (60 seconds) — xA leaders and chance creators — the hidden gems
6. BOX THREAT vs FINISHING (60 seconds) — Who gets into positions but can't finish?
7. DEFENSIVE DATA (45 seconds) — CBIT leaders, GK walls — set-and-forget picks
8. FPL TAKEAWAYS (45 seconds) — 3 actionable insights from the data
9. OUTRO (15 seconds) — Subscribe for weekly data-driven FPL content

DATA TO USE:
=== CLINICAL XI (Goals - xG) ===
${formatLeaderboard(lb.clinicalXI)}

=== TOP xG LEADERS ===
${formatLeaderboard(lb.topXg)}

=== TOP xA LEADERS ===
${formatLeaderboard(lb.topXa)}

=== CREATIVE ENGINES ===
${formatLeaderboard(lb.creativeEngines)}

=== BOX THREAT ===
${formatLeaderboard(lb.boxThreat)}

=== DEFENSIVE HEROES (CBIT) ===
${formatLeaderboard(lb.defensiveHeroes)}

=== DRIBBLE KINGS ===
${formatLeaderboard(lb.dribbleKings)}

=== GK WALL (Goals Prevented) ===
${formatLeaderboard(lb.gkWall)}

=== BIG CHANCE WASTERS ===
${formatLeaderboard(lb.bigChanceWasters)}

RULES:
- Deep analytical insights — go beyond the surface numbers
- Explain concepts: "xG measures the quality of chances. A penalty is ~0.76 xG, a header from 12 yards is ~0.15"
- Compare players head-to-head where interesting
- Add [VISUAL: description] markers for charts and comparisons
- Include a "hot take" that challenges conventional FPL wisdom
- Total word count: 1200-1600 words
- DO NOT use emoji in the script`;
}

function formatLeaderboard(entries: { rank: number; player: { name: string; team: string; position: string }; value: number }[]): string {
  return entries
    .map((e) => `${e.rank}. ${e.player.name} (${e.player.team}, ${e.player.position}) — ${e.value}`)
    .join("\n");
}
