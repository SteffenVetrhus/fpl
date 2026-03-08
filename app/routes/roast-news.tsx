import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/roast-news";

interface ManagerGWData {
  name: string;
  teamName: string;
  managerId: number;
  points: number;
  totalPoints: number;
  overallRank: number;
  benchPoints: number;
  transfersCost: number;
  transfers: number;
}

interface GWRoast {
  headline: string;
  body: string;
  target: string;
  category: string;
}

interface GameweekEdition {
  gameweek: number;
  roasts: GWRoast[];
}

function buildManagerGWData(
  managers: Array<{
    name: string;
    teamName: string;
    managerId: number;
    history: Array<{
      event: number;
      points: number;
      total_points: number;
      overall_rank: number;
      points_on_bench: number;
      event_transfers_cost: number;
      event_transfers: number;
    }>;
  }>,
  gw: number
): ManagerGWData[] {
  return managers
    .map((m) => {
      const gwData = m.history.find((h) => h.event === gw);
      if (!gwData) return null;
      return {
        name: m.name,
        teamName: m.teamName,
        managerId: m.managerId,
        points: gwData.points,
        totalPoints: gwData.total_points,
        overallRank: gwData.overall_rank,
        benchPoints: gwData.points_on_bench,
        transfersCost: gwData.event_transfers_cost,
        transfers: gwData.event_transfers,
      };
    })
    .filter((m): m is ManagerGWData => m !== null);
}

function generateGWRoasts(players: ManagerGWData[], gw: number): GWRoast[] {
  if (players.length === 0) return [];
  const roasts: GWRoast[] = [];

  const sorted = [...players].sort((a, b) => b.points - a.points);
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];

  if (winner) {
    roasts.push({
      target: winner.name,
      category: "GW Winner",
      headline: `${winner.name} tops GW${gw} with ${winner.points} pts`,
      body: `Congratulations to ${winner.name} (${winner.teamName}) on topping the gameweek with ${winner.points} points. Don't let it go to your head — even a broken clock is right twice a day.`,
    });
  }

  if (loser && loser.name !== winner.name) {
    roasts.push({
      target: loser.name,
      category: "GW Flop",
      headline: `${loser.name} hits rock bottom with ${loser.points} pts`,
      body: `${loser.name} managed just ${loser.points} points in GW${gw}. At this point, a team of random free agents would have outscored you. Maybe try closing your eyes and picking next time — it can't get worse.`,
    });
  }

  // GW1: Bench Burner — most points wasted on the bench
  const benchSorted = [...players].sort((a, b) => b.benchPoints - a.benchPoints);
  const benchKing = benchSorted[0];
  if (benchKing && benchKing.benchPoints > 0) {
    const couldHaveWon =
      benchKing.points + benchKing.benchPoints > (winner?.points ?? 0) &&
      benchKing.name !== winner?.name;
    roasts.push({
      target: benchKing.name,
      category: "Bench Burner",
      headline: `${benchKing.name} leaves ${benchKing.benchPoints} pts rotting on the bench`,
      body: couldHaveWon
        ? `${benchKing.name} had ${benchKing.benchPoints} points just sitting there on the bench. With those points, they would have won the gameweek. Imagine being your own worst enemy — oh wait, you don't have to imagine.`
        : `${benchKing.name} left ${benchKing.benchPoints} points gathering dust on the bench in GW${gw}. Your bench is putting in more work than your starting XI. Maybe let them have a go?`,
    });
  }

  return roasts;
}

export async function loader() {
  const config = getEnvConfig();
  const standings = await fetchLeagueStandings(config.fplLeagueId);
  const results = standings.standings.results;

  const managers = await Promise.all(
    results.map(async (r) => {
      const history = await fetchManagerHistory(String(r.entry));
      return {
        name: r.player_name,
        teamName: r.entry_name,
        managerId: r.entry,
        history: history.current,
      };
    })
  );

  const maxGW = Math.max(
    ...managers.flatMap((m) => m.history.map((h) => h.event))
  );

  const editions: GameweekEdition[] = [];
  for (let gw = maxGW; gw >= 1; gw--) {
    const players = buildManagerGWData(managers, gw);
    const roasts = generateGWRoasts(players, gw);
    if (roasts.length > 0) {
      editions.push({ gameweek: gw, roasts });
    }
  }

  return {
    leagueName: standings.league.name,
    editions,
  };
}

const categoryColors: Record<string, string> = {
  "GW Winner": "#15803D",
  "GW Flop": "#B91C1C",
  "Bench Burner": "#D97706",
};

export default function RoastNews({ loaderData }: Route.ComponentProps) {
  const { leagueName, editions } = loaderData;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-page-roast)" }}
    >
      <section className="kit-hero kit-diagonal-cut">
        <div className="kit-watermark">ROAST</div>
        <div
          className="kit-stripe"
          style={{ background: "var(--color-page-roast-light)" }}
        />
        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <p className="text-white/70 text-sm font-semibold tracking-widest uppercase mb-2">
            {leagueName}
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl">
            Roast News
          </h1>
          <p className="text-white/60 mt-3 text-sm md:text-base max-w-lg">
            Every gameweek, somebody gets burned. Here's the match report nobody
            asked for.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 -mt-8 pb-24">
        {editions.map((edition, edIdx) => (
          <div
            key={edition.gameweek}
            className="kit-card p-6 md:p-8 mb-6 kit-animate-slide-up"
            style={{ "--delay": `${edIdx * 100}ms` } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
              <span
                className="kit-stat-number text-4xl"
                style={{ color: "var(--color-page-roast)" }}
              >
                GW{edition.gameweek}
              </span>
              <span className="kit-stat-label text-gray-400">
                Match Report
              </span>
            </div>

            <div className="space-y-5">
              {edition.roasts.map((roast, rIdx) => (
                <article
                  key={rIdx}
                  className="border-l-4 pl-4"
                  style={{
                    borderColor:
                      categoryColors[roast.category] || "#6B7280",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="kit-badge text-white"
                      style={{
                        background:
                          categoryColors[roast.category] || "#6B7280",
                      }}
                    >
                      {roast.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {roast.headline}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                    {roast.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
