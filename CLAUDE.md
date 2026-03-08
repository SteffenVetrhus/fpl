# CLAUDE.md

## Project Overview

FPL League Tracker - a web application for tracking Fantasy Premier League league performance, gameweek winners, member transfers, and historical standings. Built with React Router v7, TypeScript, and Tailwind CSS v4.

## Tech Stack

- **Framework:** React Router v7.9.2 (SSR with type-safe loaders)
- **Language:** TypeScript 5.9.2 (strict mode)
- **UI:** React 19.1.1
- **Bundler:** Vite 7.1.7
- **Styling:** Tailwind CSS v4.1.13 (@theme syntax, not v3 config files)
- **Icons:** lucide-react
- **Testing:** Vitest 4.0.14 + @testing-library/react + Playwright
- **Runtime:** Node.js 20

## Commands

```bash
npm run dev          # Dev server with HMR (localhost:5173)
npm run build        # Production build (outputs to /build)
npm start            # Serve production build (port 3000)
npm run typecheck    # TypeScript checking + React Router codegen
npm test             # Run all unit tests (single run, 90 tests)
npm run test:watch   # Tests in watch mode
npm run test:ui      # Vitest UI dashboard
npm run test:e2e     # Playwright E2E tests
```

## Project Structure

```
app/
├── components/          # UI components (each with co-located .test.tsx)
│   ├── GameweekCard/
│   ├── GameweekHistory/
│   ├── GameweekNavigator/
│   ├── HistoricalLeagueTable/
│   ├── LeagueTable/
│   ├── PlayerSelector/
│   ├── TransferList/
│   └── TransferTracker/
├── config/
│   └── env.ts           # Type-safe environment config (getEnvConfig())
├── lib/fpl-api/
│   ├── client.ts        # FPL API fetch functions (5 endpoints)
│   └── types.ts         # 40+ TypeScript interfaces for FPL API
├── routes/
│   ├── _index.tsx       # Home: league dashboard
│   ├── gameweeks.tsx    # Gameweek history with player filtering
│   ├── standings.tsx    # Historical league standings
│   └── transfers.tsx    # Transfer activity overview
├── utils/
│   ├── gameweek-winner.ts    # Gameweek winner calculation
│   ├── historical-standings.ts
│   └── points.ts
├── app.css              # Tailwind + Kit Day design system
├── root.tsx             # Root layout + error boundary
└── routes.ts            # Route configuration
e2e/                     # Playwright E2E tests
docs/                    # Architecture & API documentation
```

## Architecture Patterns

### Route Loaders (Server-Side Data Fetching)
Routes use React Router v7 loaders for SSR. Data is fetched server-side, never in client components:
```typescript
export async function loader() {
  const config = getEnvConfig();
  const data = await fetchLeagueStandings(config.fplLeagueId, config.apiBaseUrl);
  return data;
}
export default function RoutePage({ loaderData }: Route.ComponentProps) { ... }
```

### Component Pattern
Components are functional with TypeScript interfaces. Each component has a co-located `.test.tsx` file:
```
ComponentName/
├── index.tsx       # or ComponentName.tsx
└── ComponentName.test.tsx
```

### Testing Pattern
Tests use Vitest with Testing Library. Mocking uses `vi.mock()` for API and config:
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
// Mock dependencies at module level
vi.mock("~/config/env", () => ({ getEnvConfig: vi.fn() }));
```

### Path Alias
`~/` maps to `./app/` (configured in tsconfig.json).

## Design System (Kit Day)

- **Headline font:** Anton (bold, uppercase, tight tracking)
- **Body font:** Poppins (weights 300-700)
- **Page colors:** Purple (league), Blue (gameweeks), Green (standings), Orange (transfers)
- **Layout:** Hero sections with diagonal clip-path, floating pill navigation, white island cards on colored backgrounds
- **CSS classes:** Custom `.kit-*` classes defined in `app.css`
- **Responsive:** Mobile-first with `max-sm:`, `sm:`, `md:`, `lg:` breakpoints

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
- `FPL_LEAGUE_ID` (required) - League ID from FPL URL
- `FPL_API_BASE_URL` (optional) - Defaults to `https://fantasy.premierleague.com/api`
- `ENABLE_API_CACHE` (optional) - Default: true
- `API_CACHE_DURATION` (optional) - Default: 300 seconds

## Coding Conventions

- **Naming:** PascalCase for components, camelCase for functions/variables
- **Methodology:** Atomic TDD (RED -> GREEN -> REFACTOR)
- **Tests:** Co-located with source, 100% coverage target
- **JSDoc:** Comments on all public API functions
- **Imports:** Use `~/` path alias for app-internal imports
- **Commit messages:** Imperative mood, lowercase start, 50-70 char titles
- **No unused code:** Delete rather than comment out

## FPL API

Public (unofficial) endpoints used - no auth required:
- `GET /bootstrap-static/` - Game data, teams, players
- `GET /leagues-classic/{leagueId}/standings/` - League standings
- `GET /entry/{managerId}/` - Manager profile
- `GET /entry/{managerId}/history/` - Gameweek history
- `GET /entry/{managerId}/transfers/` - Transfer history

See `docs/FPL_API.md` for full documentation.

## Docker

Multi-stage Dockerfile included. Final image uses `node:20-alpine`, serves on port 3000.
