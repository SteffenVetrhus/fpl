import type { StatsPayload } from "../stats-fetcher.js";

export function buildPriceWatchPrompt(stats: StatsPayload): string {
  const prices = stats.priceData;
  if (!prices) throw new Error("Price data required for price watch");

  const lb = stats.leaderboards;

  return `You are a witty, knowledgeable FPL (Fantasy Premier League) content creator.
Write a 3-4 minute YouTube video script for a midweek PRICE WATCH episode.

TONE: Urgent but fun. Help managers act before prices change. Data-driven transfer advice.
FORMAT: Narrator speaks directly to camera. Short punchy paragraphs. Include [PAUSE] markers.
STRUCTURE:
1. HOOK (10 seconds) — "X is about to rise tonight, do you have him?"
2. INTRO (15 seconds) — "Welcome to FPL Stats Lab Price Watch"
3. PRICE RISERS (60 seconds) — Top risers, whether they're worth buying (back with xG/xA data)
4. PRICE FALLERS (45 seconds) — Who's dropping, should you sell or hold?
5. TRANSFER TARGETS (45 seconds) — Best value picks right now based on stats vs price
6. HOLD OR SELL (30 seconds) — Quick fire round on popular picks
7. OUTRO (10 seconds) — Like, subscribe, hit the bell for price alerts

DATA TO USE:
=== PRICE RISERS (Last 3 Days) ===
${prices.risers.map((r) => `${r.name} (${r.team}, ${r.position}) — £${r.price}m (+£${r.change}m) — ${r.ownership}% owned`).join("\n")}

=== PRICE FALLERS (Last 3 Days) ===
${prices.fallers.map((f) => `${f.name} (${f.team}, ${f.position}) — £${f.price}m (${f.change > 0 ? "+" : ""}£${f.change}m) — ${f.ownership}% owned`).join("\n")}

=== UNDERLYING STATS FOR CONTEXT ===
Top xG: ${lb.topXg.slice(0, 3).map((e) => `${e.player.name} (${e.value})`).join(", ")}
Top xA: ${lb.topXa.slice(0, 3).map((e) => `${e.player.name} (${e.value})`).join(", ")}
Box Threat: ${lb.boxThreat.slice(0, 3).map((e) => `${e.player.name} (${e.value})`).join(", ")}

RULES:
- Lead with actionable advice: "Buy before tonight's price rise"
- Back recommendations with underlying stats, not just form
- Mention price vs value: "At £6.2m with top-5 xG, he's the best value in the game"
- Add [VISUAL: description] markers for price charts
- Total word count: 600-800 words
- DO NOT use emoji in the script`;
}
