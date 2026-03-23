import "dotenv/config";

export interface PipelineConfig {
  pb: {
    url: string;
    user: string;
    pass: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
  };
  elevenlabs: {
    apiKey: string;
    voiceId: string;
  };
  youtube: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
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
    anthropic: {
      apiKey: requireEnv("ANTHROPIC_API_KEY"),
      model: optionalEnv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
    },
    elevenlabs: {
      apiKey: optionalEnv("ELEVENLABS_API_KEY", ""),
      voiceId: optionalEnv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB"),
    },
    youtube: {
      clientId: optionalEnv("YOUTUBE_CLIENT_ID", ""),
      clientSecret: optionalEnv("YOUTUBE_CLIENT_SECRET", ""),
      refreshToken: optionalEnv("YOUTUBE_REFRESH_TOKEN", ""),
    },
    outputDir: optionalEnv("OUTPUT_DIR", "./output"),
    videoType: (optionalEnv("VIDEO_TYPE", "gw-preview") as VideoType),
    gameweek: parseInt(optionalEnv("GAMEWEEK", "1"), 10),
  };
}
