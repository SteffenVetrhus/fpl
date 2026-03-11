import { useState } from "react";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Check,
  X as XIcon,
  Shield,
  Zap,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import type { Route } from "./+types/strategy-corner";

interface ChipSchedule {
  name: string;
  gameweek: string;
  optional?: boolean;
}

interface Strategy {
  id: number;
  name: string;
  tagline: string;
  icon: typeof Shield;
  color: string;
  chips: ChipSchedule[];
  howToPlay: string[];
  importantSections: {
    title: string;
    include: string[];
    exclude: string[];
  }[];
  worksIf: string[];
}

const strategies: Strategy[] = [
  {
    id: 1,
    name: "The Template",
    tagline: "Minimise risk with the standard chip order",
    icon: Shield,
    color: "#4F46E5",
    chips: [
      { name: "Wildcard", gameweek: "GW32" },
      { name: "Bench Boost", gameweek: "GW33" },
      { name: "Free Hit", gameweek: "GW34" },
      { name: "Triple Captain", gameweek: "GW36", optional: true },
    ],
    howToPlay: [
      "Make transfers with no regard to fixtures beyond GW31, ensuring you have 10-11 playing players for BGW31.",
      "Wildcard in GW32 picking as many DGW33 players as possible, to maximise a GW33 Bench Boost.",
      "Free Hit in BGW34 to remove all of your blanking players.",
      "If you still have your Triple Captain, use it on a future DGW (this is likely to be in GW36).",
    ],
    importantSections: [
      {
        title: "Wildcard Players",
        include: ["ARS", "BHA", "CHE", "CRY", "LIV/MCI", "NEW", "+ maybe BOU, LEE"],
        exclude: ["EVE", "FUL", "NFO", "SUN", "TOT", "WHU", "WOL"],
      },
      {
        title: "Free Hit Players",
        include: ["AVL", "EVE", "FUL", "LIV/MCI", "MUN", "NFO", "SUN", "TOT", "WOL"],
        exclude: ["ARS", "BHA", "CHE", "CRY", "LIV/MCI", "NEW"],
      },
    ],
    worksIf: [
      "You are well prepared for the GW30 blanks",
      "You still have your WC, FH & BB chips",
      "You want to minimise your risk",
    ],
  },
  {
    id: 2,
    name: "The Reverse",
    tagline: "Flip the script — Wildcard early, Free Hit late",
    icon: RotateCcw,
    color: "#0891B2",
    chips: [
      { name: "Wildcard", gameweek: "GW32" },
      { name: "Free Hit", gameweek: "GW34" },
      { name: "Bench Boost", gameweek: "GW35", optional: true },
      { name: "Triple Captain", gameweek: "GW36", optional: true },
    ],
    howToPlay: [
      "Make transfers with no regard to fixtures beyond GW31, ensuring you have 10-11 playing players for BGW31.",
      "Wildcard in either GW32 or GW34, picking as many BGW34 playing players as possible.",
      "Free Hit in DGW33, picking a full squad of Doublers.",
      "Optionally Bench Boost whenever your Bench looks strong, and Triple Captain whenever there's a Double.",
    ],
    importantSections: [
      {
        title: "Wildcard Players",
        include: ["AVL", "BRE", "EVE", "LIV/MCI", "MUN", "SUN", "TOT", "WOL"],
        exclude: ["ARS", "BHA", "CHE", "CRY", "LIV/MCI", "NEW", "+ maybe BOU, LEE"],
      },
      {
        title: "Free Hit Players",
        include: ["ARS", "BHA", "CHE", "CRY", "LIV/MCI", "NEW", "+ maybe BOU, LEE"],
        exclude: ["AVL", "EVE", "FUL", "LIV/MCI", "MUN", "SUN", "TOT", "WOL"],
      },
    ],
    worksIf: [
      "You are well prepared for the GW30 blanks",
      "You have already used (or simply do not value) the BB",
      "You want to try something different",
    ],
  },
  {
    id: 3,
    name: "No Wildcard",
    tagline: "Already used your WC? There's still a path",
    icon: HelpCircle,
    color: "#D97706",
    chips: [
      { name: "Bench Boost", gameweek: "GW33", optional: true },
      { name: "Free Hit", gameweek: "GW34" },
      { name: "Triple Captain", gameweek: "GW36", optional: true },
    ],
    howToPlay: [
      "Make transfers to bring in players that are likely to Double in DGW33, whilst also preparing for BGW31.",
      "Optionally Bench Boost in DGW33. If you can't make it work, save for a later week when your Bench is stronger.",
      "Free Hit in BGW34 to remove all of your blanking players.",
      "If you still have your Triple Captain, use it on a future DGW (this is likely to be in GW36).",
    ],
    importantSections: [
      {
        title: "Transfer Targets (after GW31)",
        include: ["ARS", "BHA", "CHE", "CRY", "LIV/MCI", "NEW", "+ maybe BOU, LEE"],
        exclude: ["EVE", "FUL", "NFO", "SUN", "TOT", "WHU", "WOL"],
      },
      {
        title: "Free Hit Players",
        include: ["AVL", "EVE", "FUL", "LIV/MCI", "MUN", "NFO", "SUN", "TOT", "WOL"],
        exclude: ["ARS", "BHA", "CHE", "CRY", "LIV/MCI", "NEW"],
      },
    ],
    worksIf: [
      "You have already used your Wildcard",
      "You value players from the teams who Double more than the players from the teams who don't Blank",
    ],
  },
  {
    id: 4,
    name: "The Unprepared",
    tagline: "Behind on planning? This chip order catches you up",
    icon: Zap,
    color: "#DC2626",
    chips: [
      { name: "Free Hit", gameweek: "GW32" },
      { name: "Bench Boost", gameweek: "GW33" },
      { name: "Wildcard", gameweek: "GW34" },
      { name: "Triple Captain", gameweek: "GW36", optional: true },
    ],
    howToPlay: [
      "Free Hit in BGW31 to remove all of your blanking players from ARS, CRY, MCI & WOL.",
      "Use transfers to buy DGW33 doublers. Bench Boost in DGW33 if it works for you, if not, save it for a later week.",
      "Wildcard in BGW34 to remove 10-11 blanking players.",
      "If you still have your Triple Captain, use it on a future DGW (this is likely to be in GW36).",
    ],
    importantSections: [
      {
        title: "Free Hit Players",
        include: ["AVL", "BRE", "CHE", "FUL", "LIV", "MUN", "NEW"],
        exclude: ["ARS", "CRY", "MCI", "WOL"],
      },
      {
        title: "Wildcard Players",
        include: ["AVL", "BRE", "EVE", "LIV/MCI", "MUN", "SUN", "TOT", "WOL"],
        exclude: ["ARS", "BHA", "CHE", "CRY", "LIV/MCI", "NEW", "+ maybe BOU, LEE"],
      },
    ],
    worksIf: [
      "You have already used your Wildcard",
      "You value players from the teams who Double more than the players from the teams who don't Blank",
    ],
  },
];

