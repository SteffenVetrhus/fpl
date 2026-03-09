import { useLoaderData } from "react-router";
import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/records";
import { requireAuth } from "~/lib/pocketbase/auth";

interface Record {
  title: string;
  value: string;
  holder: string;
  detail: string;
  emoji: string;
  type: "achievement" | "shame";
}

interface PastSeasonEntry {
  managerName: string;
  seasonName: string;
  totalPoints: number;
  rank: number;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  const allManagers = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        gameweeks: history.current,
        past: history.past,
        chips: history.chips,
      };
    })
  );

  const records: Record[] = [];

  // Highest single gameweek score
  let highestGW = { manager: "", points: 0, gw: 0 };
  let lowestGW = { manager: "", points: Infinity, gw: 0 };
  let mostBenchSingleGW = { manager: "", points: 0, gw: 0 };
  let biggestHitSingle = { manager: "", cost: 0, gw: 0 };
  let longestWinStreak = { manager: "", streak: 0 };
  let longestDrought = { manager: "", streak: 0 };

  allManagers.forEach((m) => {
    // Track GW wins
    let currentWin = 0;
    let maxWin = 0;

    m.gameweeks.forEach((gw) => {
      // Highest GW score
      if (gw.points > highestGW.points) {
        highestGW = { manager: m.name, points: gw.points, gw: gw.event };
      }
      // Lowest GW score
      if (gw.points < lowestGW.points) {
        lowestGW = { manager: m.name, points: gw.points, gw: gw.event };
      }
      // Most bench points in single GW
      if (gw.points_on_bench > mostBenchSingleGW.points) {
        mostBenchSingleGW = { manager: m.name, points: gw.points_on_bench, gw: gw.event };
      }
      // Biggest single hit
      if (gw.event_transfers_cost > biggestHitSingle.cost) {
        biggestHitSingle = { manager: m.name, cost: gw.event_transfers_cost, gw: gw.event };
      }

      // Win streak (GW winner)
      const isWinner = allManagers.every((other) => {
        if (other.name === m.name) return true;
        const otherGW = other.gameweeks.find((g) => g.event === gw.event);
        return !otherGW || gw.points >= otherGW.points;
      });
      if (isWinner) {
        currentWin++;
        maxWin = Math.max(maxWin, currentWin);
      } else {
        currentWin = 0;
      }
    });

    if (maxWin > longestWinStreak.streak) {
      longestWinStreak = { manager: m.name, streak: maxWin };
    }

    // Longest without winning a GW
    let currentDrought = 0;
    let maxDrought = 0;
    m.gameweeks.forEach((gw) => {
      const isWinner = allManagers.every((other) => {
        if (other.name === m.name) return true;
        const otherGW = other.gameweeks.find((g) => g.event === gw.event);
        return !otherGW || gw.points >= otherGW.points;
      });
      if (!isWinner) {
        currentDrought++;
        maxDrought = Math.max(maxDrought, currentDrought);
      } else {
        currentDrought = 0;
      }
    });

    if (maxDrought > longestDrought.streak) {
      longestDrought = { manager: m.name, streak: maxDrought };
    }
  });

  // Build records
  records.push({
    title: "Highest Gameweek Score",
    value: `${highestGW.points} pts`,
    holder: highestGW.manager,
    detail: `GW${highestGW.gw}`,
    emoji: "🏆",
    type: "achievement",
  });

  records.push({
    title: "Lowest Gameweek Score",
    value: `${lowestGW.points} pts`,
    holder: lowestGW.manager,
    detail: `GW${lowestGW.gw}`,
    emoji: "💀",
    type: "shame",
  });

  records.push({
    title: "Most Points on Bench (Single GW)",
    value: `${mostBenchSingleGW.points} pts`,
    holder: mostBenchSingleGW.manager,
    detail: `GW${mostBenchSingleGW.gw}`,
    emoji: "🪑",
    type: "shame",
  });

  if (biggestHitSingle.cost > 0) {
    records.push({
      title: "Biggest Single Gameweek Hit",
      value: `-${biggestHitSingle.cost} pts`,
      holder: biggestHitSingle.manager,
      detail: `GW${biggestHitSingle.gw}`,
      emoji: "🤕",
      type: "shame",
    });
  }

  records.push({
    title: "Longest GW Winning Streak",
    value: `${longestWinStreak.streak} GWs`,
    holder: longestWinStreak.manager,
    detail: "Consecutive gameweek wins",
    emoji: "🔥",
    type: "achievement",
  });

  records.push({
    title: "Longest GW Win Drought",
    value: `${longestDrought.streak} GWs`,
    holder: longestDrought.manager,
    detail: "GWs without a single win",
    emoji: "🏜️",
    type: "shame",
  });

  // Total bench points (all-time this season)
  const totalBenchByManager = allManagers.map((m) => ({
    name: m.name,
    total: m.gameweeks.reduce((s, g) => s + g.points_on_bench, 0),
  }));
  const worstBenchTotal = totalBenchByManager.sort((a, b) => b.total - a.total)[0];
  if (worstBenchTotal) {
    records.push({
      title: "Most Total Bench Points Wasted",
      value: `${worstBenchTotal.total} pts`,
      holder: worstBenchTotal.name,
      detail: "Across the entire season",
      emoji: "🗑️",
      type: "shame",
    });
  }

  // Most total transfers
  const totalTransfersByManager = allManagers.map((m) => ({
    name: m.name,
    total: m.gameweeks.reduce((s, g) => s + g.event_transfers, 0),
  }));
  const mostTransfers = totalTransfersByManager.sort((a, b) => b.total - a.total)[0];
  if (mostTransfers) {
    records.push({
      title: "Most Transfers Made",
      value: `${mostTransfers.total}`,
      holder: mostTransfers.name,
      detail: "Includes free and paid transfers",
      emoji: "🔄",
      type: "shame",
    });
  }

  // Highest squad value achieved
  const peakValues = allManagers.map((m) => {
    const peak = m.gameweeks.reduce(
      (best, gw) => {
        const val = (gw.value + gw.bank) / 10;
        return val > best.value ? { value: val, gw: gw.event } : best;
      },
      { value: 0, gw: 0 }
    );
    return { name: m.name, ...peak };
  });
  const richest = peakValues.sort((a, b) => b.value - a.value)[0];
  if (richest) {
    records.push({
      title: "Highest Squad Value Achieved",
      value: `£${richest.value.toFixed(1)}m`,
      holder: richest.name,
      detail: `GW${richest.gw}`,
      emoji: "💰",
      type: "achievement",
    });
  }

  // Past seasons data
  const pastSeasons: PastSeasonEntry[] = [];
  allManagers.forEach((m) => {
    m.past.forEach((season) => {
      pastSeasons.push({
        managerName: m.name,
        seasonName: season.season_name,
        totalPoints: season.total_points,
        rank: season.rank,
      });
    });
  });

  // Best past season finish
  const bestPastFinish = pastSeasons.sort((a, b) => a.rank - b.rank)[0];
  if (bestPastFinish) {
    records.push({
      title: "Best Overall Finish (Past Seasons)",
      value: `#${bestPastFinish.rank.toLocaleString()}`,
      holder: bestPastFinish.managerName,
      detail: bestPastFinish.seasonName,
      emoji: "🌟",
      type: "achievement",
    });
  }

  return { records, pastSeasons };
}

