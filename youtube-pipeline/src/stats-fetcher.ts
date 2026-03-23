import PocketBase from "pocketbase";
import type { PipelineConfig } from "./config.js";

/** Player record from PocketBase */
interface PlayerRecord {
  id: string;
  fpl_id: number;
  name: string;
  full_name: string;
  team: string;
  position: "GKP" | "DEF" | "MID" | "FWD";
}

/** Gameweek stat record from PocketBase */
interface GameweekStat {
  id: string;
  player: string;
  gw: number;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  xg: number;
  npxg: number;
  xa: number;
  xgot: number;
  key_passes: number;
  sca: number;
  chances_created: number;
  successful_dribbles: number;
  touches_opposition_box: number;
  ball_recoveries: number;
  recoveries: number;
  cbit: number;
  defensive_contributions: number;
  duels_won: number;
  aerial_duels_won: number;
  big_chances_missed: number;
  goals_prevented: number;
  fpl_points: number;
  expand?: { player?: PlayerRecord };
}

/** Price snapshot from PocketBase */
interface PriceSnapshot {
  id: string;
  player: string;
  price: number;
  ownership: number;
  transfers_in: number;
  transfers_out: number;
  snapshot_date: string;
  expand?: { player?: PlayerRecord };
}

/** Aggregated player summary for script generation */
export interface PlayerSummary {
  name: string;
  team: string;
  position: string;
  totalMinutes: number;
  totalGoals: number;
  totalAssists: number;
  totalXg: number;
  totalXa: number;
  overperformance: number;
  totalChancesCreated: number;
  totalCbit: number;
  totalRecoveries: number;
  totalDuelsWon: number;
  totalSuccessfulDribbles: number;
  totalTouchesOppositionBox: number;
  totalBigChancesMissed: number;
  totalGoalsPrevented: number;
  totalFplPoints: number;
  gameweeks: number;
}

/** Leaderboard entry for a specific metric */
export interface LeaderboardEntry {
  rank: number;
  player: PlayerSummary;
  value: number;
}

/** All leaderboards for script generation */
export interface LeaderboardData {
  clinicalXI: LeaderboardEntry[];
  topXg: LeaderboardEntry[];
  topXa: LeaderboardEntry[];
  creativeEngines: LeaderboardEntry[];
  boxThreat: LeaderboardEntry[];
  defensiveHeroes: LeaderboardEntry[];
  ballWinners: LeaderboardEntry[];
  duelMasters: LeaderboardEntry[];
  dribbleKings: LeaderboardEntry[];
  aerialDominance: LeaderboardEntry[];
  gkWall: LeaderboardEntry[];
  bigChanceWasters: LeaderboardEntry[];
}

/** Gameweek-specific stats for preview/review videos */
export interface GameweekData {
  gameweek: number;
  topScorers: LeaderboardEntry[];
  topXgPerformers: LeaderboardEntry[];
  biggestOverperformers: LeaderboardEntry[];
  biggestUnderperformers: LeaderboardEntry[];
  topAssists: LeaderboardEntry[];
  topDefenders: LeaderboardEntry[];
}

/** Price movers for price watch videos */
export interface PriceData {
  risers: Array<{ name: string; team: string; position: string; price: number; change: number; ownership: number }>;
  fallers: Array<{ name: string; team: string; position: string; price: number; change: number; ownership: number }>;
}

/** Complete stats payload for script generation */
export interface StatsPayload {
  leaderboards: LeaderboardData;
  gameweekData?: GameweekData;
  priceData?: PriceData;
  generatedAt: string;
}

async function createClient(config: PipelineConfig): Promise<PocketBase> {
  const pb = new PocketBase(config.pb.url);
  await pb.collection("users").authWithPassword(config.pb.user, config.pb.pass);
  return pb;
}

function aggregateStats(
  stats: GameweekStat[],
  players: Map<string, PlayerRecord>
): PlayerSummary[] {
  const grouped = new Map<string, GameweekStat[]>();

  for (const stat of stats) {
    const playerId = stat.player;
    if (!grouped.has(playerId)) grouped.set(playerId, []);
    grouped.get(playerId)!.push(stat);
  }

  const summaries: PlayerSummary[] = [];
  for (const [playerId, gwStats] of grouped) {
    const player = players.get(playerId);
    if (!player) continue;

    const summary: PlayerSummary = {
      name: player.name,
      team: player.team,
      position: player.position,
      totalMinutes: 0,
      totalGoals: 0,
      totalAssists: 0,
      totalXg: 0,
      totalXa: 0,
      overperformance: 0,
      totalChancesCreated: 0,
      totalCbit: 0,
      totalRecoveries: 0,
      totalDuelsWon: 0,
      totalSuccessfulDribbles: 0,
      totalTouchesOppositionBox: 0,
      totalBigChancesMissed: 0,
      totalGoalsPrevented: 0,
      totalFplPoints: 0,
      gameweeks: gwStats.length,
    };

    for (const gw of gwStats) {
      summary.totalMinutes += gw.minutes || 0;
      summary.totalGoals += gw.goals || 0;
      summary.totalAssists += gw.assists || 0;
      summary.totalXg += gw.xg || 0;
      summary.totalXa += gw.xa || 0;
      summary.totalChancesCreated += gw.chances_created || 0;
      summary.totalCbit += gw.cbit || 0;
      summary.totalRecoveries += gw.recoveries || 0;
      summary.totalDuelsWon += gw.duels_won || 0;
      summary.totalSuccessfulDribbles += gw.successful_dribbles || 0;
      summary.totalTouchesOppositionBox += gw.touches_opposition_box || 0;
      summary.totalBigChancesMissed += gw.big_chances_missed || 0;
      summary.totalGoalsPrevented += gw.goals_prevented || 0;
      summary.totalFplPoints += gw.fpl_points || 0;
    }

    summary.overperformance = Math.round((summary.totalGoals - summary.totalXg) * 100) / 100;
    summaries.push(summary);
  }

  return summaries;
}

