/**
 * Transfer Planner route
 * Interactive multi-gameweek transfer planning tool
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useFetcher } from "react-router";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRightLeft,
  AlertTriangle,
  Zap,
  Cloud,
  CloudOff,
  Trash2,
} from "lucide-react";
import {
  fetchBootstrapStatic,
  fetchFixtures,
  fetchGameweekPicks,
  fetchManagerEntry,
  fetchManagerHistory,
  fetchLeagueStandings,
} from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import {
  buildSquadFromPicks,
  applyPlanToSquad,
  calculateHitCost,
  calculateFreeTransfers,
  validateSquad,
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
import { requireAuth } from "~/lib/pocketbase/auth";
import { createServerClient } from "~/lib/pocketbase/client";
import { sanitizeFilterString } from "~/lib/pocketbase/sanitize";
import { PlayerSearchModal } from "~/components/TransferPlanner/PlayerSearchModal";
import { SquadPlayerRow } from "~/components/TransferPlanner/SquadPlayerRow";
import type { PlayerInfo, TeamFixtureCell, LoaderData } from "~/components/TransferPlanner/types";
import { INDIGO, INDIGO_LIGHT, CHIPS } from "~/components/TransferPlanner/types";

// ============================================================================
// Loader
// ============================================================================

export async function loader({ request }: Route.LoaderArgs): Promise<LoaderData> {
  const user = await requireAuth(request);
  const config = getEnvConfig();
  const managerId = user.fplManagerId.toString();
  const pb = createServerClient(request);

  try {
    const [bootstrap, allFixtures, entry, managerHistory] = await Promise.all([
      fetchBootstrapStatic(),
      fetchFixtures(),
      fetchManagerEntry(managerId),
      fetchManagerHistory(managerId),
    ]);

    const currentEvent = bootstrap.events.find((e) => e.is_current);
    const nextEvent = bootstrap.events.find((e) => e.is_next);
    const currentGW = currentEvent?.id ?? nextEvent?.id ?? 1;
    const picksGW = currentEvent?.id ?? 1;

    const picks = await fetchGameweekPicks(managerId, picksGW);

    const freeTransfers = calculateFreeTransfers(
      managerHistory.current,
      managerHistory.chips
    );

    const initialSquad = buildSquadFromPicks(
      picks.picks,
      bootstrap.elements,
      picks.entry_history.bank,
      freeTransfers
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
        (m) => m.entry.toString() === managerId
      );
      managerName =
        manager?.player_name ??
        `${entry.player_first_name} ${entry.player_last_name}`;
      teamName = manager?.entry_name ?? entry.name;
    } catch {
      managerName = `${entry.player_first_name} ${entry.player_last_name}`;
      teamName = entry.name;
    }

    // Load saved plan from PocketBase
    let savedPlan: TransferPlanData | null = null;
    try {
      const record = await pb
        .collection("transfer_plans")
        .getFirstListItem(`user = "${sanitizeFilterString(user.id)}"`)
;
      if (record?.plan_data) {
        savedPlan = record.plan_data as TransferPlanData;
      }
    } catch {
      // No saved plan found — that's fine
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
      savedPlan,
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
      savedPlan: null,
      error:
        err instanceof Error ? err.message : "Failed to load planner data",
    };
  }
}

// ============================================================================
// Action (save/delete plan)
// ============================================================================

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const pb = createServerClient(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const planJson = formData.get("plan") as string;
    const currentGameweek = Number(formData.get("currentGameweek"));

    if (!planJson) {
      return { ok: false, error: "No plan data provided" };
    }

    let planData: TransferPlanData;
    try {
      planData = JSON.parse(planJson);
    } catch {
      return { ok: false, error: "Invalid plan data" };
    }

    try {
      // Try to find existing record
      const existing = await pb
        .collection("transfer_plans")
        .getFirstListItem(`user = "${sanitizeFilterString(user.id)}"`)
;
      // Update existing
      await pb.collection("transfer_plans").update(existing.id, {
        plan_data: planData,
        current_gameweek: currentGameweek,
      });

      return { ok: true, savedAt: new Date().toISOString() };
    } catch {
      // No existing record, create new
      await pb.collection("transfer_plans").create({
        user: user.id,
        plan_data: planData,
        current_gameweek: currentGameweek,
      });

      return { ok: true, savedAt: new Date().toISOString() };
    }
  }

  if (intent === "delete") {
    try {
      const existing = await pb
        .collection("transfer_plans")
        .getFirstListItem(`user = "${sanitizeFilterString(user.id)}"`)
;
      await pb.collection("transfer_plans").delete(existing.id);
    } catch {
      // Nothing to delete
    }
    return { ok: true };
  }

  return { ok: false, error: "Unknown intent" };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build a fake FPLElement array from PlayerInfo for applyPlanToSquad.
 * Avoids duplicating the boilerplate object literal in multiple useMemo blocks.
 */
