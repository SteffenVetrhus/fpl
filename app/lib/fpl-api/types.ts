/**
 * TypeScript interfaces for Fantasy Premier League API responses
 * Based on unofficial API documentation (2024-25 season)
 * @see docs/FPL_API.md for full endpoint documentation
 */

// ============================================================================
// Bootstrap Static Response
// ============================================================================

/**
 * Gameweek (Event) information
 */
export interface FPLEvent {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry: number | null;
  deadline_time_epoch: number;
  deadline_time_game_offset: number;
  highest_score: number | null;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  cup_leagues_created: boolean;
  h2h_ko_matches_created: boolean;
  chip_plays: Array<{
    chip_name: string;
    num_played: number;
  }>;
  most_selected: number | null;
  most_transferred_in: number | null;
  top_element: number | null;
  top_element_info: {
    id: number;
    points: number;
  } | null;
  transfers_made: number;
  most_captained: number | null;
  most_vice_captained: number | null;
  average_entry_score: number;
}

/**
 * Premier League team information
 */
export interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  code: number;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  pulse_id: number;
}

/**
 * Player (Element) information
 */
export interface FPLElement {
  id: number;
  code: number;
  element_type: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  team_code: number;
  status: "a" | "d" | "i" | "u"; // available, doubtful, injured, unavailable
  now_cost: number; // In tenths (e.g., 130 = £13.0m)
  cost_change_start: number;
  cost_change_event: number;
  total_points: number;
  event_points: number;
  points_per_game: string;
  ep_this: string | null;
  ep_next: string | null;
  form: string;
  selected_by_percent: string;
  transfers_in: number;
  transfers_out: number;
  transfers_in_event: number;
  transfers_out_event: number;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  value_form: string;
  value_season: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
}

/**
 * Element type (position)
 */
export interface FPLElementType {
  id: number;
  plural_name: string;
  plural_name_short: string;
  singular_name: string;
  singular_name_short: string;
  squad_select: number;
  squad_min_play: number;
  squad_max_play: number;
  ui_shirt_specific: boolean;
  sub_positions_locked: number[];
  element_count: number;
}

/**
 * Complete Bootstrap Static response
 */
export interface FPLBootstrapStatic {
  events: FPLEvent[];
  teams: FPLTeam[];
  elements: FPLElement[];
  element_types: FPLElementType[];
  element_stats: Array<{
    label: string;
    name: string;
  }>;
  total_players: number;
}

// ============================================================================
// League Standings Response
// ============================================================================

/**
 * League information
 */
export interface FPLLeague {
  id: number;
  name: string;
  created: string;
  closed: boolean;
  max_entries: number | null;
  league_type: string;
  scoring: string;
  start_event: number;
  code_privacy: string;
  has_cup: boolean;
  cup_league: number | null;
  rank: number | null;
}

/**
 * Manager standing in league
 */
export interface FPLStandingsResult {
  id: number;
  event_total: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number; // Manager ID
  entry_name: string;
}

/**
 * League standings data
 */
export interface FPLStandings {
  has_next: boolean;
  page: number;
  results: FPLStandingsResult[];
}

/**
 * New entries to league
 */
export interface FPLNewEntries {
  has_next: boolean;
  page: number;
  results: Array<{
    entry: number;
    entry_name: string;
    joined_time: string;
    player_first_name: string;
    player_last_name: string;
  }>;
}

/**
 * Complete League Standings response
 */
export interface FPLLeagueStandings {
  league: FPLLeague;
  standings: FPLStandings;
  new_entries?: FPLNewEntries;
}

// ============================================================================
// Manager Entry Response
// ============================================================================

/**
 * Manager (Entry) profile
 */
