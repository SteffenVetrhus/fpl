/**
 * Environment configuration for FPL API
 */
export interface EnvConfig {
  fplLeagueId: string;
  apiBaseUrl: string;
  enableCache: boolean;
  cacheDuration: number;
  fplManagerId?: string;
  pocketbase: {
    url: string;
    adminEmail: string;
    adminPassword: string;
  };
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

  const pbUrl = process.env.POCKETBASE_URL || "https://fpl.soyna.no";
  const pbEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const pbPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!pbEmail || !pbPassword) {
    throw new Error(
      "POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables are required"
    );
  }

  return {
    fplLeagueId: leagueId,
    apiBaseUrl:
      process.env.FPL_API_BASE_URL ||
      "https://fantasy.premierleague.com/api",
    enableCache: process.env.ENABLE_API_CACHE !== "false", // Default to true
    cacheDuration: parseInt(process.env.API_CACHE_DURATION || "300", 10),
    fplManagerId: process.env.FPL_MANAGER_ID,
    pocketbase: {
      url: pbUrl,
      adminEmail: pbEmail,
      adminPassword: pbPassword,
    },
  };
}
