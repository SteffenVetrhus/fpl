import { useLoaderData } from "react-router";
import { fetchLeagueTransferSummaries } from "~/lib/fpl-api/league-data";
import { getEnvConfig } from "~/config/env";
import { getOptionalAuth } from "~/lib/pocketbase/auth";
import { TransferTracker } from "~/components/TransferTracker/TransferTracker";
import type { Route } from "./+types/transfers";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalAuth(request);
  const config = getEnvConfig();
  const transferSummary = await fetchLeagueTransferSummaries(config.fplLeagueId);

  return { transferSummary, currentPlayerName: user?.playerName };
}

export default function Transfers({ loaderData }: Route.ComponentProps) {
  const { transferSummary, currentPlayerName } = useLoaderData<typeof loader>();

  const totalTransfers = transferSummary.reduce((sum, t) => sum + t.transferCount, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-transfers)" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-transfers)" }}>
        <div className="kit-watermark">{totalTransfers}</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-transfers-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Who's been busy in the transfer market?
          </p>
          <h1 className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
            Transfer Market
          </h1>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16">
        <TransferTracker transfers={transferSummary} currentPlayerName={currentPlayerName} />
      </main>
    </div>
  );
}
