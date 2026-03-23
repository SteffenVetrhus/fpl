import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "./config.js";
import { fetchStatsPayload } from "./stats-fetcher.js";
import { buildGwPreviewPrompt } from "./templates/gw-preview.js";
import { buildGwReviewPrompt } from "./templates/gw-review.js";
import { buildPriceWatchPrompt } from "./templates/price-watch.js";
import { buildDeepDivePrompt } from "./templates/deep-dive.js";
import type { VideoType } from "./config.js";
import type { StatsPayload } from "./stats-fetcher.js";

const PROMPT_BUILDERS: Record<VideoType, (stats: StatsPayload) => string> = {
  "gw-preview": buildGwPreviewPrompt,
  "gw-review": buildGwReviewPrompt,
  "price-watch": buildPriceWatchPrompt,
  "deep-dive": buildDeepDivePrompt,
};

async function main() {
  const config = loadConfig();

  console.log("=== FPL Stats Lab — Fetch Stats ===");
  console.log(`Video type: ${config.videoType}`);
  console.log(`Gameweek: ${config.gameweek}`);
  console.log("");

  // Step 1: Fetch stats from PocketBase
  console.log("Fetching stats from PocketBase...");
  const stats = await fetchStatsPayload(config);
  console.log(`  Fetched ${Object.keys(stats.leaderboards).length} leaderboards`);
  if (stats.gameweekData) console.log(`  Gameweek ${stats.gameweekData.gameweek} data loaded`);
  if (stats.priceData) console.log(`  ${stats.priceData.risers.length} risers, ${stats.priceData.fallers.length} fallers`);

  // Step 2: Save stats JSON
  const outputDir = join(config.outputDir, `${config.videoType}-gw${config.gameweek}`);
  await mkdir(outputDir, { recursive: true });

  const statsPath = join(outputDir, "stats.json");
  await writeFile(statsPath, JSON.stringify(stats, null, 2));
  console.log(`\nStats saved to ${statsPath}`);

  // Step 3: Build and save the prompt for Claude Code
  const promptBuilder = PROMPT_BUILDERS[config.videoType];
  const prompt = promptBuilder(stats);
  const promptPath = join(outputDir, "prompt.txt");
  await writeFile(promptPath, prompt);
  console.log(`Prompt saved to ${promptPath}`);

  console.log("\n=== Ready for Claude Code ===");
  console.log(`Next: Claude Code reads ${promptPath} and generates the script.`);
  console.log(`Output goes to: ${outputDir}/`);
}

main().catch((error) => {
  console.error("Fetch failed:", error);
  process.exit(1);
});