function buildLeaderboard(
  summaries: PlayerSummary[],
  metric: keyof PlayerSummary,
  limit: number = 5,
  descending: boolean = true
): LeaderboardEntry[] {
  const sorted = [...summaries]
    .filter((s) => s.totalMinutes >= 270) // min 3 full matches
    .sort((a, b) => {
      const aVal = a[metric] as number;
      const bVal = b[metric] as number;
      return descending ? bVal - aVal : aVal - bVal;
    })
    .slice(0, limit);

  return sorted.map((player, i) => ({
    rank: i + 1,
    player,
    value: player[metric] as number,
  }));
}

/** Fetch all leaderboards for season overview */
export async function fetchLeaderboards(config: PipelineConfig): Promise<LeaderboardData> {
  const pb = await createClient(config);

  // Fetch all players
  const playerRecords = await pb.collection("players").getFullList<PlayerRecord>();
  const playersMap = new Map(playerRecords.map((p) => [p.id, p]));

  // Fetch all gameweek stats (paginated)
  const allStats: GameweekStat[] = [];
  let page = 1;
  const perPage = 500;
  while (true) {
    const result = await pb.collection("gameweek_stats").getList<GameweekStat>(page, perPage);
    allStats.push(...result.items);
    if (page >= result.totalPages) break;
    page++;
  }

  const summaries = aggregateStats(allStats, playersMap);

  return {
    clinicalXI: buildLeaderboard(summaries, "overperformance"),
    topXg: buildLeaderboard(summaries, "totalXg"),
    topXa: buildLeaderboard(summaries, "totalXa"),
    creativeEngines: buildLeaderboard(summaries, "totalChancesCreated"),
    boxThreat: buildLeaderboard(summaries, "totalTouchesOppositionBox"),
    defensiveHeroes: buildLeaderboard(summaries, "totalCbit"),
    ballWinners: buildLeaderboard(summaries, "totalRecoveries"),
    duelMasters: buildLeaderboard(summaries, "totalDuelsWon"),
    dribbleKings: buildLeaderboard(summaries, "totalSuccessfulDribbles"),
    aerialDominance: buildLeaderboard(summaries, "totalDuelsWon"),
    gkWall: buildLeaderboard(
      summaries.filter((s) => s.position === "GKP"),
      "totalGoalsPrevented"
    ),
    bigChanceWasters: buildLeaderboard(summaries, "totalBigChancesMissed"),
  };
}

/** Fetch single gameweek data for preview/review videos */
export async function fetchGameweekData(
  config: PipelineConfig,
  gw: number
): Promise<GameweekData> {
  const pb = await createClient(config);

  const playerRecords = await pb.collection("players").getFullList<PlayerRecord>();
  const playersMap = new Map(playerRecords.map((p) => [p.id, p]));

  const gwStats = await pb.collection("gameweek_stats").getFullList<GameweekStat>({
    filter: `gw = ${gw}`,
  });

  const summaries = aggregateStats(gwStats, playersMap);

  return {
    gameweek: gw,
    topScorers: buildLeaderboard(summaries, "totalFplPoints"),
    topXgPerformers: buildLeaderboard(summaries, "totalXg"),
    biggestOverperformers: buildLeaderboard(summaries, "overperformance"),
    biggestUnderperformers: buildLeaderboard(summaries, "overperformance", 5, false),
    topAssists: buildLeaderboard(summaries, "totalAssists"),
    topDefenders: buildLeaderboard(summaries, "totalCbit"),
  };
}

/** Fetch price movement data for price watch videos */
export async function fetchPriceData(config: PipelineConfig): Promise<PriceData> {
  const pb = await createClient(config);

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const dateFilter = threeDaysAgo.toISOString().split("T")[0];

  const snapshots = await pb.collection("price_history").getFullList<PriceSnapshot>({
    filter: `snapshot_date >= "${dateFilter}"`,
    sort: "snapshot_date",
    expand: "player",
  });

  // Group by player, find price changes
  const playerPrices = new Map<string, PriceSnapshot[]>();
  for (const snap of snapshots) {
    if (!playerPrices.has(snap.player)) playerPrices.set(snap.player, []);
    playerPrices.get(snap.player)!.push(snap);
  }

  const risers: PriceData["risers"] = [];
  const fallers: PriceData["fallers"] = [];

  for (const [, prices] of playerPrices) {
    if (prices.length < 2) continue;
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = last.price - first.price;
    if (change === 0) continue;

    const player = last.expand?.player;
    if (!player) continue;

    const entry = {
      name: player.name,
      team: player.team,
      position: player.position,
      price: last.price / 10,
      change: change / 10,
      ownership: last.ownership,
    };

    if (change > 0) risers.push(entry);
    else fallers.push(entry);
  }

  risers.sort((a, b) => b.change - a.change);
  fallers.sort((a, b) => a.change - b.change);

  return {
    risers: risers.slice(0, 10),
    fallers: fallers.slice(0, 10),
  };
}

/** Build full stats payload for a given video type */
export async function fetchStatsPayload(config: PipelineConfig): Promise<StatsPayload> {
  const leaderboards = await fetchLeaderboards(config);

  const payload: StatsPayload = {
    leaderboards,
    generatedAt: new Date().toISOString(),
  };

  if (config.videoType === "gw-preview" || config.videoType === "gw-review") {
    payload.gameweekData = await fetchGameweekData(config, config.gameweek);
  }

  if (config.videoType === "price-watch") {
    payload.priceData = await fetchPriceData(config);
  }

  return payload;
}
