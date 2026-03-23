import type { StatsPayload } from "../stats-fetcher.js";

export function buildGwPreviewPrompt(stats: StatsPayload): string {
  const gw = stats.gameweekData?.gameweek ?? "upcoming";
  const lb = stats.leaderboards;

  return `You are a witty, knowledgeable FPL (Fantasy Premier League) content creator.
Write a 4-5 minute YouTube video script for a Gameweek ${gw} PREVIEW.

TONE: Confident, data-driven, slightly cheeky. Like a stats-savvy friend giving advice at the pub.
FORMAT: Narrator speaks directly to camera. Use short punchy paragraphs. Include natural pauses marked with [PAUSE].
STRUCTURE:
1. HOOK (10 seconds) — One surprising stat to grab attention
2. INTRO (20 seconds) — "Welcome to FPL Stats Lab" + what we're covering
3. CAPTAIN PICKS (60 seconds) — Top 2-3 captain choices backed by xG data
4. DIFFERENTIALS (60 seconds) — 2-3 under-owned players with great underlying stats
5. AVOID (30 seconds) — 1-2 players whose stats don't match their hype
6. PRICE WATCH (30 seconds) — Key price risers/fallers to act on
7. OUTRO (15 seconds) — Like, subscribe, see you after the gameweek

DATA TO USE:
=== CLINICAL XI (Goals above xG) ===
${formatLeaderboard(lb.clinicalXI)}

=== TOP xG LEADERS ===
${formatLeaderboard(lb.topXg)}

=== TOP xA LEADERS ===
${formatLeaderboard(lb.topXa)}

=== CREATIVE ENGINES (Chances Created) ===
${formatLeaderboard(lb.creativeEngines)}

=== BOX THREAT (Touches in Opposition Box) ===
${formatLeaderboard(lb.boxThreat)}

=== BIG CHANCE WASTERS ===
${formatLeaderboard(lb.bigChanceWasters)}

RULES:
- Reference specific numbers: "Salah leads with 12.4 xG" not "Salah has good underlying stats"
- Include FPL-relevant insight: price, ownership context where relevant
- Keep language accessible — explain xG briefly for newer viewers
- Add [VISUAL: description] markers for where charts/graphics should appear
- End each section with a natural transition
- Total word count: 800-1000 words
- DO NOT use emoji in the script`;
}

function formatLeaderboard(entries: { rank: number; player: { name: string; team: string; position: string }; value: number }[]): string {
  return entries
    .map((e) => `${e.rank}. ${e.player.name} (${e.player.team}, ${e.player.position}) — ${e.value}`)
    .join("\n");
}