export default function Records({ loaderData }: Route.ComponentProps) {
  const { records, pastSeasons } = useLoaderData<typeof loader>();

  const achievements = records.filter((r) => r.type === "achievement");
  const shameRecords = records.filter((r) => r.type === "shame");

  // Group past seasons by season
  const seasonGroups = new Map<string, PastSeasonEntry[]>();
  pastSeasons.forEach((s) => {
    const group = seasonGroups.get(s.seasonName) ?? [];
    group.push(s);
    seasonGroups.set(s.seasonName, group);
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-records)" }}>
      {/* Hero */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-records)" }}>
        <div className="kit-watermark">ALL</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-records-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Every record stands forever. You can never escape.
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            The History<br />Books
          </h1>
        </div>
      </section>

      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Hall of Fame */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-amber-600 to-amber-500">
            <h2 className="kit-headline text-xl text-white">Hall of Fame</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {achievements.map((record, index) => (
              <div key={record.title} className="p-5 kit-table-row">
                <div className="flex items-center gap-4">
                  <div className="text-3xl shrink-0">{record.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{record.title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="kit-badge bg-amber-100 text-amber-700">{record.holder}</span>
                      <span className="text-xs text-gray-400">{record.detail}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="text-amber-600" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", lineHeight: 1 }}>
                      {record.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wall of Shame */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-records-dark)" }}>
            <h2 className="kit-headline text-xl text-white">Wall of Shame</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {shameRecords.map((record, index) => (
              <div key={record.title} className="p-5 kit-table-row">
                <div className="flex items-center gap-4">
                  <div className="text-3xl shrink-0">{record.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{record.title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="kit-badge bg-red-100 text-red-700">{record.holder}</span>
                      <span className="text-xs text-gray-400">{record.detail}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="text-red-600" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", lineHeight: 1 }}>
                      {record.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past seasons */}
        {seasonGroups.size > 0 && (
          <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "400ms" } as React.CSSProperties}>
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-700 to-gray-600">
              <h2 className="kit-headline text-xl text-white">Past Seasons</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {Array.from(seasonGroups.entries())
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([season, entries]) => (
                  <div key={season} className="p-5">
                    <h3 className="kit-headline text-lg text-gray-900 mb-3">{season}</h3>
                    <div className="space-y-2">
                      {entries
                        .sort((a, b) => a.rank - b.rank)
                        .map((entry) => (
                          <div key={entry.managerName} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{entry.managerName}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-500">{entry.totalPoints.toLocaleString()} pts</span>
                              <span className="font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                                #{entry.rank.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="text-center text-white/30 text-xs pb-8">
          <p>Records are permanent. Your worst moment lives here forever.</p>
        </div>
      </main>
    </div>
  );
}
