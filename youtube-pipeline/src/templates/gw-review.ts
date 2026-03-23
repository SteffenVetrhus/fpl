import type { StatsPayload } from "../stats-fetcher.js";

export function buildGwReviewPrompt(stats: StatsPayload): string {
  const gw = stats.gameweekData;
  if (!gw) throw new Error("Gameweek data required for GW review");

  return `You are a witty, knowledgeable FPL (Fantasy Premier League) content creator.
Write a 4-5 minute YouTube video script for a Gameweek ${gw.gameweek} REVIEW.

TONE: Entertaining, analytical. Celebrate big hauls, roast bad luck, always backed by data.
FORMAT: Narrator speaks directly to camera. Short punchy paragraphs. Include [PAUSE] markers.
STRUCTURE:
1. HOOK (10 seconds) — The most dramatic stat from the gameweek
2. INTRO (15 seconds) — "Welcome back to FPL Stats Lab" + GW summary
3. TOP PERFORMERS (60 seconds) — Who scored big and why (xG confirms or defies)
4. OVERPERFORMERS (45 seconds) — Players who scored more than xG suggested (lucky or clinical?)
5. UNDERPERFORMERS (45 seconds) — Players whose xG was high but returns were low
6. DEFENSIVE STANDOUTS (30 seconds) — Clean sheets backed by CBIT and goals prevented
7. WHAT WE LEARNED (30 seconds) — Key takeaways for next GW
8. OUTRO (15 seconds) — Like, subscribe, drop your GW score in comments

DATA TO USE:
=== TOP SCORERS (FPL Points) ===
${formatLeaderboard(gw.topScorers)}

=== TOP xG PERFORMERS ===
${formatLeaderboard(gw.topXgPerformers)}

=== BIGGEST OVERPERFORMERS (Goals above xG) ===
${formatLeaderboard(gw.biggestOverperformers)}

=== BIGGEST UNDERPERFORMERS (Goals below xG) ===
${formatLeaderboard(gw.biggestUnderperformers)}

=== TOP ASSISTS ===
${formatLeaderboard(gw.topAssists)}

=== TOP DEFENDERS (CBIT) ===
${formatLeaderboard(gw.topDefenders)}

RULES:
- Reference specific numbers from the data
- Compare actual performance vs expected (xG vs goals)
- Keep it fun — "Haaland's xG was 0.3 but he still found the net. Clinical or lucky? The data says..."
- Add [VISUAL: description] markers for charts/graphics
- Total word count: 800-1000 words
- DO NOT use emoji in the script`;
}

function formatLeaderboard(entries: { rank: number; player: { name: string; team: string; position: string }; value: number }[]): string {
  return entries
    .map((e) => `${e.rank}. ${e.player.name} (${e.player.team}, ${e.player.position}) — ${e.value}`)
    .join("\n");
}
