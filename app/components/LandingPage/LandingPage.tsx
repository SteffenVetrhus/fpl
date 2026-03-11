import { Link } from "react-router";
import {
  Trophy, CalendarDays, BarChart3, ArrowLeftRight,
  Target, Brain, Crosshair, Zap,
  Crown, Drama, Bot, Swords,
  BarChart2, Newspaper, Dice6,
  ChevronRight, LogIn, Sparkles, TrendingUp,
  Shield, Activity,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  description: string;
  color: string;
  delay: number;
}

function FeatureCard({ icon: Icon, title, description, color, delay }: FeatureCardProps) {
  return (
    <div
      className="kit-card p-6 kit-animate-slide-up group hover:scale-[1.02] transition-transform duration-200"
      style={{ "--delay": `${delay}ms` } as React.CSSProperties}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: color }}
      >
        <Icon size={24} className="text-white" />
      </div>
      <h3 className="font-display font-bold text-lg text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

interface ShowcaseItem {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  color: string;
}

function ShowcaseStrip({ items, direction = "left" }: { items: ShowcaseItem[]; direction?: "left" | "right" }) {
  const animClass = direction === "left" ? "kit-scroll-left" : "kit-scroll-right";
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden py-2" aria-hidden="true">
      <div className={`flex gap-3 ${animClass}`}>
        {doubled.map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 whitespace-nowrap shrink-0"
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: item.color }}
            >
              <item.icon size={12} className="text-white" />
            </div>
            <span className="text-white/80 text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const banterItems: ShowcaseItem[] = [
  { icon: Crown, label: "Captain Hindsight", color: "#7C3AED" },
  { icon: Drama, label: "Transfer Clowns", color: "#D97706" },
  { icon: Bot, label: "Banter Bot", color: "#0F766E" },
  { icon: Swords, label: "Head to Head", color: "#BE123C" },
  { icon: Activity, label: "Mood Swings", color: "#0891B2" },
  { icon: Sparkles, label: "Chip Roast", color: "#9333EA" },
];