export interface FPLEntry {
  id: number;
  player_first_name: string;
  player_last_name: string;
  player_region_id: number;
  player_region_name: string;
  player_region_iso_code_short: string;
  player_region_iso_code_long: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  joined_time: string;
  started_event: number;
  current_event: number;
  name: string;
  kit: string | null;
  last_deadline_bank: number;
  last_deadline_value: number;
  last_deadline_total_transfers: number;
  favourite_team: number | null;
  leagues: {
    classic: Array<{
      id: number;
      name: string;
      short_name: string | null;
      created: string;
      closed: boolean;
      rank: number | null;
      max_entries: number | null;
      league_type: string;
      scoring: string;
      start_event: number;
      entry_can_leave: boolean;
      entry_can_admin: boolean;
      entry_can_invite: boolean;
      has_cup: boolean;
      cup_league: number | null;
      cup_qualified: boolean | null;
      entry_rank: number;
      entry_last_rank: number;
    }>;
    h2h: any[];
    cup: any;
    cup_matches: any[];
  };
}

// ============================================================================
// Manager History Response
// ============================================================================

/**
 * Gameweek history for a manager
 */
export interface FPLManagerGameweek {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

/**
 * Chip usage by manager
 */
export interface FPLChip {
  name: string;
  time: string;
  event: number;
}

/**
 * Past season data
 */
export interface FPLPastSeason {
  season_name: string;
  total_points: number;
  rank: number;
}

/**
 * Complete Manager History response
 */
export interface FPLManagerHistory {
  current: FPLManagerGameweek[];
  past: FPLPastSeason[];
  chips: FPLChip[];
}

// ============================================================================
// Manager Transfers Response
// ============================================================================

/**
 * Transfer made by manager
 */
export interface FPLTransfer {
  element_in: number; // Player ID brought in
  element_in_cost: number; // Cost in tenths
  element_out: number; // Player ID transferred out
  element_out_cost: number; // Cost in tenths
  entry: number; // Manager ID
  event: number; // Gameweek number
  time: string; // ISO timestamp
}

/**
 * Complete Manager Transfers response
 */
export type FPLManagerTransfers = FPLTransfer[];

// ============================================================================
// Gameweek Team Picks Response (Optional - for future use)
// ============================================================================

/**
 * Player pick in a gameweek
 */
export interface FPLPick {
  element: number; // Player ID
  position: number; // 1-15 (1-11 starting, 12-15 bench)
  multiplier: number; // 0=not playing, 1=playing, 2=captain, 3=triple captain
  is_captain: boolean;
  is_vice_captain: boolean;
}

/**
 * Automatic substitution
 */
export interface FPLAutoSub {
  entry: number;
  element_in: number;
  element_out: number;
  event: number;
}

/**
 * Entry history for specific gameweek
 */
export interface FPLEntryHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

/**
 * Complete Gameweek Team Picks response
 */
export interface FPLGameweekPicks {
  active_chip: string | null;
  automatic_subs: FPLAutoSub[];
  entry_history: FPLEntryHistory;
  picks: FPLPick[];
}

// ============================================================================
// Helper Types for Application Logic
// ============================================================================

/**
 * Simplified manager for league display
 */
export interface Manager {
  id: number;
  name: string;
  teamName: string;
  points: number;
  rank: number;
  lastRank: number;
}

/**
 * Simplified gameweek data
 */
export interface Gameweek {
  id: number;
  name: string;
  deadline: string;
  finished: boolean;
  isCurrent: boolean;
  averageScore: number;
  highestScore: number | null;
}

/**
 * Gameweek winner information
 */
export interface GameweekWinner {
  gameweek: number;
  managerId: number;
  managerName: string;
  teamName: string;
  points: number;
}

/**
 * Transfer with player names (enriched)
 */
export interface EnrichedTransfer {
  gameweek: number;
  managerId: number;
  managerName: string;
  playerIn: {
    id: number;
    name: string;
    cost: number;
  };
  playerOut: {
    id: number;
    name: string;
    cost: number;
  };
  time: string;
}

// ============================================================================
// API Error Types
// ============================================================================

/**
 * FPL API error
 */
export interface FPLError {
  message: string;
  status: number;
  endpoint: string;
}

/**
 * API response wrapper
 */
export type FPLApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: FPLError };
