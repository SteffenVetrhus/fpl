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
    process.env.POCKETBASE_ADMIN_EMAIL = "test@example.com";
    process.env.POCKETBASE_ADMIN_PASSWORD = "testpass";

    const config = getEnvConfig();

    expect(config.fplLeagueId).toBe("12345");
  });

  it("should return default API base URL if not provided", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.POCKETBASE_ADMIN_EMAIL = "test@example.com";
    process.env.POCKETBASE_ADMIN_PASSWORD = "testpass";

    const config = getEnvConfig();

    expect(config.apiBaseUrl).toBe("https://fantasy.premierleague.com/api");
  });

  it("should use custom API base URL if provided", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.FPL_API_BASE_URL = "https://custom-api.com";
    process.env.POCKETBASE_ADMIN_EMAIL = "test@example.com";
    process.env.POCKETBASE_ADMIN_PASSWORD = "testpass";

    const config = getEnvConfig();

    expect(config.apiBaseUrl).toBe("https://custom-api.com");
  });

  it("should parse cache settings correctly", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.ENABLE_API_CACHE = "true";
    process.env.API_CACHE_DURATION = "600";
    process.env.POCKETBASE_ADMIN_EMAIL = "test@example.com";
    process.env.POCKETBASE_ADMIN_PASSWORD = "testpass";

    const config = getEnvConfig();

    expect(config.enableCache).toBe(true);
    expect(config.cacheDuration).toBe(600);
  });

  it("should use default cache settings if not provided", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.POCKETBASE_ADMIN_EMAIL = "test@example.com";
    process.env.POCKETBASE_ADMIN_PASSWORD = "testpass";

    const config = getEnvConfig();

    expect(config.enableCache).toBe(true);
    expect(config.cacheDuration).toBe(300);
  });

  it("should load PocketBase configuration", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.POCKETBASE_URL = "https://custom-pb.com";
    process.env.POCKETBASE_ADMIN_EMAIL = "admin@test.com";
    process.env.POCKETBASE_ADMIN_PASSWORD = "securepass123";

    const config = getEnvConfig();

    expect(config.pocketbase.url).toBe("https://custom-pb.com");
    expect(config.pocketbase.adminEmail).toBe("admin@test.com");
    expect(config.pocketbase.adminPassword).toBe("securepass123");
  });

  it("should use default PocketBase URL if not provided", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    process.env.POCKETBASE_ADMIN_EMAIL = "test@example.com";
    process.env.POCKETBASE_ADMIN_PASSWORD = "testpass";

    const config = getEnvConfig();

    expect(config.pocketbase.url).toBe("https://fpl.soyna.no");
  });

  it("should throw error if PocketBase credentials are missing", () => {
    process.env.FPL_LEAGUE_ID = "12345";
    delete process.env.POCKETBASE_ADMIN_EMAIL;
    delete process.env.POCKETBASE_ADMIN_PASSWORD;

    expect(() => getEnvConfig()).toThrow(
      "POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables are required"
    );
  });
});
