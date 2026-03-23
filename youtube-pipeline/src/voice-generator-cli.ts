import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "./config.js";

/**
 * CLI tool to generate voice audio from a narration.txt file.
 * Usage: GAMEWEEK=28 VIDEO_TYPE=gw-preview npm run voice
 */

async function main() {
  const config = loadConfig();
  const outputDir = join(config.outputDir, `${config.videoType}-gw${config.gameweek}`);
  const narrationPath = join(outputDir, "narration.txt");

  let narration: string;
  try {
    narration = await readFile(narrationPath, "utf-8");
  } catch {
    console.error(`No narration.txt found at ${narrationPath}`);
    console.error("Generate a script first, then run voice generation.");
    process.exit(1);
  }

  if (!config.elevenlabs.apiKey) {
    console.error("Set ELEVENLABS_API_KEY in .env to generate voice audio.");
    console.error("Get a key at https://elevenlabs.io");
    process.exit(1);
  }

  console.log("Generating voice with ElevenLabs...");
  const chunks = splitNarration(narration, 4500);
  const audioChunks: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Chunk ${i + 1}/${chunks.length}...`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": config.elevenlabs.apiKey,
        },
        body: JSON.stringify({
          text: chunks[i],
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
    }

    audioChunks.push(Buffer.from(await response.arrayBuffer()));
  }

  const audioPath = join(outputDir, "narration.mp3");
  await writeFile(audioPath, Buffer.concat(audioChunks));
  console.log(`Voice saved to ${audioPath}`);
}

function splitNarration(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence + " ";
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

main().catch((error) => {
  console.error("Voice generation failed:", error);
  process.exit(1);
});
