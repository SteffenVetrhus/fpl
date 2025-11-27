import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEnvConfig } from "./env";

describe("getEnvConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear any cached env values
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return config with FPL_LEAGUE_ID from environment", () => {
    process.env.FPL_LEAGUE_ID = "12345";

    const config = getEnvConfig();

    expect(config.fplLeagueId).toBe("12345");
  });

  it("should return default API base URL if not provided", () => {
    const config = getEnvConfig();

    expect(config.apiBaseUrl).toBe("https://fantasy.premierleague.com/api");
  });

  it("should use custom API base URL if provided", () => {
    process.env.FPL_API_BASE_URL = "https://custom-api.com";

    const config = getEnvConfig();

    expect(config.apiBaseUrl).toBe("https://custom-api.com");
  });

  it("should parse cache settings correctly", () => {
    process.env.ENABLE_API_CACHE = "true";
    process.env.API_CACHE_DURATION = "600";

    const config = getEnvConfig();

    expect(config.enableCache).toBe(true);
    expect(config.cacheDuration).toBe(600);
  });

  it("should use default cache settings if not provided", () => {
    const config = getEnvConfig();

    expect(config.enableCache).toBe(true);
    expect(config.cacheDuration).toBe(300);
  });
});