type FixtureType = "home" | "away" | "blank";

interface Fixture {
  opponent: string;
  type: FixtureType;
}

interface TeamFixtures {
  team: string;
  shortName: string;
  fixtures: Record<string, Fixture[]>;
}

const fixtureData: TeamFixtures[] = [
  { team: "Arsenal", shortName: "ARS", fixtures: { "BGW31": [{ opponent: "", type: "blank" }], "GW32": [{ opponent: "BOU (H)", type: "home" }], "DGW33": [{ opponent: "MCI (A)", type: "away" }, { opponent: "NEW (H)?", type: "home" }], "BGW34": [{ opponent: "NEW (H)?", type: "home" }], "GW35": [{ opponent: "FUL (H)", type: "home" }], "DGW36/7": [{ opponent: "WHU (A)", type: "away" }] } },
  { team: "Aston Villa", shortName: "AVL", fixtures: { "BGW31": [{ opponent: "WHU (H)", type: "home" }], "GW32": [{ opponent: "NFO (A)", type: "away" }], "DGW33": [{ opponent: "SUN (H)", type: "home" }], "BGW34": [{ opponent: "FUL (A)", type: "away" }], "GW35": [{ opponent: "TOT (H)", type: "home" }], "DGW36/7": [{ opponent: "BUR (A)", type: "away" }] } },
  { team: "Bournemouth", shortName: "BOU", fixtures: { "BGW31": [{ opponent: "MUN (H)", type: "home" }], "GW32": [{ opponent: "ARS (A)", type: "away" }], "DGW33": [{ opponent: "NEW (A)", type: "away" }], "BGW34": [{ opponent: "LEE (H)?", type: "home" }], "GW35": [{ opponent: "CRY (H)", type: "home" }], "DGW36/7": [{ opponent: "FUL (A)", type: "away" }] } },
  { team: "Brentford", shortName: "BRE", fixtures: { "BGW31": [{ opponent: "LEE (A)", type: "away" }], "GW32": [{ opponent: "EVE (H)", type: "home" }], "DGW33": [{ opponent: "FUL (H)", type: "home" }], "BGW34": [{ opponent: "MUN (A)", type: "away" }], "GW35": [{ opponent: "WHU (H)", type: "home" }], "DGW36/7": [{ opponent: "MCI (A)", type: "away" }] } },
  { team: "Brighton", shortName: "BHA", fixtures: { "BGW31": [{ opponent: "LIV (H)", type: "home" }], "GW32": [{ opponent: "BUR (A)", type: "away" }], "DGW33": [{ opponent: "TOT (A)", type: "away" }, { opponent: "CHE (H)?", type: "home" }], "BGW34": [{ opponent: "CHE (H)?", type: "home" }], "GW35": [{ opponent: "NEW (A)", type: "away" }], "DGW36/7": [{ opponent: "WOL (H)", type: "home" }] } },
  { team: "Burnley", shortName: "BUR", fixtures: { "BGW31": [{ opponent: "FUL (A)", type: "away" }], "GW32": [{ opponent: "BHA (H)", type: "home" }], "DGW33": [{ opponent: "NFO (A)", type: "away" }, { opponent: "MCI (H)?", type: "home" }], "BGW34": [{ opponent: "MCI (H)?", type: "home" }], "GW35": [{ opponent: "LEE (A)", type: "away" }], "DGW36/7": [{ opponent: "AVL (H)", type: "home" }, { opponent: "MCI (H)?", type: "home" }] } },
  { team: "Chelsea", shortName: "CHE", fixtures: { "BGW31": [{ opponent: "EVE (A)", type: "away" }], "GW32": [{ opponent: "MCI (H)", type: "home" }], "DGW33": [{ opponent: "MUN (H)", type: "home" }, { opponent: "BHA (A)?", type: "away" }], "BGW34": [{ opponent: "BHA (A)?", type: "away" }], "GW35": [{ opponent: "NFO (H)", type: "home" }], "DGW36/7": [{ opponent: "LIV (A)", type: "away" }] } },
  { team: "Crystal Palace", shortName: "CRY", fixtures: { "BGW31": [{ opponent: "MCI (A)?", type: "away" }], "GW32": [{ opponent: "NEW (H)", type: "home" }], "DGW33": [{ opponent: "WHU (H)", type: "home" }, { opponent: "LIV (A)/MCI (A)?", type: "away" }], "BGW34": [{ opponent: "LIV (A)?", type: "away" }], "GW35": [{ opponent: "BOU (A)", type: "away" }], "DGW36/7": [{ opponent: "EVE (H)?", type: "home" }] } },
  { team: "Everton", shortName: "EVE", fixtures: { "BGW31": [{ opponent: "CHE (H)", type: "home" }], "GW32": [{ opponent: "BRE (A)", type: "away" }], "DGW33": [{ opponent: "LIV (H)", type: "home" }], "BGW34": [{ opponent: "WHU (A)?", type: "away" }], "GW35": [{ opponent: "MCI (H)?", type: "home" }], "DGW36/7": [{ opponent: "CRY (A)?", type: "away" }] } },
  { team: "Fulham", shortName: "FUL", fixtures: { "BGW31": [{ opponent: "BUR (H)", type: "home" }], "GW32": [{ opponent: "LIV (A)", type: "away" }], "DGW33": [{ opponent: "BRE (A)", type: "away" }], "BGW34": [{ opponent: "AVL (H)", type: "home" }], "GW35": [{ opponent: "ARS (A)", type: "away" }], "DGW36/7": [{ opponent: "BOU (H)", type: "home" }] } },
  { team: "Leeds", shortName: "LEE", fixtures: { "BGW31": [{ opponent: "BRE (H)", type: "home" }], "GW32": [{ opponent: "MUN (A)", type: "away" }], "DGW33": [{ opponent: "WOL (H)", type: "home" }, { opponent: "BOU (A)?", type: "away" }], "BGW34": [{ opponent: "BOU (A)?", type: "away" }], "GW35": [{ opponent: "BUR (H)", type: "home" }], "DGW36/7": [{ opponent: "TOT (H)?", type: "home" }] } },
  { team: "Liverpool", shortName: "LIV", fixtures: { "BGW31": [{ opponent: "BHA (A)", type: "away" }], "GW32": [{ opponent: "FUL (H)", type: "home" }], "DGW33": [{ opponent: "EVE (A)", type: "away" }], "BGW34": [{ opponent: "CRY (H)?", type: "home" }], "GW35": [{ opponent: "MUN (A)", type: "away" }], "DGW36/7": [{ opponent: "CHE (H)", type: "home" }] } },
  { team: "Man City", shortName: "MCI", fixtures: { "BGW31": [{ opponent: "CRY (H)?", type: "home" }], "GW32": [{ opponent: "CHE (A)", type: "away" }], "DGW33": [{ opponent: "ARS (H)", type: "home" }, { opponent: "CRY (H)?", type: "home" }], "BGW34": [{ opponent: "BUR (A)?", type: "away" }], "GW35": [{ opponent: "EVE (A)?", type: "away" }], "DGW36/7": [{ opponent: "BRE (H)", type: "home" }, { opponent: "BUR (A)?", type: "away" }] } },
  { team: "Man Utd", shortName: "MUN", fixtures: { "BGW31": [{ opponent: "BOU (A)", type: "away" }], "GW32": [{ opponent: "LEE (H)", type: "home" }], "DGW33": [{ opponent: "CHE (A)", type: "away" }], "BGW34": [{ opponent: "BRE (H)", type: "home" }], "GW35": [{ opponent: "LIV (H)", type: "home" }], "DGW36/7": [{ opponent: "SUN (H)", type: "home" }] } },
  { team: "Newcastle", shortName: "NEW", fixtures: { "BGW31": [{ opponent: "SUN (H)", type: "home" }], "GW32": [{ opponent: "CRY (A)", type: "away" }], "DGW33": [{ opponent: "BOU (H)", type: "home" }, { opponent: "ARS (A)?", type: "away" }], "BGW34": [{ opponent: "ARS (A)?", type: "away" }], "GW35": [{ opponent: "BHA (H)", type: "home" }], "DGW36/7": [{ opponent: "NFO (A)", type: "away" }] } },
  { team: "Nott'm Forest", shortName: "NFO", fixtures: { "BGW31": [{ opponent: "TOT (A)", type: "away" }], "GW32": [{ opponent: "AVL (H)", type: "home" }], "DGW33": [{ opponent: "BUR (H)", type: "home" }], "BGW34": [{ opponent: "SUN (A)", type: "away" }], "GW35": [{ opponent: "CHE (A)", type: "away" }], "DGW36/7": [{ opponent: "NEW (H)", type: "home" }] } },
  { team: "Southampton", shortName: "SUN", fixtures: { "BGW31": [{ opponent: "NEW (A)", type: "away" }], "GW32": [{ opponent: "TOT (H)", type: "home" }], "DGW33": [{ opponent: "AVL (A)", type: "away" }], "BGW34": [{ opponent: "NFO (H)", type: "home" }], "GW35": [{ opponent: "WOL (A)", type: "away" }], "DGW36/7": [{ opponent: "MUN (A)", type: "away" }] } },
  { team: "Tottenham", shortName: "TOT", fixtures: { "BGW31": [{ opponent: "NFO (H)", type: "home" }], "GW32": [{ opponent: "SUN (A)", type: "away" }], "DGW33": [{ opponent: "BHA (H)", type: "home" }], "BGW34": [{ opponent: "WOL (A)", type: "away" }], "GW35": [{ opponent: "AVL (A)", type: "away" }], "DGW36/7": [{ opponent: "LEE (H)?", type: "home" }] } },
  { team: "West Ham", shortName: "WHU", fixtures: { "BGW31": [{ opponent: "AVL (A)", type: "away" }], "GW32": [{ opponent: "WOL (H)", type: "home" }], "DGW33": [{ opponent: "CRY (A)", type: "away" }, { opponent: "EVE (H)?", type: "home" }], "BGW34": [{ opponent: "EVE (H)?", type: "home" }], "GW35": [{ opponent: "BRE (A)", type: "away" }], "DGW36/7": [{ opponent: "ARS (H)", type: "home" }] } },
  { team: "Wolves", shortName: "WOL", fixtures: { "BGW31": [{ opponent: "", type: "blank" }], "GW32": [{ opponent: "WHU (A)", type: "away" }], "DGW33": [{ opponent: "LEE (A)", type: "away" }], "BGW34": [{ opponent: "TOT (H)", type: "home" }], "GW35": [{ opponent: "SUN (H)", type: "home" }], "DGW36/7": [{ opponent: "BHA (A)", type: "away" }] } },
];

