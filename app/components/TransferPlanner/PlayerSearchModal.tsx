/**
 * Player search modal for the Transfer Planner
 * Allows searching, filtering, and selecting replacement players
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { getDifficultyColor } from "~/utils/fixture-difficulty";
import type { PlayerInfo, TeamFixtureCell } from "./types";
import { POSITION_LABELS } from "./types";

interface PlayerSearchModalProps {
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
}

export function PlayerSearchModal({
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
}: PlayerSearchModalProps) {
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
