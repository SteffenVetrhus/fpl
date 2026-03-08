import { useState, useCallback, useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import {
  Trophy,
  CalendarDays,
  BarChart3,
  ArrowLeftRight,
  Menu,
  X,
  Armchair,
  Crown,
  Drama,
  Activity,
  Wallet,
  Globe,
  Sparkles,
  Swords,
  Bot,
  BookOpen,
} from "lucide-react";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Anton&family=Poppins:wght@300;400;500;600;700&display=swap",
  },
];

const coreNavItems = [
  { to: "/", label: "League Table", icon: Trophy, end: true, color: "#4A1D96" },
  { to: "/gameweeks", label: "Gameweeks", icon: CalendarDays, end: false, color: "#1D4ED8" },
  { to: "/standings", label: "Standings", icon: BarChart3, end: false, color: "#059669" },
  { to: "/transfers", label: "Transfers", icon: ArrowLeftRight, end: false, color: "#EA580C" },
];

const banterNavItems = [
  { to: "/bench-shame", label: "Bench Warmers", icon: Armchair, end: false, color: "#B91C1C" },
  { to: "/captain-hindsight", label: "Captain Hindsight", icon: Crown, end: false, color: "#7C3AED" },
  { to: "/transfer-clowns", label: "Transfer Clowns", icon: Drama, end: false, color: "#D97706" },
  { to: "/mood-swings", label: "Mood Swings", icon: Activity, end: false, color: "#0891B2" },
  { to: "/rich-list", label: "Rich List", icon: Wallet, end: false, color: "#15803D" },
  { to: "/league-vs-world", label: "League vs World", icon: Globe, end: false, color: "#1E40AF" },
  { to: "/chip-roast", label: "Chip Roast", icon: Sparkles, end: false, color: "#9333EA" },
  { to: "/head-to-head", label: "Head to Head", icon: Swords, end: false, color: "#BE123C" },
  { to: "/banter-bot", label: "Banter Bot", icon: Bot, end: false, color: "#0F766E" },
  { to: "/records", label: "History Books", icon: BookOpen, end: false, color: "#C2410C" },
];

function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
    setIsClosing(false);
  }, [location.pathname]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  }, []);

  return (
    <>
      <button
        className="kit-hamburger-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} color="white" />
      </button>

      {isOpen && (
        <>
          <div className="kit-menu-overlay" onClick={handleClose} />
          <div className={`kit-menu-panel ${isClosing ? "closing" : ""}`}>
            <div className="min-h-full bg-gray-950 text-white">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="kit-headline text-xl tracking-wide">FPL Tracker</h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Core navigation */}
              <div className="p-4">
                <p className="kit-stat-label text-white/40 mb-2 px-3">Core</p>
                {coreNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    viewTransition
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: item.color }}
                    >
                      <item.icon size={16} color="white" />
                    </div>
                    {item.label}
                  </NavLink>
                ))}
              </div>

              {/* Banter zone */}
              <div className="p-4 border-t border-white/10">
                <p className="kit-stat-label text-white/40 mb-2 px-3">Banter Zone</p>
                {banterNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    viewTransition
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ background: item.color }}
                    >
                      <item.icon size={14} color="white" />
                    </div>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <HamburgerMenu />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#4A1D96' }}>
      <div className="text-center">
        <h1 className="kit-headline text-white text-8xl mb-4">{message}</h1>
        <p className="text-white/70 text-lg max-w-md">{details}</p>
        {stack && (
          <pre className="mt-8 p-4 bg-black/30 rounded-lg text-white/60 text-xs text-left overflow-x-auto max-w-2xl">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
