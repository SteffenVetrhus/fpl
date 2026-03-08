import {
  isRouteErrorResponse,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { Trophy, CalendarDays, BarChart3, ArrowLeftRight } from "lucide-react";
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

function FloatingNav() {
  const navItems = [
    { to: "/", label: "Table", icon: Trophy, end: true },
    { to: "/gameweeks", label: "Gameweeks", icon: CalendarDays, end: false },
    { to: "/standings", label: "Standings", icon: BarChart3, end: false },
    { to: "/transfers", label: "Transfers", icon: ArrowLeftRight, end: false },
  ];

  return (
    <nav className="kit-floating-nav">
      <div className="flex gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            viewTransition
            className={({ isActive }) =>
              `rounded-full px-3 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white"
              }`
            }
          >
            <item.icon size={18} />
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
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
        <FloatingNav />
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
