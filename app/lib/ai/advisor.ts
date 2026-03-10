/**
 * Claude-powered FPL advisor
 * Uses the Anthropic API to generate personalized gameweek advice
 */

import { FPL_ADVISOR_SYSTEM_PROMPT } from "./prompts";

export interface AdvisorResponse {
  advice: string;
  model: string;
  sections: AdvisorSection[];
}

export interface AdvisorSection {
  id: string;
  title: string;
  content: string;
}

const SECTION_ORDER = [
  "verdict",
  "captain-pick",
  "starting-xi-check",
  "transfer-priority",
  "differential-edge",
  "chip-strategy",
  "rival-watch",
];

const SECTION_TITLES: Record<string, string> = {
  verdict: "Verdict",
  "captain-pick": "Captain Pick",
  "starting-xi-check": "Starting XI Check",
  "transfer-priority": "Transfer Priority",
  "differential-edge": "Differential Edge",
  "chip-strategy": "Chip Strategy",
  "rival-watch": "Rival Watch",
};

/**
 * Parse the AI response into structured sections
 */
function parseSections(text: string): AdvisorSection[] {
  const sections: AdvisorSection[] = [];
  const headerRegex = /^## (.+)$/gm;
  const matches: { title: string; index: number }[] = [];

  let match;
  while ((match = headerRegex.exec(text)) !== null) {
    matches.push({ title: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].title.length + 3; // "## " + title
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const content = text.slice(start, end).trim();
    const title = matches[i].title;

    // Map title to known section ID
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    sections.push({ id, title, content });
  }

  // Sort by known order, unknowns go at end
  sections.sort((a, b) => {
    const aIdx = SECTION_ORDER.indexOf(a.id);
    const bIdx = SECTION_ORDER.indexOf(b.id);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return sections;
}

/**
 * Get AI-powered gameweek advice
 * Requires ANTHROPIC_API_KEY environment variable
 */
export async function getAdvisorAdvice(
  userPrompt: string
): Promise<AdvisorResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required for AI advisor"
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: FPL_ADVISOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (block: any) => block.type === "text"
  );

  const advice = textBlock?.text ?? "No advice generated.";
  const sections = parseSections(advice);

  return {
    advice,
    model: data.model ?? "claude-sonnet-4-20250514",
    sections,
  };
}

/**
 * Check if the AI advisor is available
 */
export function isAdvisorAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
