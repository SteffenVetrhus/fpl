import { loadConfig } from "./config.js";
import { fetchStatsPayload } from "./stats-fetcher.js";
import { generateScript, saveScript } from "./script-generator.js";
import { generateVoice } from "./voice-generator.js";
import { assembleVideo } from "./video-assembler.js";

async function main() {
  const args = process.argv.slice(2);
  const scriptOnly = args.includes("--script-only");
  const voiceOnly = args.includes("--voice-only");
  const videoOnly = args.includes("--video-only");

  const config = loadConfig();

  console.log("=== FPL Stats Lab — YouTube Pipeline ===");
  console.log(`Video type: ${config.videoType}`);
  console.log(`Gameweek: ${config.gameweek}`);
  console.log(`Output: ${config.outputDir}`);
  console.log("");

  // Step 1: Fetch stats from PocketBase
  console.log("[1/4] Fetching stats from PocketBase...");
  const stats = await fetchStatsPayload(config);
  console.log(`  Fetched ${Object.keys(stats.leaderboards).length} leaderboards`);
  if (stats.gameweekData) console.log(`  Gameweek ${stats.gameweekData.gameweek} data loaded`);
  if (stats.priceData) console.log(`  ${stats.priceData.risers.length} risers, ${stats.priceData.fallers.length} fallers`);
  console.log("");

  // Step 2: Generate script with Claude
  console.log("[2/4] Generating script with Claude...");
  const script = await generateScript(config, stats);
  const outputDir = await saveScript(config, script);
  console.log(`  Title: ${script.title}`);
  console.log(`  Sections: ${script.sections.length}`);
  console.log(`  Script saved to ${outputDir}`);
  console.log("");

  if (scriptOnly) {
    console.log("Script-only mode — stopping here.");
    console.log(`Output: ${outputDir}`);
    return;
  }

  // Step 3: Generate voice
  console.log("[3/4] Generating voice narration...");
  const voice = await generateVoice(config, outputDir);
  console.log(`  Estimated duration: ${voice.durationEstimate}s`);
  if (voice.audioPath) console.log(`  Audio: ${voice.audioPath}`);
  console.log("");

  if (voiceOnly) {
    console.log("Voice-only mode — stopping here.");
    console.log(`Output: ${outputDir}`);
    return;
  }

  // Step 4: Assemble video
  console.log("[4/4] Assembling video...");
  const video = await assembleVideo(config, outputDir, script, voice);
  if (video.videoPath) {
    console.log(`  Video: ${video.videoPath}`);
  } else {
    console.log("  Slide deck generated (no FFmpeg or audio available)");
  }
  console.log("");

  // Summary
  console.log("=== Pipeline Complete ===");
  console.log(`Output directory: ${outputDir}`);
  console.log("Files generated:");
  console.log("  - script.md       (full script with metadata)");
  console.log("  - narration.txt   (clean narration for TTS)");
  console.log("  - metadata.json   (title, tags, description)");
  if (voice.audioPath) console.log("  - narration.mp3   (voice audio)");
  if (video.videoPath) console.log("  - video.mp4       (final video)");
  else console.log("  - slides.html     (slide deck fallback)");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Review the script and make edits");
  console.log("  2. Upload to YouTube: npm run upload");
  console.log("  3. Add thumbnail and publish");
}

main().catch((error) => {
  console.error("Pipeline failed:", error);
  process.exit(1);
});
