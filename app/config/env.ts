/**
 * Environment configuration for FPL API
 */
export interface EnvConfig {
  fplLeagueId?: string;
  apiBaseUrl: string;
  enableCache: boolean;
  cacheDuration: number;
  fplManagerId?: string;
}

/**
 * Get environment configuration
 * @returns Environment configuration object
 */
export function getEnvConfig(): EnvConfig {
  return {
    fplLeagueId: process.env.FPL_LEAGUE_ID,
    apiBaseUrl:
      process.env.FPL_API_BASE_URL ||
      "https://fantasy.premierleague.com/api",
    enableCache: process.env.ENABLE_API_CACHE !== "false", // Default to true
    cacheDuration: parseInt(process.env.API_CACHE_DURATION || "300", 10),
    fplManagerId: process.env.FPL_MANAGER_ID,
  };
}