const gameweekColumns = ["BGW31", "GW32", "DGW33", "BGW34", "GW35", "DGW36/7"];

const CHIP_META: Record<string, { abbr: string; color: string; bg: string }> = {
  "Wildcard": { abbr: "WC", color: "#059669", bg: "bg-emerald-50" },
  "Free Hit": { abbr: "FH", color: "#0891B2", bg: "bg-cyan-50" },
  "Bench Boost": { abbr: "BB", color: "#2563EB", bg: "bg-blue-50" },
  "Triple Captain": { abbr: "TC", color: "#7C3AED", bg: "bg-purple-50" },
};

function ChipTimeline({ chips }: { chips: ChipSchedule[] }) {
  return (
    <div className="flex items-stretch justify-center gap-0 flex-wrap">
      {chips.map((chip, i) => {
        const meta = CHIP_META[chip.name] ?? { abbr: "?", color: "#6B7280", bg: "bg-gray-50" };
        return (
          <div key={chip.name} className="flex items-center">
            {/* Chip card — fixed height so all cards align */}
            <div className={`${meta.bg} rounded-xl px-4 py-3 flex flex-col items-center gap-1.5 min-w-[72px] h-[120px] justify-center`}>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ background: meta.color }}
              >
                {meta.abbr}
              </div>
              <span className="text-xs font-bold text-gray-900">{chip.gameweek}</span>
              <span className="text-[10px] font-medium text-gray-500">{chip.name}</span>
              {chip.optional ? (
                <span className="text-[9px] text-gray-400 italic">optional</span>
              ) : (
                <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wide">Required</span>
              )}
            </div>
            {/* Connector arrow */}
            {i < chips.length - 1 && (
              <div className="px-1 text-gray-300 text-lg hidden sm:block">&rarr;</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StrategyCard({ strategy, isExpanded, onToggle }: {
  strategy: Strategy;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = strategy.icon;

  return (
    <div className="kit-card overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 sm:p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: strategy.color }}
        >
          <Icon size={22} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="kit-headline text-lg sm:text-xl" style={{ color: strategy.color }}>
              Strategy {strategy.id}: {strategy.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{strategy.tagline}</p>
        </div>
        <div className="shrink-0 text-gray-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Chip schedule */}
          <div className="p-5 sm:p-6 bg-gray-50">
            <p className="kit-stat-label text-gray-500 mb-4">Chip Schedule</p>
            <ChipTimeline chips={strategy.chips} />
          </div>

          {/* How to play */}
          <div className="p-5 sm:p-6">
            <p className="kit-stat-label text-gray-500 mb-3">How to play</p>
            <ol className="space-y-2">
              {strategy.howToPlay.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white mt-0.5"
                    style={{ background: strategy.color }}
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Important players — side-by-side Target vs Avoid */}
          <div className="px-5 sm:px-6 pb-4 space-y-4">
            {strategy.importantSections.map((section) => (
              <div key={section.title}>
                <p className="kit-stat-label text-gray-500 mb-2">{section.title}</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Target column */}
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Target</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {section.include.map((team) => (
                        <span
                          key={team}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs font-bold"
                        >
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Avoid column */}
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <XIcon size={14} className="text-red-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Avoid</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {section.exclude.map((team) => (
                        <span
                          key={team}
                          className="px-2 py-0.5 rounded bg-red-500 text-white text-xs font-bold"
                        >
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Works if */}
          <div className="p-5 sm:p-6 bg-gray-50 border-t border-gray-100">
            <p className="kit-stat-label text-gray-500 mb-3">This strategy works for you if...</p>
            <ul className="space-y-1.5">
              {strategy.worksIf.map((condition, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1">
                    <Check size={14} className="text-green-500" />
                  </span>
                  {condition}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function getFixtureCellColor(fixture: Fixture, isDouble: boolean): string {
  if (fixture.type === "blank") return "bg-gray-200 text-gray-500";
  if (isDouble) return "bg-emerald-500 text-white";
  if (fixture.type === "home") return "bg-green-400 text-white";
  return "bg-amber-400 text-gray-900";
}

function FixtureGrid() {
  return (
    <div className="kit-card p-4 md:p-6 overflow-hidden">
      <h3 className="kit-headline text-xl md:text-2xl text-gray-900 mb-1">Fixture Grid</h3>
      <p className="text-sm text-gray-500 mb-4">BGW31 through DGW36/37 — plan your chip timing</p>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold bg-green-400 text-white">
          <span>Home</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold bg-amber-400 text-gray-900">
          <span>Away</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold bg-gray-200 text-gray-500">
          <span>Blank</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white">
          <span>DGW</span><span className="opacity-75">Double</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3 pr-3 sticky left-0 bg-white z-10 min-w-[80px]">
                Team
              </th>
              {gameweekColumns.map((gw) => (
                <th
                  key={gw}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3 px-1"
                >
                  {gw}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fixtureData.map((team, idx) => (
              <tr key={team.shortName} className="kit-table-row">
                <td className="py-1.5 pr-3 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-right font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                      {team.shortName}
                    </span>
                  </div>
                </td>
                {gameweekColumns.map((gw) => {
                  const fixtures = team.fixtures[gw] ?? [];
                  const isBlank = fixtures.length === 0 || (fixtures.length === 1 && fixtures[0].type === "blank");
                  const isDouble = fixtures.length >= 2;

                  return (
                    <td key={gw} className="p-0.5">
                      {isBlank ? (
                        <div className="rounded px-1.5 py-2 text-center text-xs font-bold whitespace-nowrap bg-gray-200 text-gray-500 italic opacity-60">
                          &mdash;
                        </div>
                      ) : isDouble ? (
                        <div className="flex flex-col gap-0.5">
                          {fixtures.map((f, i) => (
                            <div
                              key={i}
                              className={`rounded px-1.5 py-0.5 text-center text-[10px] font-bold leading-tight ${getFixtureCellColor(f, true)}`}
                            >
                              {f.opponent}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`rounded px-1.5 py-2 text-center text-xs font-bold whitespace-nowrap ${getFixtureCellColor(fixtures[0], false)}`}
                        >
                          {fixtures[0].opponent}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Strategy Corner | FPL League Tracker" },
    { name: "description", content: "End-of-season chip strategies for FPL blank and double gameweeks" },
  ];
}

export default function StrategyCornerPage() {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  return (
    <main>
      {/* Hero */}
      <section
        className="kit-hero kit-diagonal-cut relative"
        style={{ background: "#4338CA" }}
      >
        <div
          className="kit-stripe"
          style={{ background: "#6366F1" }}
        />
        <div className="kit-watermark">STRATEGY</div>
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-14 pb-20 sm:pt-16 sm:pb-24">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Lightbulb size={20} color="white" />
            </div>
            <h1 className="kit-headline text-white text-3xl sm:text-5xl">Strategy Corner</h1>
          </div>
          <p className="text-white/70 text-sm sm:text-base max-w-xl">
            End-of-season chip strategies for navigating blank and double gameweeks. Choose the plan that fits your remaining chips.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 sm:-mt-14 relative z-20 pb-16 space-y-4">
        {/* Strategy cards */}
        {strategies.map((strategy, i) => (
          <div
            key={strategy.id}
            className="kit-animate-slide-up"
            style={{ "--delay": `${i * 0.08}s` } as React.CSSProperties}
          >
            <StrategyCard
              strategy={strategy}
              isExpanded={expandedId === strategy.id}
              onToggle={() =>
                setExpandedId(expandedId === strategy.id ? null : strategy.id)
              }
            />
          </div>
        ))}

        {/* Fixture grid */}
        <div
          className="kit-animate-slide-up"
          style={{ "--delay": "0.4s" } as React.CSSProperties}
        >
          <FixtureGrid />
        </div>

        {/* Credit */}
        <p className="text-center text-xs text-gray-400 pt-4">
          Strategy data sourced from community analysis by Eric Yaajtsaavlauvy
        </p>
      </section>
    </main>
  );
}