function buildFakeElements(allPlayers: PlayerInfo[]): FPLElement[] {
  return allPlayers.map((p) => ({
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
    savedPlan,
    error,
  } = loaderData;

  // Plan state — initialise from saved plan if available
  const [plan, setPlan] = useState<TransferPlanData>(
    () => savedPlan ?? { gameweeks: {} }
  );
  const [activeGWIndex, setActiveGWIndex] = useState(0);
  const [swappingPlayerId, setSwappingPlayerId] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Auto-save via fetcher
  const saveFetcher = useFetcher();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPlanRef = useRef<string>(JSON.stringify(savedPlan ?? { gameweeks: {} }));
  const isSaving = saveFetcher.state !== "idle";
  const saveResult = saveFetcher.data as { ok?: boolean; savedAt?: string; error?: string } | undefined;

  // Debounced auto-save when plan changes
  useEffect(() => {
    const planJson = JSON.stringify(plan);

    // Skip if plan hasn't changed from last save
    if (planJson === lastSavedPlanRef.current) return;

    // Skip empty plans
    const hasContent = Object.keys(plan.gameweeks).length > 0;
    if (!hasContent) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      lastSavedPlanRef.current = planJson;
      saveFetcher.submit(
        {
          intent: "save",
          plan: planJson,
          currentGameweek: currentGW.toString(),
        },
        { method: "post" }
      );
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [plan, currentGW]);

  const activeGW = upcomingGWs[activeGWIndex] ?? currentGW + 1;

  // Build player lookup
  const playerMap = useMemo(
    () => new Map(allPlayers.map((p) => [p.id, p])),
    [allPlayers]
  );

  // Compute squad state by applying plans up to active GW
  const { computedSquad, activeGWFreeTransfers } = useMemo(() => {
    if (!initialSquad) return { computedSquad: null, activeGWFreeTransfers: 0 };

    let squad = initialSquad;
    const fakeElements = buildFakeElements(allPlayers);

    let freeTransfersBeforeActiveGW = squad.freeTransfers;

    for (const gw of upcomingGWs) {
      if (gw > activeGW) break;

      if (gw === activeGW) {
        freeTransfersBeforeActiveGW = squad.freeTransfers;
      }

      const gwPlan = plan.gameweeks[gw.toString()];
      if (gwPlan && gwPlan.transfers.length > 0) {
        squad = applyPlanToSquad(squad, gwPlan, fakeElements);
      } else if (gwPlan) {
        squad = applyPlanToSquad(
          squad,
          { ...gwPlan, transfers: [] },
          fakeElements
        );
      } else {
        squad = {
          ...squad,
          freeTransfers: Math.min(5, squad.freeTransfers + 1),
        };
      }
    }

    return { computedSquad: squad, activeGWFreeTransfers: freeTransfersBeforeActiveGW };
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
        activeGWFreeTransfers,
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
    const fakeElements = buildFakeElements(allPlayers);

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

      const existingTransfer = currentGWPlan.transfers.find(
        (t) => t.elementIn === swappingPlayerId
      );

      let newTransfers;
      if (existingTransfer) {
        newTransfers = [
          ...currentGWPlan.transfers.filter(
            (t) => t.elementIn !== swappingPlayerId
          ),
          { elementIn: newPlayerId, elementOut: existingTransfer.elementOut },
        ];
      } else {
        newTransfers = [
          ...currentGWPlan.transfers.filter(
            (t) => t.elementOut !== swappingPlayerId
          ),
          { elementIn: newPlayerId, elementOut: swappingPlayerId },
        ];
      }

      updateGWPlan({ transfers: newTransfers });
      setSwappingPlayerId(null);
      setSearchOpen(false);
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
    lastSavedPlanRef.current = JSON.stringify({ gameweeks: {} });
    saveFetcher.submit(
      { intent: "delete" },
      { method: "post" }
    );
  }, [saveFetcher]);

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
              <div className="flex gap-1 overflow-x-auto pt-2 pb-2 mb-4 -mx-2 px-2">
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
                    {activeGWFreeTransfers}
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

            {/* Action Buttons + Save Status */}
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
              <div className="flex items-center gap-2 text-xs text-white/60">
                {isSaving ? (
                  <>
                    <Cloud size={14} className="animate-pulse" />
                    <span>Saving…</span>
                  </>
                ) : saveResult?.ok ? (
                  <>
                    <Cloud size={14} className="text-green-400" />
                    <span className="text-green-400">Saved</span>
                  </>
                ) : saveResult?.error ? (
                  <>
                    <CloudOff size={14} className="text-red-400" />
                    <span className="text-red-400">Save failed</span>
                  </>
                ) : savedPlan ? (
                  <>
                    <Cloud size={14} />
                    <span>Plan loaded</span>
                  </>
                ) : null}
              </div>
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
