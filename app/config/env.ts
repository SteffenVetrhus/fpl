/**
 * Environment configuration for FPL API
 */
import { validateConfigUrl } from "~/config/validate-url";

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
  plausibleScriptUrl: string | undefined;
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * Get environment configuration
 * @returns Environment configuration object
 */
export function getEnvConfig(): EnvConfig {
  const leagueId = process.env.FPL_LEAGUE_ID;
  if (!leagueId) {
    throw new Error("FPL_LEAGUE_ID environment variable is required");
  }

  const apiBaseUrl = process.env.FPL_API_BASE_URL
    ? validateConfigUrl(process.env.FPL_API_BASE_URL, { allowLocalhost: isDev })
    : "https://fantasy.premierleague.com/api";

  const pocketbaseUrl = process.env.POCKETBASE_URL
    ? validateConfigUrl(process.env.POCKETBASE_URL, { allowLocalhost: isDev })
    : "http://localhost:8090";

  const pocketbasePublicUrl = process.env.POCKETBASE_PUBLIC_URL
    ? validateConfigUrl(process.env.POCKETBASE_PUBLIC_URL, { allowLocalhost: isDev })
    : pocketbaseUrl;

  const twitterApiBaseUrl = process.env.TWITTER_API_BASE_URL
    ? validateConfigUrl(process.env.TWITTER_API_BASE_URL, { allowLocalhost: isDev })
    : "https://api.sociavault.com/v1";

  return {
    fplLeagueId: leagueId,
    apiBaseUrl,
    enableCache: process.env.ENABLE_API_CACHE !== "false",
    cacheDuration: parseInt(process.env.API_CACHE_DURATION || "300", 10),
    pocketbaseUrl,
    pocketbasePublicUrl,
    newsCacheDuration: parseInt(process.env.NEWS_CACHE_DURATION || "900", 10),
    twitterApiKey: process.env.TWITTER_API_KEY || undefined,
    twitterApiBaseUrl,
    plausibleDomain: process.env.PLAUSIBLE_DOMAIN || undefined,
    plausibleScriptUrl: process.env.PLAUSIBLE_SCRIPT_URL || undefined,
  };
}
