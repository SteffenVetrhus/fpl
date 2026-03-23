import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { PipelineConfig } from "./config.js";

/** Voice generation result */
export interface VoiceResult {
  audioPath: string;
  durationEstimate: number;
}

/**
 * Generate voice audio from narration text using ElevenLabs API.
 * Falls back to saving a placeholder if no API key is configured.
 */
export async function generateVoice(
  config: PipelineConfig,
  outputDir: string
): Promise<VoiceResult> {
  const narrationPath = join(outputDir, "narration.txt");
  const narration = await readFile(narrationPath, "utf-8");
  const audioPath = join(outputDir, "narration.mp3");

  if (!config.elevenlabs.apiKey) {
    console.log("No ElevenLabs API key — skipping voice generation");
    console.log("To generate voice, set ELEVENLABS_API_KEY in .env");
    await writeFile(
      join(outputDir, "voice-skipped.txt"),
      "Voice generation skipped: no ELEVENLABS_API_KEY configured.\n" +
      "You can manually generate audio from narration.txt using:\n" +
      "- ElevenLabs: https://elevenlabs.io\n" +
      "- OpenAI TTS: https://platform.openai.com/docs/guides/text-to-speech\n" +
      "- Google Cloud TTS: https://cloud.google.com/text-to-speech\n"
    );
    return {
      audioPath: "",
      durationEstimate: estimateDuration(narration),
    };
  }

  console.log("Generating voice with ElevenLabs...");

  // Split narration into chunks if too long (ElevenLabs limit is ~5000 chars)
  const chunks = splitNarration(narration, 4500);
  const audioChunks: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Generating chunk ${i + 1}/${chunks.length}...`);
    const chunk = await synthesizeChunk(config, chunks[i]);
    audioChunks.push(chunk);
  }

  // Concatenate audio chunks
  const fullAudio = Buffer.concat(audioChunks);
  await writeFile(audioPath, fullAudio);

  console.log(`Voice audio saved to ${audioPath}`);

  return {
    audioPath,
    durationEstimate: estimateDuration(narration),
  };
}

/** Call ElevenLabs TTS API for a single text chunk */
async function synthesizeChunk(config: PipelineConfig, text: string): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": config.elevenlabs.apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Split narration into chunks at sentence boundaries */
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

/** Estimate audio duration from text (rough: ~150 words per minute) */
function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil((words / 150) * 60);
}
