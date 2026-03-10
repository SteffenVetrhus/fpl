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
    process.env.FPL_LEAGUE_ID = "12345";
    const config = getEnvConfig();

    expect(config.apiBaseUrl).toBe("https://fantasy.premierleague.com/api");
  });

  it("should use custom API base URL if provided", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.FPL_API_BASE_URL = "https://custom-api.com";

    const config = getEnvConfig();

    expect(config.apiBaseUrl).toBe("https://custom-api.com");
  });

  it("should parse cache settings correctly", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.ENABLE_API_CACHE = "true";
    process.env.API_CACHE_DURATION = "600";

    const config = getEnvConfig();

    expect(config.enableCache).toBe(true);
    expect(config.cacheDuration).toBe(600);
  });

  it("should use default cache settings if not provided", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    const config = getEnvConfig();

    expect(config.enableCache).toBe(true);
    expect(config.cacheDuration).toBe(300);
  });

  it("should return plausibleDomain when PLAUSIBLE_DOMAIN is set", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.PLAUSIBLE_DOMAIN = "my-fpl.com";

    const config = getEnvConfig();

    expect(config.plausibleDomain).toBe("my-fpl.com");
  });

  it("should return undefined plausibleDomain when not set", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    delete process.env.PLAUSIBLE_DOMAIN;

    const config = getEnvConfig();

    expect(config.plausibleDomain).toBeUndefined();
  });

  it("should return plausibleScriptUrl when PLAUSIBLE_SCRIPT_URL is set", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.PLAUSIBLE_SCRIPT_URL = "https://analytics.my-fpl.com/js/script.js";

    const config = getEnvConfig();

    expect(config.plausibleScriptUrl).toBe("https://analytics.my-fpl.com/js/script.js");
  });

  it("should return undefined plausibleScriptUrl when not set", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    delete process.env.PLAUSIBLE_SCRIPT_URL;

    const config = getEnvConfig();

    expect(config.plausibleScriptUrl).toBeUndefined();
  });
});
