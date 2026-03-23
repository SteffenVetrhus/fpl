import { writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type { PipelineConfig } from "./config.js";
import type { GeneratedScript } from "./script-generator.js";
import type { VoiceResult } from "./voice-generator.js";

/** Video assembly result */
export interface VideoResult {
  videoPath: string;
  duration: number;
}

/**
 * Assemble a video from audio narration and generated slide images.
 * Uses FFmpeg to combine static images with audio.
 *
 * For now, generates a simple slideshow video with colored backgrounds
 * and text overlays. Can be upgraded to Remotion for React component rendering.
 */
export async function assembleVideo(
  config: PipelineConfig,
  outputDir: string,
  script: GeneratedScript,
  voice: VoiceResult
): Promise<VideoResult> {
  const videoPath = join(outputDir, "video.mp4");

  // Check if FFmpeg is available
  if (!isFFmpegAvailable()) {
    console.log("FFmpeg not found — generating slide deck instead");
    await generateSlideDeck(outputDir, script);
    return { videoPath: "", duration: voice.durationEstimate };
  }

  // If we have audio, create video with slides + audio
  if (voice.audioPath) {
    await createVideoWithAudio(outputDir, script, voice.audioPath, videoPath);
  } else {
    // No audio — just create slides
    await generateSlideDeck(outputDir, script);
  }

  return { videoPath, duration: voice.durationEstimate };
}

function isFFmpegAvailable(): boolean {
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Create video by combining slide images with audio using FFmpeg */
async function createVideoWithAudio(
  outputDir: string,
  script: GeneratedScript,
  audioPath: string,
  videoPath: string
): Promise<void> {
  const slidesDir = join(outputDir, "slides");
  await mkdir(slidesDir, { recursive: true });

  // Generate slide images using FFmpeg's drawtext filter
  const sections = script.sections;
  const slideListPath = join(slidesDir, "slides.txt");
  const slideEntries: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const slidePath = join(slidesDir, `slide_${i.toString().padStart(2, "0")}.png`);
    const duration = parseDuration(section.durationHint);

    // Generate a slide image with FFmpeg
    const bgColor = getSlideColor(i);
    const text = section.name.replace(/'/g, "'\\''");

    try {
      execSync(
        `ffmpeg -y -f lavfi -i color=c=${bgColor}:s=1920x1080:d=1 ` +
        `-vf "drawtext=text='${text}':fontsize=72:fontcolor=white:` +
        `x=(w-text_w)/2:y=(h-text_h)/2:font=Arial" ` +
        `-frames:v 1 "${slidePath}"`,
        { stdio: "pipe" }
      );
    } catch {
      // Fallback: create a simple colored frame without text
      execSync(
        `ffmpeg -y -f lavfi -i color=c=${bgColor}:s=1920x1080:d=1 ` +
        `-frames:v 1 "${slidePath}"`,
        { stdio: "pipe" }
      );
    }

    // Add to concat list with duration
    slideEntries.push(`file '${slidePath}'`);
    slideEntries.push(`duration ${duration}`);
  }

  // Last slide needs to be listed twice for concat demuxer
  if (sections.length > 0) {
    const lastSlide = join(slidesDir, `slide_${(sections.length - 1).toString().padStart(2, "0")}.png`);
    slideEntries.push(`file '${lastSlide}'`);
  }

  await writeFile(slideListPath, slideEntries.join("\n"));

  // Combine slides + audio into video
  try {
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${slideListPath}" ` +
      `-i "${audioPath}" -c:v libx264 -pix_fmt yuv420p ` +
      `-c:a aac -shortest "${videoPath}"`,
      { stdio: "pipe" }
    );
    console.log(`Video assembled: ${videoPath}`);
  } catch (error) {
    console.error("FFmpeg video assembly failed:", error);
    console.log("Slides and audio saved separately in output directory");
  }
}

/** Generate a slide deck as HTML (fallback when no FFmpeg) */
async function generateSlideDeck(
  outputDir: string,
  script: GeneratedScript
): Promise<void> {
  const slides = script.sections.map((section, i) => {
    const bgColor = getSlideColor(i);
    const visuals = section.visualCues.length > 0
      ? `<p class="visuals">${section.visualCues.join(" | ")}</p>`
      : "";

    return `
    <div class="slide" style="background: ${bgColor}">
      <h2>${section.name}</h2>
      <p class="duration">${section.durationHint}</p>
      ${visuals}
      <div class="content">${section.content.replace(/\n/g, "<br>")}</div>
    </div>`;
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${script.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Poppins', Arial, sans-serif; background: #111; color: white; }
    .slide {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 4rem;
      text-align: center;
    }
    h2 { font-family: 'Anton', sans-serif; font-size: 3rem; margin-bottom: 1rem; text-transform: uppercase; }
    .duration { font-size: 1rem; opacity: 0.7; margin-bottom: 2rem; }
    .visuals { font-size: 0.9rem; opacity: 0.8; margin-bottom: 1.5rem; font-style: italic; }
    .content { font-size: 1.2rem; max-width: 800px; line-height: 1.8; text-align: left; }
  </style>
</head>
<body>
  <div class="slide" style="background: linear-gradient(135deg, #6d28d9, #7c3aed)">
    <h2>${script.title}</h2>
    <p>FPL Stats Lab</p>
  </div>
  ${slides.join("\n")}
</body>
</html>`;

  const htmlPath = join(outputDir, "slides.html");
  await writeFile(htmlPath, html);
  console.log(`Slide deck saved to ${htmlPath}`);
}

function getSlideColor(index: number): string {
  const colors = [
    "#6d28d9", // purple
    "#2563eb", // blue
    "#059669", // green
    "#d97706", // orange
    "#dc2626", // red
    "#7c3aed", // violet
    "#0891b2", // cyan
    "#4f46e5", // indigo
  ];
  return colors[index % colors.length];
}

function parseDuration(hint: string): number {
  const match = hint.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
}
