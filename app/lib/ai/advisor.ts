/**
 * Claude-powered FPL advisor
 * Uses the Anthropic API to generate personalized gameweek advice
 */

import { FPL_ADVISOR_SYSTEM_PROMPT } from "./prompts";

export interface AdvisorResponse {
  advice: string;
  model: string;
  cached: boolean;
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
      max_tokens: 1024,
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

  return {
    advice: textBlock?.text ?? "No advice generated.",
    model: data.model ?? "claude-sonnet-4-20250514",
    cached: false,
  };
}

/**
 * Check if the AI advisor is available
 */
export function isAdvisorAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
