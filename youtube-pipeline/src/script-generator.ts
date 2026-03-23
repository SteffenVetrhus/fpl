import Anthropic from "@anthropic-ai/sdk";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { PipelineConfig, VideoType } from "./config.js";
import type { StatsPayload } from "./stats-fetcher.js";
import { buildGwPreviewPrompt } from "./templates/gw-preview.js";
import { buildGwReviewPrompt } from "./templates/gw-review.js";
import { buildPriceWatchPrompt } from "./templates/price-watch.js";
import { buildDeepDivePrompt } from "./templates/deep-dive.js";

/** Generated script with metadata */
export interface GeneratedScript {
  title: string;
  description: string;
  tags: string[];
  script: string;
  sections: ScriptSection[];
  thumbnailPrompt: string;
}

/** Parsed section from the script */
export interface ScriptSection {
  name: string;
  content: string;
  visualCues: string[];
  durationHint: string;
}

const PROMPT_BUILDERS: Record<VideoType, (stats: StatsPayload) => string> = {
  "gw-preview": buildGwPreviewPrompt,
  "gw-review": buildGwReviewPrompt,
  "price-watch": buildPriceWatchPrompt,
  "deep-dive": buildDeepDivePrompt,
};

/** Generate a video script using Claude API */
export async function generateScript(
  config: PipelineConfig,
  stats: StatsPayload
): Promise<GeneratedScript> {
  const client = new Anthropic({ apiKey: config.anthropic.apiKey });

  const promptBuilder = PROMPT_BUILDERS[config.videoType];
  if (!promptBuilder) {
    throw new Error(`Unknown video type: ${config.videoType}`);
  }

  const scriptPrompt = promptBuilder(stats);

  // Generate the script
  const scriptResponse = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 4096,
    messages: [{ role: "user", content: scriptPrompt }],
  });

  const script = (scriptResponse.content[0] as { type: "text"; text: string }).text;

  // Generate metadata (title, description, tags, thumbnail prompt)
  const metadataResponse = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Given this FPL YouTube video script, generate metadata as JSON:

SCRIPT:
${script}

Return ONLY valid JSON with these fields:
{
  "title": "YouTube title (under 60 chars, attention-grabbing, include GW number if relevant)",
  "description": "YouTube description (2-3 sentences + hashtags)",
  "tags": ["array", "of", "relevant", "tags", "for", "SEO"],
  "thumbnailPrompt": "A prompt for generating a YouTube thumbnail image (describe colors, text overlay, style)"
}`,
      },
    ],
  });

  const metadataText = (metadataResponse.content[0] as { type: "text"; text: string }).text;

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = metadataText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse metadata JSON from Claude response");
  }

  const metadata = JSON.parse(jsonMatch[0]) as {
    title: string;
    description: string;
    tags: string[];
    thumbnailPrompt: string;
  };

  // Parse sections from script
  const sections = parseScriptSections(script);

  return {
    ...metadata,
    script,
    sections,
  };
}

/** Parse the script into sections with visual cues */
function parseScriptSections(script: string): ScriptSection[] {
  const sections: ScriptSection[] = [];
  const lines = script.split("\n");

  let currentSection: ScriptSection | null = null;

  for (const line of lines) {
    // Detect section headers (numbered or bold/caps)
    const headerMatch = line.match(/^(?:\d+\.\s*)?(?:\*\*)?([A-Z][A-Z\s/]+(?:\([^)]*\))?)(?:\*\*)?/);
    if (headerMatch && line.trim().length < 80) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        name: headerMatch[1].trim(),
        content: "",
        visualCues: [],
        durationHint: extractDuration(line) || "30s",
      };
      continue;
    }

    if (!currentSection) {
      currentSection = {
        name: "INTRO",
        content: "",
        visualCues: [],
        durationHint: "15s",
      };
    }

    // Extract visual cues
    const visualMatch = line.match(/\[VISUAL:\s*([^\]]+)\]/);
    if (visualMatch) {
      currentSection.visualCues.push(visualMatch[1].trim());
    }

    currentSection.content += line + "\n";
  }

  if (currentSection) sections.push(currentSection);
  return sections;
}

function extractDuration(line: string): string | null {
  const match = line.match(/\((\d+)\s*seconds?\)/i);
  return match ? `${match[1]}s` : null;
}

/** Save generated script to disk */
export async function saveScript(
  config: PipelineConfig,
  script: GeneratedScript
): Promise<string> {
  const outputDir = join(config.outputDir, `${config.videoType}-gw${config.gameweek}`);
  await mkdir(outputDir, { recursive: true });

  // Save full script
  const scriptPath = join(outputDir, "script.md");
  await writeFile(scriptPath, formatScriptMarkdown(script));

  // Save metadata as JSON
  const metaPath = join(outputDir, "metadata.json");
  await writeFile(
    metaPath,
    JSON.stringify(
      {
        title: script.title,
        description: script.description,
        tags: script.tags,
        thumbnailPrompt: script.thumbnailPrompt,
        sections: script.sections.map((s) => ({
          name: s.name,
          durationHint: s.durationHint,
          visualCues: s.visualCues,
        })),
      },
      null,
      2
    )
  );

  // Save narration-only text (no visual cues, no headers)
  const narrationPath = join(outputDir, "narration.txt");
  const narrationText = script.script
    .replace(/\[VISUAL:[^\]]*\]/g, "")
    .replace(/\[PAUSE\]/g, "...")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  await writeFile(narrationPath, narrationText);

  console.log(`Script saved to ${outputDir}`);
  return outputDir;
}

function formatScriptMarkdown(script: GeneratedScript): string {
  return `# ${script.title}

## Video Metadata
- **Description:** ${script.description}
- **Tags:** ${script.tags.join(", ")}
- **Thumbnail Prompt:** ${script.thumbnailPrompt}

---

## Script

${script.script}

---

## Sections Breakdown

${script.sections.map((s) => `### ${s.name} (${s.durationHint})\nVisuals: ${s.visualCues.length > 0 ? s.visualCues.join(" | ") : "None specified"}`).join("\n\n")}
`;
}
