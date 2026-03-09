import { fetchLeagueStandings, fetchManagerHistory } from "~/lib/fpl-api/client";
import { getEnvConfig } from "~/config/env";
import type { Route } from "./+types/roast-news";
import { requireAuth } from "~/lib/pocketbase/auth";

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
  bank: number;
  value: number;
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
      bank: number;
      value: number;
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
        bank: gwData.bank,
        value: gwData.value,
      };
    })
    .filter((m): m is ManagerGWData => m !== null);
}

function generateGWRoasts(
  players: ManagerGWData[],
  gw: number,
  allManagerData?: Array<{
    managerId: number;
    history: Array<{ event: number; overall_rank: number }>;
  }>
): GWRoast[] {
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

  // GW3: Rank Freefall — biggest overall rank drop compared to previous GW
  if (gw > 1) {
    const withPrevRank = players
      .map((p) => {
        const allData = allManagerData;
        const prev = allData?.find(
          (m) =>
            m.managerId === p.managerId &&
            m.history.find((h: { event: number }) => h.event === gw - 1)
        );
        const prevGW = prev?.history.find(
          (h: { event: number }) => h.event === gw - 1
        );
        if (!prevGW) return null;
        return {
          ...p,
          prevRank: prevGW.overall_rank,
          rankDrop: p.overallRank - prevGW.overall_rank,
        };
      })
      .filter(
        (p): p is ManagerGWData & { prevRank: number; rankDrop: number } =>
          p !== null
      )
      .sort((a, b) => b.rankDrop - a.rankDrop);

    const faller = withPrevRank[0];
    if (faller && faller.rankDrop > 0) {
      const dropFormatted = faller.rankDrop.toLocaleString();
      roasts.push({
        target: faller.name,
        category: "Rank Freefall",
        headline: `${faller.name} plummets ${dropFormatted} places in the world`,
        body: `${faller.name} dropped from ${faller.prevRank.toLocaleString()} to ${faller.overallRank.toLocaleString()} in the global rankings after GW${gw}. That's not a rank change, that's a controlled demolition of your season. Gravity is undefeated.`,
      });
    }
  }

  // GW4: Mid-Table Mediocrity — the most painfully average scorer
  if (players.length >= 3) {
    const avg =
      players.reduce((sum, p) => sum + p.points, 0) / players.length;
    const mostAverage = [...players].sort(
      (a, b) => Math.abs(a.points - avg) - Math.abs(b.points - avg)
    )[0];
    if (
      mostAverage &&
      mostAverage.name !== winner?.name &&
      mostAverage.name !== loser?.name
    ) {
      roasts.push({
        target: mostAverage.name,
        category: "Mid-Table Mediocrity",
        headline: `${mostAverage.name} scores ${mostAverage.points} pts — the definition of meh`,
        body: `With a league average of ${Math.round(avg)} points, ${mostAverage.name} scored exactly ${mostAverage.points}. Not good enough to celebrate, not bad enough to be interesting. You are the lukewarm tea of FPL. Aggressively forgettable.`,
      });
    }
  }

  // GW5: Tightwad Trophy — hoarding money in the bank
  const richest = [...players].sort((a, b) => b.bank - a.bank)[0];
  if (richest && richest.bank >= 5) {
    const bankMil = (richest.bank / 10).toFixed(1);
    roasts.push({
      target: richest.name,
      category: "Tightwad Trophy",
      headline: `${richest.name} hoards £${bankMil}m in the bank like a dragon`,
      body:
        richest.points < (sorted[Math.floor(sorted.length / 2)]?.points ?? 0)
          ? `${richest.name} is sitting on £${bankMil}m in the bank while scoring below average. You're not saving for a rainy day, it's already pouring. Spend the money — it doesn't earn interest.`
          : `${richest.name} has £${bankMil}m gathering dust in the FPL bank in GW${gw}. That's not financial discipline, that's fear of commitment. The money is there to be spent, not admired.`,
    });
  }

  // GW2: Transfer Addict — managers who took hits
  const hitTakers = [...players]
    .filter((p) => p.transfersCost > 0)
    .sort((a, b) => b.transfersCost - a.transfersCost);
  if (hitTakers.length > 0) {
    const worst = hitTakers[0];
    const netPoints = worst.points - worst.transfersCost;
    roasts.push({
      target: worst.name,
      category: "Transfer Addict",
      headline: `${worst.name} burns ${worst.transfersCost} pts on transfer hits`,
      body:
        netPoints < (loser?.points ?? 0)
          ? `${worst.name} took a -${worst.transfersCost} hit and scored ${worst.points} points, netting just ${netPoints}. After hits, they're actually the worst scorer this week. The transfers made things worse. Therapy might be cheaper.`
          : `${worst.name} couldn't resist tinkering and took a -${worst.transfersCost} hit in GW${gw}. Scored ${worst.points} but only netted ${netPoints} after the damage. That's not a transfer strategy, that's a cry for help.`,
    });
  }

  return roasts;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
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
    const roasts = generateGWRoasts(players, gw, managers);
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
  "Transfer Addict": "#7C3AED",
  "Rank Freefall": "#0891B2",
  "Mid-Table Mediocrity": "#6B7280",
  "Tightwad Trophy": "#15803D",
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
