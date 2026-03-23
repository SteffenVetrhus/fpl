import "dotenv/config";

export interface PipelineConfig {
  pb: {
    url: string;
    user: string;
    pass: string;
  };
  elevenlabs: {
    apiKey: string;
    voiceId: string;
  };
  outputDir: string;
  videoType: VideoType;
  gameweek: number;
}

export type VideoType = "gw-preview" | "gw-review" | "price-watch" | "deep-dive";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export function loadConfig(): PipelineConfig {
  return {
    pb: {
      url: optionalEnv("PB_URL", "http://localhost:8090"),
      user: requireEnv("PB_USER"),
      pass: requireEnv("PB_PASS"),
    },
    elevenlabs: {
      apiKey: optionalEnv("ELEVENLABS_API_KEY", ""),
      voiceId: optionalEnv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB"),
    },
    outputDir: optionalEnv("OUTPUT_DIR", "./youtube-pipeline/output"),
    videoType: (optionalEnv("VIDEO_TYPE", "gw-preview") as VideoType),
    gameweek: parseInt(optionalEnv("GAMEWEEK", "1"), 10),
  };
}
