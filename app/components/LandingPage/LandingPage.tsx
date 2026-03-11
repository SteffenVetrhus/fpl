import { Link } from "react-router";
import {
  Trophy, CalendarDays, BarChart3, ArrowLeftRight,
  Target, Brain, Crosshair, Zap,
  Crown, Drama, Bot, Swords,
  BarChart2, Dice6, LogIn,
  Activity, Sparkles, TrendingUp,
} from "lucide-react";

interface FeatureItem {
  icon: React.ComponentType<{ size: number; color?: string }>;
  title: string;
  description: string;
  color: string;
}

function FeatureRow({ item, index }: { item: FeatureItem; index: number }) {
  return (
    <div
      className="flex items-start gap-4 p-5 kit-table-row kit-animate-slide-up"
      style={{ "--delay": `${300 + index * 80}ms` } as React.CSSProperties}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: item.color }}
      >
        <item.icon size={18} color="white" />
      </div>
      <div>
        <h3 className="kit-headline text-lg text-gray-900">{item.title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
      </div>
    </div>
  );
}

const coreFeatures: FeatureItem[] = [
  { icon: Trophy, title: "League Table", description: "Live standings with manager highlights and your position tracked.", color: "#4A1D96" },
  { icon: CalendarDays, title: "Gameweek History", description: "Every gameweek winner, scores, and player-by-player breakdowns.", color: "#1D4ED8" },
  { icon: BarChart3, title: "Historical Standings", description: "Season-long rank progression — who peaked and who bottomed out.", color: "#059669" },
  { icon: ArrowLeftRight, title: "Transfer Tracker", description: "See every transfer your rivals made — the gems and the disasters.", color: "#EA580C" },
];

const decisionTools: FeatureItem[] = [
  { icon: Target, title: "Captain Picker", description: "Data-driven captain suggestions based on form, fixtures, and expected points.", color: "#D97706" },
  { icon: Brain, title: "AI Advisor", description: "Personalized transfer and strategy advice powered by AI analysis.", color: "#4338CA" },
  { icon: Crosshair, title: "Rival Spy", description: "Deep-dive into any rival's team, transfers, chips, and weak spots.", color: "#DC2626" },
  { icon: TrendingUp, title: "Fixture Ticker", description: "Upcoming fixture difficulty at a glance for smart planning ahead.", color: "#0D9488" },
  { icon: BarChart2, title: "Stat Corner", description: "12 advanced leaderboards — xG, xA, clinical finishing, and more.", color: "#0D9488" },
  { icon: Dice6, title: "Mini Games", description: "Fun prediction games to play with your league mates between gameweeks.", color: "#EC4899" },
];

const banterFeatures: FeatureItem[] = [
  { icon: Crown, title: "Captain Hindsight", description: "Who picked the wrong captain? How many points did they leave on the bench?", color: "#7C3AED" },
  { icon: Drama, title: "Transfer Clowns", description: "The worst transfers of the season — who sold a player right before a haul?", color: "#D97706" },
  { icon: Bot, title: "Banter Bot", description: "AI-generated roasts based on your league's actual results. No mercy.", color: "#0F766E" },
  { icon: Swords, title: "Head to Head", description: "See how you stack up against every rival in direct matchups.", color: "#BE123C" },
  { icon: Activity, title: "Mood Swings", description: "Track the emotional rollercoaster of your league's season.", color: "#0891B2" },
  { icon: Sparkles, title: "Chip Roast", description: "Who wasted their chips? Who played them at the perfect time?", color: "#9333EA" },
  { icon: Zap, title: "Chip Planner", description: "Plan your remaining chips with fixture analysis and strategy tips.", color: "#D97706" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-page-league)" }}>
      {/* Hero Section */}
      <section className="kit-hero kit-diagonal-cut" style={{ background: "var(--color-page-league)" }}>
        <div className="kit-watermark">FPL</div>
        <div className="kit-stripe" style={{ background: "var(--color-page-league-light)" }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
            Your league. Your way.
          </p>
          <h1
            className="kit-headline text-white text-5xl md:text-7xl lg:text-8xl kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            FPL Tracker
          </h1>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 pb-24 sm:pb-16 space-y-6">
        {/* Stats + Sign In Card */}
        <div
          className="kit-card p-8 md:p-12 text-center kit-animate-slide-up"
          style={{ "--delay": "200ms" } as React.CSSProperties}
        >
          <p className="text-gray-500 text-lg mb-6">
            Track your league, roast your rivals, and make smarter FPL decisions — all in one place.
          </p>

          <div className="flex items-center justify-center gap-8 sm:gap-12 mb-8">
            <div className="text-center">
              <div className="kit-stat-number" style={{ color: "var(--color-page-league)" }}>30+</div>
              <div className="kit-stat-label">Features</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="kit-stat-number" style={{ color: "var(--color-page-gameweeks)" }}>12</div>
              <div className="kit-stat-label">Decision Tools</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="kit-stat-number" style={{ color: "var(--color-page-transfers)" }}>11</div>
              <div className="kit-stat-label">Banter Pages</div>
            </div>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-base transition-colors"
            style={{ background: "var(--color-page-league)" }}
          >
            <LogIn size={18} />
            Sign in to get started
          </Link>
        </div>

        {/* Core Features Card */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "300ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-league-dark)" }}>
            <p className="kit-stat-label text-white/60 mb-1">The essentials</p>
            <h2 className="kit-headline text-xl text-white">Track everything</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {coreFeatures.map((item, i) => (
              <FeatureRow key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* Decision Tools Card */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "400ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-gameweeks-dark)" }}>
            <p className="kit-stat-label text-white/60 mb-1">Decision tools</p>
            <h2 className="kit-headline text-xl text-white">Play smarter</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {decisionTools.map((item, i) => (
              <FeatureRow key={item.title} item={item} index={i} />
            ))}
          </div>
          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            Plus Transfer Planner, Transfer Hub, Differentials, Price Tracker, Strategy Corner, and FPL News
          </div>
        </div>

        {/* Banter Zone Card */}
        <div className="kit-card overflow-hidden kit-animate-slide-up" style={{ "--delay": "500ms" } as React.CSSProperties}>
          <div className="p-5 border-b border-gray-100" style={{ background: "var(--color-page-bench-dark)" }}>
            <p className="kit-stat-label text-white/60 mb-1">Banter Zone</p>
            <h2 className="kit-headline text-xl text-white">Roast your mates</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {banterFeatures.map((item, i) => (
              <FeatureRow key={item.title} item={item} index={i} />
            ))}
          </div>
          <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
            Plus Bench Warmers, Rich List, League vs World, History Books, and Roast News
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="kit-card p-8 text-center kit-animate-slide-up" style={{ "--delay": "600ms" } as React.CSSProperties}>
          <h2 className="kit-headline text-2xl text-gray-900 mb-2">Ready to dominate?</h2>
          <p className="text-gray-500 text-sm mb-6">
            Sign in with your league account and unlock every tool, stat, and roast.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-base transition-colors"
            style={{ background: "var(--color-page-league)" }}
          >
            <LogIn size={18} />
            Sign in now
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-24 sm:pb-8 text-center">
        <p className="text-white/30 text-xs">
          Built with React Router v7 · Data from FPL API
        </p>
      </footer>
    </div>
  );
}
