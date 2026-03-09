/**
 * Environment configuration for FPL API
 */
export interface EnvConfig {
  fplLeagueId: string;
  apiBaseUrl: string;
  enableCache: boolean;
  cacheDuration: number;
  pocketbaseUrl: string;
  pocketbasePublicUrl: string;
  newsCacheDuration: number;
  twitterApiKey: string | undefined;
  twitterApiBaseUrl: string;
  plausibleDomain: string | undefined;
}

/**
 * Get environment configuration
 * @returns Environment configuration object
 */
export function getEnvConfig(): EnvConfig {
  const leagueId = process.env.FPL_LEAGUE_ID;
  if (!leagueId) {
    throw new Error("FPL_LEAGUE_ID environment variable is required");
  }

  return {
    fplLeagueId: leagueId,
    apiBaseUrl:
      process.env.FPL_API_BASE_URL ||
      "https://fantasy.premierleague.com/api",
    enableCache: process.env.ENABLE_API_CACHE !== "false", // Default to true
    cacheDuration: parseInt(process.env.API_CACHE_DURATION || "300", 10),
    pocketbaseUrl:
      process.env.POCKETBASE_URL || "http://localhost:8090",
    pocketbasePublicUrl:
      process.env.POCKETBASE_PUBLIC_URL || process.env.POCKETBASE_URL || "http://localhost:8090",
    newsCacheDuration: parseInt(process.env.NEWS_CACHE_DURATION || "900", 10),
    twitterApiKey: process.env.TWITTER_API_KEY || undefined,
    twitterApiBaseUrl:
      process.env.TWITTER_API_BASE_URL || "https://api.sociavault.com/v1",
    plausibleDomain: process.env.PLAUSIBLE_DOMAIN || undefined,
  };
}