const toolItems: ShowcaseItem[] = [
  { icon: Target, label: "Captain Picker", color: "#D97706" },
  { icon: Brain, label: "AI Advisor", color: "#4338CA" },
  { icon: Crosshair, label: "Rival Spy", color: "#DC2626" },
  { icon: Zap, label: "Chip Planner", color: "#D97706" },
  { icon: BarChart2, label: "Stat Corner", color: "#0D9488" },
  { icon: Newspaper, label: "FPL News", color: "#0891B2" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center px-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-gray-950 to-blue-950" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 kit-grid-bg opacity-20" />
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="kit-animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <Shield size={14} className="text-purple-400" />
              <span className="text-white/70 text-sm font-medium">Your league. Your way.</span>
            </div>
          </div>

          <h1
            className="kit-headline text-white text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 kit-animate-slide-up"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            FPL Tracker
          </h1>

          <p
            className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed kit-animate-slide-up"
            style={{ "--delay": "200ms" } as React.CSSProperties}
          >
            Track your league, roast your rivals, and make smarter FPL decisions
            — all in one place.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 kit-animate-slide-up"
            style={{ "--delay": "300ms" } as React.CSSProperties}
          >
            <Link
              to="/login"
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40"
            >
              <LogIn size={20} />
              Sign in to get started
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Quick stats */}
          <div
            className="flex items-center justify-center gap-8 sm:gap-12 mt-16 kit-animate-slide-up"
            style={{ "--delay": "400ms" } as React.CSSProperties}
          >
            <div className="text-center">
              <p className="kit-stat-number text-white text-3xl sm:text-4xl">30+</p>
              <p className="kit-stat-label text-white/40 mt-1">Features</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="kit-stat-number text-white text-3xl sm:text-4xl">12</p>
              <p className="kit-stat-label text-white/40 mt-1">Decision Tools</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="kit-stat-number text-white text-3xl sm:text-4xl">11</p>
              <p className="kit-stat-label text-white/40 mt-1">Banter Pages</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling showcase strips */}
      <section className="py-4 space-y-2">
        <ShowcaseStrip items={toolItems} direction="left" />
        <ShowcaseStrip items={banterItems} direction="right" />
      </section>

      {/* Core Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm uppercase tracking-[0.2em] font-medium mb-3 kit-animate-slide-up">
              The essentials
            </p>
            <h2 className="kit-headline text-white text-4xl sm:text-5xl md:text-6xl kit-animate-slide-up" style={{ "--delay": "100ms" } as React.CSSProperties}>
              Track everything
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Trophy}
              title="League Table"
              description="Live standings with manager highlights and your position tracked."
              color="#4A1D96"
              delay={0}
            />
            <FeatureCard
              icon={CalendarDays}
              title="Gameweek History"
              description="Every gameweek winner, scores, and player-by-player breakdowns."
              color="#1D4ED8"
              delay={100}
            />
            <FeatureCard
              icon={BarChart3}
              title="Historical Standings"
              description="Season-long rank progression showing who peaked and who bottomed out."
              color="#059669"
              delay={200}
            />
            <FeatureCard
              icon={ArrowLeftRight}
              title="Transfer Tracker"
              description="See every transfer your rivals made — the gems and the disasters."
              color="#EA580C"
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Decision Tools */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm uppercase tracking-[0.2em] font-medium mb-3">
              Decision tools
            </p>
            <h2 className="kit-headline text-white text-4xl sm:text-5xl md:text-6xl">
              Play smarter
            </h2>
            <p className="text-white/40 text-lg mt-4 max-w-xl mx-auto">
              AI-powered tools and deep stats to give you the edge over your mates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Target}
              title="Captain Picker"
              description="Data-driven captain suggestions based on form, fixtures, and expected points."
              color="#D97706"
              delay={0}
            />
            <FeatureCard
              icon={Brain}
              title="AI Advisor"
              description="Get personalized transfer and strategy advice powered by AI analysis."
              color="#4338CA"
              delay={100}
            />
            <FeatureCard
              icon={Crosshair}
              title="Rival Spy"
              description="Deep-dive into any rival's team, transfers, chips, and weak spots."
              color="#DC2626"
              delay={200}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Fixture Ticker"
              description="Upcoming fixture difficulty at a glance for smart planning ahead."
              color="#0D9488"
              delay={300}
            />
            <FeatureCard
              icon={BarChart2}
              title="Stat Corner"
              description="12 advanced leaderboards — xG, xA, clinical finishing, defensive heroes, and more."
              color="#0D9488"
              delay={400}
            />
            <FeatureCard
              icon={Dice6}
              title="Mini Games"
              description="Fun prediction games to play with your league mates between gameweeks."
              color="#EC4899"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* Banter Zone */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-400 text-sm uppercase tracking-[0.2em] font-medium mb-3">
              Banter Zone
            </p>
            <h2 className="kit-headline text-white text-4xl sm:text-5xl md:text-6xl">
              Roast your mates
            </h2>
            <p className="text-white/40 text-lg mt-4 max-w-xl mx-auto">
              The real reason you play FPL — rubbing it in when things go wrong for everyone else.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Crown}
              title="Captain Hindsight"
              description="Who picked the wrong captain? How many points did they leave on the bench?"
              color="#7C3AED"
              delay={0}
            />
            <FeatureCard
              icon={Drama}
              title="Transfer Clowns"
              description="The worst transfers of the season ranked — who sold a player right before a haul?"
              color="#D97706"
              delay={100}
            />
            <FeatureCard
              icon={Bot}
              title="Banter Bot"
              description="AI-generated roasts based on your league's actual results. No mercy."
              color="#0F766E"
              delay={200}
            />
          </div>

          <div className="text-center mt-10">
            <p className="text-white/30 text-sm">
              Plus Bench Warmers, Mood Swings, Chip Roast, Head to Head, and more...
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 to-transparent" />
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <h2 className="kit-headline text-white text-4xl sm:text-5xl md:text-6xl mb-6">
            Ready to dominate?
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
            Sign in with your league account and unlock every tool, stat, and roast.
          </p>
          <Link
            to="/login"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40"
          >
            <LogIn size={20} />
            Sign in now
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-8 text-center">
        <p className="text-white/20 text-xs">
          Built with React Router v7 · Data from FPL API
        </p>
      </footer>
    </div>
  );
}
