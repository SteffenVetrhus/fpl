/**
 * Individual squad player row for the Transfer Planner
 * Shows player info, mini fixtures, and action buttons (captain/transfer)
 */

import { ArrowRightLeft, AlertTriangle, Trash2 } from "lucide-react";
import { getPositionLabel } from "~/utils/transfer-planner";
import { getDifficultyColor } from "~/utils/fixture-difficulty";
import type { SquadPlayer } from "~/utils/transfer-planner";
import type { TeamFixtureCell } from "./types";

interface SquadPlayerRowProps {
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
}

export function SquadPlayerRow({
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
}: SquadPlayerRowProps) {
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
