/**
 * Transfer Planner route
 * Interactive multi-gameweek transfer planning tool
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  Trash2,
  RotateCcw,
  Search,
  X,
  ArrowRightLeft,
  AlertTriangle,
  Check,
  Zap,
} from "lucide-react";
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchGameweekPicks,
  fetchManagerEntry,
  fetchLeagueStandings,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import { getDifficultyColor } from "~/utils/fixture-difficulty";
import {
  buildSquadFromPicks,
  applyPlanToSquad,
  calculateHitCost,
  validateSquad,
  getPositionLabel,
  groupByPosition,
} from "~/utils/transfer-planner";
import type { TransferPlanData, GameweekPlan } from "~/utils/transfer-planner";
import type { SquadPlayer, PlannerSquad } from "~/utils/transfer-planner";
import type {
  FPLElement,
  FPLTeam,
  FPLFixture,
  FPLEvent,
} from "~/lib/fpl-api/types";
import type { Route } from "./+types/transfer-planner";

// ============================================================================
// Types
// ============================================================================

interface PlayerInfo {
  id: number;
  webName: string;
  teamId: number;
  teamShort: string;
  elementType: number;
  cost: number;
  form: string;
  totalPoints: number;
  status: string;
  selectedByPercent: string;
  epNext: string | null;
}

interface TeamFixtureCell {
  gameweek: number;
  opponentShort: string;
  difficulty: number;
  isHome: boolean;
  isBlank: boolean;
}

interface LoaderData {
  initialSquad: PlannerSquad | null;
  allPlayers: PlayerInfo[];
  teams: { id: number; name: string; shortName: string }[];
  fixturesByTeam: Record<number, TeamFixtureCell[]>;
  upcomingGWs: number[];
  currentGW: number;
  events: { id: number; name: string; deadlineTime: string }[];
  managerName: string | null;
  teamName: string | null;
  noManagerId: boolean;
  error: string | null;
}

// ============================================================================
// Loader
// ============================================================================

export async function loader(): Promise<LoaderData> {
  const config = getEnvConfig();

  if (!config.fplManagerId) {
    return {
      initialSquad: null,
      allPlayers: [],
      teams: [],
      fixturesByTeam: {},
      upcomingGWs: [],
      currentGW: 1,
      events: [],
      managerName: null,
      teamName: null,
      noManagerId: true,
      error: null,
    };
  }

  try {
    const [bootstrap, allFixtures, entry] = await Promise.all([
      fetchBootstrapStatic(),
      fetchFixtures(),
      fetchManagerEntry(config.fplManagerId),
    ]);

    const currentEvent = bootstrap.events.find((e) => e.is_current);
    const nextEvent = bootstrap.events.find((e) => e.is_next);
    const currentGW = currentEvent?.id ?? nextEvent?.id ?? 1;
    const picksGW = currentEvent?.id ?? 1;

    const picks = await fetchGameweekPicks(config.fplManagerId, picksGW);

    const initialSquad = buildSquadFromPicks(
      picks.picks,
      bootstrap.elements,
      picks.entry_history.bank
    );

    // Build player lookup
    const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));
    const allPlayers: PlayerInfo[] = bootstrap.elements
      .filter((el) => el.status !== "u" || picks.picks.some((p) => p.element === el.id))
      .map((el) => ({
        id: el.id,
        webName: el.web_name,
        teamId: el.team,
        teamShort: teamMap.get(el.team)?.short_name ?? "???",
        elementType: el.element_type,
        cost: el.now_cost / 10,
        form: el.form,
        totalPoints: el.total_points,
        status: el.status,
        selectedByPercent: el.selected_by_percent,
        epNext: el.ep_next,
      }));

    const teams = bootstrap.teams.map((t) => ({
      id: t.id,
      name: t.name,
      shortName: t.short_name,
    }));

    // Build fixture data per team for upcoming GWs
    const lookAhead = 8;
    const upcomingGWs = Array.from(
      { length: lookAhead },
      (_, i) => currentGW + i + 1
    );

    const fixturesByTeam: Record<number, TeamFixtureCell[]> = {};
    for (const team of bootstrap.teams) {
      fixturesByTeam[team.id] = upcomingGWs.map((gw) => {
        const gwFixtures = allFixtures.filter(
          (f) =>
            f.event === gw &&
            (f.team_h === team.id || f.team_a === team.id)
        );

        if (gwFixtures.length === 0) {
          return {
            gameweek: gw,
            opponentShort: "BGW",
            difficulty: 0,
            isHome: false,
            isBlank: true,
          };
        }

        const f = gwFixtures[0];
        const isHome = f.team_h === team.id;
        const opp = teamMap.get(isHome ? f.team_a : f.team_h);
        return {
          gameweek: gw,
          opponentShort: opp?.short_name ?? "???",
          difficulty: isHome ? f.team_h_difficulty : f.team_a_difficulty,
          isHome,
          isBlank: false,
        };
      });
    }

    const events = bootstrap.events
      .filter((e) => e.id > currentGW && e.id <= currentGW + lookAhead)
      .map((e) => ({
        id: e.id,
        name: e.name,
        deadlineTime: e.deadline_time,
      }));

    // Get manager info
    let managerName: string | null = null;
    let teamName: string | null = null;
    try {
      const leagueData = await fetchLeagueStandings(config.fplLeagueId);
      const manager = leagueData.standings.results.find(
        (m) => m.entry.toString() === config.fplManagerId
      );
      managerName =
        manager?.player_name ??
        `${entry.player_first_name} ${entry.player_last_name}`;
      teamName = manager?.entry_name ?? entry.name;
    } catch {
      managerName = `${entry.player_first_name} ${entry.player_last_name}`;
      teamName = entry.name;
    }

    return {
      initialSquad,
      allPlayers,
      teams,
      fixturesByTeam,
      upcomingGWs,
      currentGW,
      events,
      managerName,
      teamName,
      noManagerId: false,
      error: null,
    };
  } catch (err) {
    return {
      initialSquad: null,
      allPlayers: [],
      teams: [],
      fixturesByTeam: {},
      upcomingGWs: [],
      currentGW: 1,
      events: [],
      managerName: null,
      teamName: null,
      noManagerId: false,
      error:
        err instanceof Error ? err.message : "Failed to load planner data",
    };
  }
}

// ============================================================================
// Constants
// ============================================================================

const INDIGO = "#4F46E5";
const INDIGO_LIGHT = "#6366F1";
const CHIPS = [
  { value: "wildcard", label: "Wildcard" },
  { value: "freehit", label: "Free Hit" },
  { value: "triplecaptain", label: "Triple Captain" },
  { value: "bboost", label: "Bench Boost" },
];

const POSITION_LABELS: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

// ============================================================================
// Sub-components
// ============================================================================

function PlayerSearchModal({
  isOpen,
  onClose,
  onSelect,
  allPlayers,
  teams,
  fixturesByTeam,
  upcomingGWs,
  filterPosition,
  maxCost,
  excludeIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (playerId: number) => void;
  allPlayers: PlayerInfo[];
  teams: { id: number; name: string; shortName: string }[];
  fixturesByTeam: Record<number, TeamFixtureCell[]>;
  upcomingGWs: number[];
  filterPosition: number | null;
  maxCost: number;
  excludeIds: Set<number>;
}) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<number | null>(filterPosition);
  const [teamFilter, setTeamFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"form" | "points" | "cost">("form");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setPosFilter(filterPosition);
      setTeamFilter(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, filterPosition]);

  const filtered = useMemo(() => {
    let results = allPlayers.filter((p) => !excludeIds.has(p.id));

    if (posFilter) {
      results = results.filter((p) => p.elementType === posFilter);
    }
    if (teamFilter) {
      results = results.filter((p) => p.teamId === teamFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      // Support searching by cost like "4.5"
      if (/^\d+\.?\d*$/.test(s)) {
        const targetCost = parseFloat(s);
        results = results.filter(
          (p) => Math.abs(p.cost - targetCost) < 0.5
        );
      } else {
        results = results.filter(
          (p) =>
            p.webName.toLowerCase().includes(s) ||
            p.teamShort.toLowerCase().includes(s)
        );
      }
    }

    results = results.filter((p) => p.cost <= maxCost);

    return results
      .sort((a, b) => {
        switch (sortBy) {
          case "form":
            return parseFloat(b.form) - parseFloat(a.form);
          case "points":
            return b.totalPoints - a.totalPoints;
          case "cost":
            return b.cost - a.cost;
        }
      })
      .slice(0, 50);
  }, [allPlayers, excludeIds, posFilter, teamFilter, search, sortBy, maxCost]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="kit-headline text-xl text-gray-900">Select Player</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, team, or cost (e.g. 4.5)"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {[null, 1, 2, 3, 4].map((pos) => (
                <button
                  key={pos ?? "all"}
                  onClick={() => setPosFilter(pos)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    posFilter === pos
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {pos ? POSITION_LABELS[pos] : "All"}
                </button>
              ))}
            </div>
            <select
              value={teamFilter ?? ""}
              onChange={(e) =>
                setTeamFilter(e.target.value ? parseInt(e.target.value) : null)
              }
              className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Teams</option>
              {teams
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.shortName}
                  </option>
                ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "form" | "points" | "cost")
              }
              className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-indigo-400"
            >
              <option value="form">Sort: Form</option>
              <option value="points">Sort: Points</option>
              <option value="cost">Sort: Cost</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              No players match your search
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((player) => {
                const fixtures = (fixturesByTeam[player.teamId] ?? []).slice(
                  0,
                  5
                );
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      onSelect(player.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm truncate">
                          {player.webName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">
                          {player.teamShort} &middot;{" "}
                          {POSITION_LABELS[player.elementType]}
                        </span>
                        {player.status !== "a" && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                              player.status === "d"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {player.status === "d" ? "Doubt" : "Injured"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                        <span>{player.cost.toFixed(1)}m</span>
                        <span>Form: {player.form}</span>
                        <span>{player.totalPoints} pts</span>
                        <span>{player.selectedByPercent}%</span>
                      </div>
                    </div>
                    {/* Mini fixture ticker */}
                    <div className="flex gap-0.5 shrink-0">
                      {fixtures.map((f, i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold ${getDifficultyColor(f.difficulty)}`}
                          title={`GW${f.gameweek}: ${f.opponentShort} ${f.isHome ? "(H)" : "(A)"}`}
                        >
                          {f.isBlank ? "-" : f.opponentShort.slice(0, 3)}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SquadPlayerRow({
  player,
  isSwapping,
  onSwap,
  onCaptain,
  onViceCaptain,
  onRemoveTransfer,
  isNewTransfer,
  fixturesByTeam,
  upcomingGWs,
  activeGW,
}: {
  player: SquadPlayer;
  isSwapping: boolean;
  onSwap: () => void;
  onCaptain: () => void;
  onViceCaptain: () => void;
  onRemoveTransfer: (() => void) | null;
  isNewTransfer: boolean;
  fixturesByTeam: Record<number, TeamFixtureCell[]>;
  upcomingGWs: number[];
  activeGW: number;
}) {
  const fixtures = (fixturesByTeam[player.teamId] ?? []).filter(
    (f) => f.gameweek >= activeGW
  ).slice(0, 5);

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
        isNewTransfer
          ? "bg-green-50 border border-green-200"
          : "bg-gray-50 hover:bg-gray-100"
      } ${isSwapping ? "ring-2 ring-indigo-400" : ""}`}
    >
      {/* Position badge */}
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
          player.elementType === 1
            ? "bg-amber-100 text-amber-700"
            : player.elementType === 2
              ? "bg-blue-100 text-blue-700"
              : player.elementType === 3
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
        }`}
      >
        {getPositionLabel(player.elementType)}
      </span>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-semibold text-sm truncate ${
              isNewTransfer ? "text-green-800" : "text-gray-900"
            }`}
          >
            {player.webName}
          </span>
          {player.status !== "a" && (
            <AlertTriangle
              size={12}
              className={
                player.status === "d" ? "text-amber-500" : "text-red-500"
              }
            />
          )}
        </div>
        <div className="text-[10px] text-gray-500">
          {player.cost.toFixed(1)}m &middot; {player.form} form
        </div>
      </div>

      {/* Mini fixtures */}
      <div className="flex gap-0.5 shrink-0 max-sm:hidden">
        {fixtures.map((f, i) => (
          <div
            key={i}
            className={`w-6 h-5 rounded flex items-center justify-center text-[8px] font-bold ${getDifficultyColor(f.difficulty)}`}
            title={`GW${f.gameweek}: ${f.opponentShort} ${f.isHome ? "(H)" : "(A)"}`}
          >
            {f.isBlank ? "-" : f.opponentShort.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onCaptain}
          title="Set captain"
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
            player.isCaptain
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600"
          }`}
        >
          C
        </button>
        <button
          onClick={onViceCaptain}
          title="Set vice-captain"
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
            player.isViceCaptain
              ? "bg-indigo-400 text-white"
              : "bg-gray-200 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600"
          }`}
        >
          V
        </button>
        <button
          onClick={onSwap}
          title="Transfer out"
          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
            isSwapping
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-400 hover:bg-red-100 hover:text-red-600"
          }`}
        >
          <ArrowRightLeft size={12} />
        </button>
        {isNewTransfer && onRemoveTransfer && (
          <button
            onClick={onRemoveTransfer}
            title="Undo transfer"
            className="w-6 h-6 rounded flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function TransferPlannerPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    initialSquad,
    allPlayers,
    teams,
    fixturesByTeam,
    upcomingGWs,
    currentGW,
    events,
    managerName,
    teamName,
    noManagerId,
    error,
  } = loaderData;

  // Plan state
  const [plan, setPlan] = useState<TransferPlanData>({ gameweeks: {} });
  const [activeGWIndex, setActiveGWIndex] = useState(0);
  const [swappingPlayerId, setSwappingPlayerId] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const activeGW = upcomingGWs[activeGWIndex] ?? currentGW + 1;

  // Build player lookup
  const playerMap = useMemo(
    () => new Map(allPlayers.map((p) => [p.id, p])),
    [allPlayers]
  );

  // Compute squad state by applying plans up to active GW
  const computedSquad = useMemo(() => {
    if (!initialSquad) return null;

    let squad = initialSquad;
    // Build a fake elements array from allPlayers for applyPlanToSquad
    const fakeElements: FPLElement[] = allPlayers.map((p) => ({
      id: p.id,
      code: 0,
      element_type: p.elementType,
      first_name: "",
      second_name: "",
      web_name: p.webName,
      team: p.teamId,
      team_code: 0,
      status: p.status as "a" | "d" | "i" | "u",
      now_cost: Math.round(p.cost * 10),
      cost_change_start: 0,
      cost_change_event: 0,
      total_points: p.totalPoints,
      event_points: 0,
      points_per_game: "0.0",
      ep_this: null,
      ep_next: p.epNext,
      form: p.form,
      selected_by_percent: p.selectedByPercent,
      transfers_in: 0,
      transfers_out: 0,
      transfers_in_event: 0,
      transfers_out_event: 0,
      chance_of_playing_this_round: null,
      chance_of_playing_next_round: null,
      value_form: "0.0",
      value_season: "0.0",
      minutes: 0,
      goals_scored: 0,
      assists: 0,
      clean_sheets: 0,
      goals_conceded: 0,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 0,
      red_cards: 0,
      saves: 0,
      bonus: 0,
      bps: 0,
      influence: "0.0",
      creativity: "0.0",
      threat: "0.0",
      ict_index: "0.0",
      starts: 0,
      expected_goals: "0.0",
      expected_assists: "0.0",
      expected_goal_involvements: "0.0",
      expected_goals_conceded: "0.0",
    }));

    for (const gw of upcomingGWs) {
      if (gw > activeGW) break;
      const gwPlan = plan.gameweeks[gw.toString()];
      if (gwPlan && gwPlan.transfers.length > 0) {
        squad = applyPlanToSquad(squad, gwPlan, fakeElements);
      } else if (gwPlan) {
        // Apply captain/vc changes even without transfers
        squad = applyPlanToSquad(
          squad,
          { ...gwPlan, transfers: [] },
          fakeElements
        );
      } else {
        // Carry forward free transfers
        squad = {
          ...squad,
          freeTransfers: Math.min(5, squad.freeTransfers + 1),
        };
      }
    }

    return squad;
  }, [initialSquad, plan, activeGW, upcomingGWs, allPlayers]);

  const currentGWPlan: GameweekPlan = plan.gameweeks[activeGW.toString()] ?? {
    transfers: [],
    captain: null,
    viceCaptain: null,
    chip: null,
    benchOrder: [],
  };

  const hitCost = computedSquad
    ? calculateHitCost(
        currentGWPlan.transfers.length,
        computedSquad.freeTransfers,
        currentGWPlan.chip
      )
    : 0;

  const totalPlannedTransfers = Object.values(plan.gameweeks).reduce(
    (sum, gw) => sum + gw.transfers.length,
    0
  );

  const totalHitCost = useMemo(() => {
    if (!initialSquad) return 0;
    let squad = initialSquad;
    let totalHits = 0;

    const fakeElements: FPLElement[] = allPlayers.map((p) => ({
      id: p.id,
      code: 0,
      element_type: p.elementType,
      first_name: "",
      second_name: "",
      web_name: p.webName,
      team: p.teamId,
      team_code: 0,
      status: p.status as "a" | "d" | "i" | "u",
      now_cost: Math.round(p.cost * 10),
      cost_change_start: 0,
      cost_change_event: 0,
      total_points: p.totalPoints,
      event_points: 0,
      points_per_game: "0.0",
      ep_this: null,
      ep_next: p.epNext,
      form: p.form,
      selected_by_percent: p.selectedByPercent,
      transfers_in: 0,
      transfers_out: 0,
      transfers_in_event: 0,
      transfers_out_event: 0,
      chance_of_playing_this_round: null,
      chance_of_playing_next_round: null,
      value_form: "0.0",
      value_season: "0.0",
      minutes: 0,
      goals_scored: 0,
      assists: 0,
      clean_sheets: 0,
      goals_conceded: 0,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 0,
      red_cards: 0,
      saves: 0,
      bonus: 0,
      bps: 0,
      influence: "0.0",
      creativity: "0.0",
      threat: "0.0",
      ict_index: "0.0",
      starts: 0,
      expected_goals: "0.0",
      expected_assists: "0.0",
      expected_goal_involvements: "0.0",
      expected_goals_conceded: "0.0",
    }));

    for (const gw of upcomingGWs) {
      const gwPlan = plan.gameweeks[gw.toString()];
      if (gwPlan) {
        totalHits += calculateHitCost(
          gwPlan.transfers.length,
          squad.freeTransfers,
          gwPlan.chip
        );
        if (gwPlan.transfers.length > 0) {
          squad = applyPlanToSquad(squad, gwPlan, fakeElements);
        } else {
          squad = {
            ...squad,
            freeTransfers: Math.min(5, squad.freeTransfers + 1),
          };
        }
      } else {
        squad = {
          ...squad,
          freeTransfers: Math.min(5, squad.freeTransfers + 1),
        };
      }
    }
    return totalHits;
  }, [initialSquad, plan, upcomingGWs, allPlayers]);

  // Squad validation
  const validationErrors = computedSquad
    ? validateSquad(computedSquad.players)
    : [];

  // Current squad player IDs for exclusion
  const currentSquadIds = useMemo(
    () => new Set(computedSquad?.players.map((p) => p.element) ?? []),
    [computedSquad]
  );

  // Swapping player info for search modal
  const swappingPlayer = computedSquad?.players.find(
    (p) => p.element === swappingPlayerId
  );

  // Group players by position
  const groupedPlayers = computedSquad
    ? groupByPosition(computedSquad.players)
    : null;

  // Find which elements were brought in this GW
  const newTransferIds = new Set(
    currentGWPlan.transfers.map((t) => t.elementIn)
  );

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const updateGWPlan = useCallback(
    (updates: Partial<GameweekPlan>) => {
      setPlan((prev) => ({
        ...prev,
        gameweeks: {
          ...prev.gameweeks,
          [activeGW.toString()]: {
            ...currentGWPlan,
            ...updates,
          },
        },
      }));
    },
    [activeGW, currentGWPlan]
  );

  const handleSwap = useCallback(
    (playerId: number) => {
      if (swappingPlayerId === playerId) {
        setSwappingPlayerId(null);
        return;
      }
      setSwappingPlayerId(playerId);
      setSearchOpen(true);
    },
    [swappingPlayerId]
  );

  const handleSelectReplacement = useCallback(
    (newPlayerId: number) => {
      if (!swappingPlayerId) return;

      const newTransfers = [
        ...currentGWPlan.transfers.filter(
          (t) => t.elementOut !== swappingPlayerId
        ),
        { elementIn: newPlayerId, elementOut: swappingPlayerId },
      ];

      updateGWPlan({ transfers: newTransfers });
      setSwappingPlayerId(null);
    },
    [swappingPlayerId, currentGWPlan, updateGWPlan]
  );

  const handleRemoveTransfer = useCallback(
    (elementOut: number) => {
      updateGWPlan({
        transfers: currentGWPlan.transfers.filter(
          (t) => t.elementOut !== elementOut
        ),
      });
    },
    [currentGWPlan, updateGWPlan]
  );

  const handleSetCaptain = useCallback(
    (playerId: number) => {
      updateGWPlan({
        captain: playerId,
        viceCaptain:
          currentGWPlan.viceCaptain === playerId
            ? null
            : currentGWPlan.viceCaptain,
      });
    },
    [currentGWPlan, updateGWPlan]
  );

  const handleSetViceCaptain = useCallback(
    (playerId: number) => {
      updateGWPlan({
        viceCaptain: playerId,
        captain:
          currentGWPlan.captain === playerId ? null : currentGWPlan.captain,
      });
    },
    [currentGWPlan, updateGWPlan]
  );

  const handleSetChip = useCallback(
    (chip: string | null) => {
      updateGWPlan({ chip });
    },
    [updateGWPlan]
  );

  const handleReset = useCallback(() => {
    setPlan({ gameweeks: {} });
  }, []);

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="min-h-screen" style={{ background: INDIGO }}>
      {/* Hero Section */}
      <section
        className="kit-hero kit-diagonal-cut"
        style={{ background: INDIGO }}
      >
        <div className="kit-watermark">PLAN</div>
        <div className="kit-stripe" style={{ background: INDIGO_LIGHT }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Plan your transfers weeks ahead
          </p>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            Transfer Planner
          </h1>
          {managerName && (
            <p
              className="text-white/50 text-sm mt-3 kit-animate-slide-up"
              style={{ "--delay": "200ms" } as React.CSSProperties}
            >
              {managerName} &middot; {teamName}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-4">
        {/* No Manager ID */}
        {noManagerId && (
          <div
            className="kit-card p-6 md:p-8 kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 mb-4">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
              <h2 className="kit-headline text-2xl text-gray-900">
                Setup Required
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Set the{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                FPL_MANAGER_ID
              </code>{" "}
              environment variable to load your squad into the Transfer Planner.
            </p>
            <p className="text-gray-500 text-sm">
              Find your manager ID in the URL when viewing your team:
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono ml-1">
                fantasy.premierleague.com/entry/<strong>YOUR_ID</strong>/event/1
              </code>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="kit-card p-6 md:p-8 kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className="kit-headline text-2xl text-gray-900">
                Error Loading Data
              </h2>
            </div>
            <p className="text-gray-600">{error}</p>
          </div>
        )}

        {/* Main Planner UI */}
        {computedSquad && (
          <>
            {/* GW Navigator + Stats Bar */}
            <div
              className="kit-card p-4 md:p-6 kit-animate-slide-up"
              style={{ "--delay": "200ms" } as React.CSSProperties}
            >
              {/* GW Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setActiveGWIndex((i) => Math.max(0, i - 1))
                  }
                  disabled={activeGWIndex === 0}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} className="text-gray-600" />
                </button>
                <div className="text-center">
                  <h2 className="kit-headline text-2xl text-gray-900">
                    Gameweek {activeGW}
                  </h2>
                  {events.find((e) => e.id === activeGW) && (
                    <p className="text-xs text-gray-400 mt-1">
                      Deadline:{" "}
                      {new Date(
                        events.find((e) => e.id === activeGW)!.deadlineTime
                      ).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    setActiveGWIndex((i) =>
                      Math.min(upcomingGWs.length - 1, i + 1)
                    )
                  }
                  disabled={activeGWIndex === upcomingGWs.length - 1}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={18} className="text-gray-600" />
                </button>
              </div>

              {/* GW Pills */}
              <div className="flex gap-1 overflow-x-auto pb-2 mb-4 -mx-2 px-2">
                {upcomingGWs.map((gw, idx) => {
                  const gwPlan = plan.gameweeks[gw.toString()];
                  const hasTransfers =
                    gwPlan && gwPlan.transfers.length > 0;
                  return (
                    <button
                      key={gw}
                      onClick={() => setActiveGWIndex(idx)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors relative ${
                        idx === activeGWIndex
                          ? "bg-indigo-600 text-white"
                          : hasTransfers
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      GW{gw}
                      {hasTransfers && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                          {gwPlan!.transfers.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="kit-stat-label text-gray-500">Bank</div>
                  <div className="kit-headline text-2xl text-gray-900 mt-1">
                    {computedSquad.bank.toFixed(1)}m
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="kit-stat-label text-gray-500">
                    Free Transfers
                  </div>
                  <div className="kit-headline text-2xl text-gray-900 mt-1">
                    {computedSquad.freeTransfers}
                  </div>
                </div>
                <div
                  className={`rounded-xl p-3 text-center ${hitCost > 0 ? "bg-red-50" : "bg-gray-50"}`}
                >
                  <div className="kit-stat-label text-gray-500">
                    GW Hit Cost
                  </div>
                  <div
                    className={`kit-headline text-2xl mt-1 ${hitCost > 0 ? "text-red-600" : "text-gray-900"}`}
                  >
                    {hitCost > 0 ? `-${hitCost}` : "0"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="kit-stat-label text-gray-500">
                    Squad Value
                  </div>
                  <div className="kit-headline text-2xl text-gray-900 mt-1">
                    {computedSquad.totalValue.toFixed(1)}m
                  </div>
                </div>
              </div>
            </div>

            {/* Chip Selector */}
            <div
              className="kit-card p-4 md:p-6 kit-animate-slide-up"
              style={{ "--delay": "300ms" } as React.CSSProperties}
            >
              <h3 className="kit-headline text-lg text-gray-900 mb-3">
                Chip
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSetChip(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    !currentGWPlan.chip
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  None
                </button>
                {CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => handleSetChip(chip.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      currentGWPlan.chip === chip.value
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Squad Grid */}
            <div
              className="kit-card p-4 md:p-6 kit-animate-slide-up"
              style={{ "--delay": "400ms" } as React.CSSProperties}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="kit-headline text-xl text-gray-900">
                  Your Squad
                </h3>
                {validationErrors.length > 0 && (
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold"
                  >
                    <AlertTriangle size={12} />
                    {validationErrors.length} issue
                    {validationErrors.length !== 1 ? "s" : ""}
                  </button>
                )}
              </div>

              {showValidation && validationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                  <ul className="text-xs text-red-700 space-y-1">
                    {validationErrors.map((err, i) => (
                      <li key={i}>
                        &bull; {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {groupedPlayers && (
                <div className="space-y-4">
                  {/* Starting XI */}
                  {(["GK", "DEF", "MID", "FWD"] as const).map((pos) => (
                    <div key={pos}>
                      <p className="kit-stat-label text-gray-400 mb-1.5 ml-1">
                        {pos === "GK"
                          ? "Goalkeepers"
                          : pos === "DEF"
                            ? "Defenders"
                            : pos === "MID"
                              ? "Midfielders"
                              : "Forwards"}
                      </p>
                      <div className="space-y-1">
                        {groupedPlayers[pos]?.map((player) => {
                          const origTransfer =
                            currentGWPlan.transfers.find(
                              (t) => t.elementIn === player.element
                            );
                          return (
                            <SquadPlayerRow
                              key={player.element}
                              player={player}
                              isSwapping={
                                swappingPlayerId === player.element
                              }
                              onSwap={() => handleSwap(player.element)}
                              onCaptain={() =>
                                handleSetCaptain(player.element)
                              }
                              onViceCaptain={() =>
                                handleSetViceCaptain(player.element)
                              }
                              onRemoveTransfer={
                                origTransfer
                                  ? () =>
                                      handleRemoveTransfer(
                                        origTransfer.elementOut
                                      )
                                  : null
                              }
                              isNewTransfer={newTransferIds.has(
                                player.element
                              )}
                              fixturesByTeam={fixturesByTeam}
                              upcomingGWs={upcomingGWs}
                              activeGW={activeGW}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Bench */}
                  <div>
                    <p className="kit-stat-label text-gray-400 mb-1.5 ml-1">
                      Bench
                    </p>
                    <div className="space-y-1 opacity-75">
                      {groupedPlayers.BENCH?.map((player) => {
                        const origTransfer =
                          currentGWPlan.transfers.find(
                            (t) => t.elementIn === player.element
                          );
                        return (
                          <SquadPlayerRow
                            key={player.element}
                            player={player}
                            isSwapping={
                              swappingPlayerId === player.element
                            }
                            onSwap={() => handleSwap(player.element)}
                            onCaptain={() =>
                              handleSetCaptain(player.element)
                            }
                            onViceCaptain={() =>
                              handleSetViceCaptain(player.element)
                            }
                            onRemoveTransfer={
                              origTransfer
                                ? () =>
                                    handleRemoveTransfer(
                                      origTransfer.elementOut
                                    )
                                : null
                            }
                            isNewTransfer={newTransferIds.has(player.element)}
                            fixturesByTeam={fixturesByTeam}
                            upcomingGWs={upcomingGWs}
                            activeGW={activeGW}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transfer Summary */}
            {currentGWPlan.transfers.length > 0 && (
              <div
                className="kit-card p-4 md:p-6 kit-animate-slide-up"
                style={{ "--delay": "500ms" } as React.CSSProperties}
              >
                <h3 className="kit-headline text-xl text-gray-900 mb-4">
                  GW{activeGW} Transfers
                </h3>
                <div className="space-y-2">
                  {currentGWPlan.transfers.map((transfer) => {
                    const outPlayer = playerMap.get(transfer.elementOut);
                    const inPlayer = playerMap.get(transfer.elementIn);
                    return (
                      <div
                        key={`${transfer.elementOut}-${transfer.elementIn}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                      >
                        {/* Out */}
                        <div className="flex-1 text-right">
                          <span className="font-semibold text-red-700 text-sm">
                            {outPlayer?.webName ?? "Unknown"}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1.5">
                            {outPlayer?.cost.toFixed(1)}m
                          </span>
                        </div>

                        <ArrowRightLeft
                          size={16}
                          className="text-indigo-500 shrink-0"
                        />

                        {/* In */}
                        <div className="flex-1">
                          <span className="font-semibold text-green-700 text-sm">
                            {inPlayer?.webName ?? "Unknown"}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1.5">
                            {inPlayer?.cost.toFixed(1)}m
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            handleRemoveTransfer(transfer.elementOut)
                          }
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Overall Plan Summary */}
            <div
              className="kit-card p-4 md:p-6 kit-animate-slide-up"
              style={{ "--delay": "600ms" } as React.CSSProperties}
            >
              <h3 className="kit-headline text-xl text-gray-900 mb-4">
                Plan Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingGWs.map((gw) => {
                  const gwPlan = plan.gameweeks[gw.toString()];
                  const hasActivity = gwPlan && (gwPlan.transfers.length > 0 || gwPlan.chip);
                  return (
                    <button
                      key={gw}
                      onClick={() =>
                        setActiveGWIndex(upcomingGWs.indexOf(gw))
                      }
                      className={`flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                        gw === activeGW
                          ? "bg-indigo-100 border-2 border-indigo-300"
                          : hasActivity
                            ? "bg-green-50 border border-green-200 hover:bg-green-100"
                            : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-sm text-gray-900">
                          GW{gw}
                        </span>
                        {gwPlan?.chip && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                            {CHIPS.find((c) => c.value === gwPlan.chip)
                              ?.label ?? gwPlan.chip}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {gwPlan && gwPlan.transfers.length > 0 && (
                          <span className="text-xs text-green-700 font-medium">
                            {gwPlan.transfers.length} transfer
                            {gwPlan.transfers.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {!hasActivity && (
                          <span className="text-xs text-gray-400">
                            No changes
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{totalPlannedTransfers}</span>{" "}
                  total transfer{totalPlannedTransfers !== 1 ? "s" : ""} planned
                  {totalHitCost > 0 && (
                    <span className="text-red-600 ml-2">
                      ({totalHitCost} pts in hits)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="flex items-center justify-between gap-3 kit-animate-slide-up"
              style={{ "--delay": "700ms" } as React.CSSProperties}
            >
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
              >
                <RotateCcw size={14} />
                Reset Plan
              </button>
            </div>
          </>
        )}

        {/* How to use */}
        {computedSquad && (
          <div
            className="kit-card p-4 kit-animate-slide-up"
            style={{ "--delay": "750ms" } as React.CSSProperties}
          >
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">How to use:</span>{" "}
              Navigate between gameweeks using the arrows or pills. Click the{" "}
              <ArrowRightLeft size={10} className="inline" /> button on any
              player to plan a transfer — search by name, team, or price (e.g.
              &quot;4.5&quot;). Set captaincy with <strong>C</strong>/
              <strong>V</strong> buttons. Activate chips per gameweek. Your bank
              and free transfers update automatically as you plan ahead. Hit
              &quot;Reset Plan&quot; to start over.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="pb-24 sm:pb-8 text-center">
        <p className="text-white/30 text-xs">
          Built with React Router v7 &middot; Data from FPL API
        </p>
      </footer>

      {/* Player Search Modal */}
      <PlayerSearchModal
        isOpen={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSwappingPlayerId(null);
        }}
        onSelect={handleSelectReplacement}
        allPlayers={allPlayers}
        teams={teams}
        fixturesByTeam={fixturesByTeam}
        upcomingGWs={upcomingGWs}
        filterPosition={swappingPlayer?.elementType ?? null}
        maxCost={
          (computedSquad?.bank ?? 0) + (swappingPlayer?.cost ?? 100)
        }
        excludeIds={currentSquadIds}
      />
    </div>
  );
}
