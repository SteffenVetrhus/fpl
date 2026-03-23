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
│   ├── StatCorner/          # Stat Corner components
│   │   ├── MetricLeaderboard.tsx  # Reusable bar-chart leaderboard
│   │   ├── PlayerStatCard.tsx     # Individual player stat card
│   │   ├── PlayerCompare.tsx      # Head-to-head comparison
│   │   └── PriceChart.tsx         # Price history sparkline
│   ├── TransferList/
│   └── TransferTracker/
├── config/
│   └── env.ts           # Type-safe environment config (getEnvConfig())
├── lib/fpl-api/
│   ├── client.ts        # FPL API fetch functions (5 endpoints)
│   └── types.ts         # 40+ TypeScript interfaces for FPL API
├── lib/stat-corner/
│   ├── client.ts        # PocketBase client for stat data (server-only)
│   └── types.ts         # Stat Corner TypeScript interfaces
├── routes/
│   ├── _index.tsx       # Home: league dashboard
│   ├── gameweeks.tsx    # Gameweek history with player filtering
│   ├── standings.tsx    # Historical league standings
│   ├── stat-corner.tsx  # Stat Corner: 12 advanced metric leaderboards
│   └── transfers.tsx    # Transfer activity overview
├── utils/
│   ├── gameweek-winner.ts    # Gameweek winner calculation
│   ├── historical-standings.ts
│   ├── points.ts
│   └── stat-corner.ts       # Derived metric calculations
├── app.css              # Tailwind + Kit Day design system
├── root.tsx             # Root layout + error boundary
└── routes.ts            # Route configuration
scraper-fplcore/         # FPL-Core-Insights CSV fetcher (Python, primary)
scraper-understat/       # Understat xG/xA scraper (Python)
scraper-fpl/             # FPL API sync scraper (Python)
scraper-fbref/           # FBRef scraper (DEPRECATED — replaced by fplcore)
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

## Stat Corner (Advanced Metrics)

The `/stat-corner` route displays 12 leaderboard sections powered by data from multiple scrapers stored in PocketBase. Auth-protected.

### Current Leaderboards
1. **Clinical XI** — Goals above Expected (G - xG)
2. **Top xG** — Expected Goals leaders
3. **Top xA** — Expected Assists leaders
4. **Creative Engines** — Chances Created (key passes leading to shots)
5. **Box Threat** — Touches in Opposition Box
6. **Defensive Heroes** — CBIT (Clearances + Blocks + Interceptions + Tackles)
7. **Ball Winners** — Recoveries
8. **Duel Masters** — Duels Won (ground + aerial)
9. **Dribble Kings** — Successful Dribbles
10. **Aerial Dominance** — Aerial Duels Won
11. **GK Wall** — Goals Prevented (xGOT faced - goals conceded)
12. **Big Chance Wasters** — Big Chances Missed

### Data Pipeline
- **scraper-fplcore/** (primary) — Fetches CSV data from `github.com/olbauday/FPL-Core-Insights`. No scraping, no fuzzy name matching. Player IDs are native FPL element IDs. Updates 2x daily.
- **scraper-understat/** — Fetches xG/xA/npxG from Understat per gameweek.
- **scraper-fpl/** — Syncs player roster, prices, ownership from official FPL API.
- All scrapers write to PocketBase collections: `players`, `gameweek_stats`, `price_history`, `sync_log`.

### Available Data from FPL-Core-Insights

The `playermatchstats.csv` from FPL-Core-Insights provides per-match data for every Premier League player. Fields available (not all currently used):

**Attacking:** `goals`, `assists`, `total_shots`, `xg`, `xa`, `xgot`, `shots_on_target`, `big_chances_missed`, `touches_opposition_box`, `chances_created`, `penalties_scored`, `penalties_missed`

**Passing:** `accurate_passes`, `accurate_passes_percent`, `final_third_passes`, `accurate_crosses`, `accurate_crosses_percent`, `accurate_long_balls`, `accurate_long_balls_percent`

**Defensive:** `clearances`, `blocks`, `interceptions`, `tackles_won`, `tackles_won_percent`, `recoveries`, `headed_clearances`, `dribbled_past`, `defensive_contributions` (pre-aggregated CBIT)

**Duels:** `duels_won`, `duels_lost`, `ground_duels_won`, `ground_duels_won_percent`, `aerial_duels_won`, `aerial_duels_won_percent`

**GK-specific:** `saves`, `goals_conceded`, `xgot_faced`, `goals_prevented`, `sweeper_actions`, `high_claim`, `gk_accurate_passes`, `gk_accurate_long_balls`, `saves_inside_box`

**Physical:** `touches`, `was_fouled`, `fouls_committed`, `offsides`, `dispossessed`, `corners`, `top_speed`, `distance_covered`, `walking_distance`, `running_distance`, `sprinting_distance`, `number_of_sprints`

**Match context:** `minutes_played`, `start_min`, `finish_min`, `match_id`, `team_goals_conceded`

**Unused but available for future features:**
- `accurate_passes_percent` — for a "Pass Masters" leaderboard
- `dribbled_past` — for a "Beaten Too Easily" negative leaderboard
- `dispossessed` — possession retention metric
- `top_speed` / `distance_covered` / `sprinting_distance` — physical performance tracking
- `sweeper_actions` / `high_claim` — GK playing style analysis
- `corners` — set piece responsibility tracking
- `fouls_committed` vs `was_fouled` — discipline analysis
- Per-gameweek breakdowns via `By Gameweek/GW{n}/` folder structure

Raw CSV URLs follow the pattern:
```
https://raw.githubusercontent.com/olbauday/FPL-Core-Insights/main/data/2025-2026/players.csv
https://raw.githubusercontent.com/olbauday/FPL-Core-Insights/main/data/2025-2026/By%20Gameweek/GW{n}/playermatchstats.csv
```

## YouTube Pipeline (Claude Code Workflow)

The `youtube-pipeline/` directory contains an AI video content pipeline for the "FPL Stats Lab" YouTube channel. **Claude Code is the script generator** — no API needed.

### Workflow
1. **Fetch stats:** `cd youtube-pipeline && GAMEWEEK=28 VIDEO_TYPE=gw-preview npm run fetch-stats`
   - Pulls leaderboard data from PocketBase
   - Saves `output/{type}-gw{n}/stats.json` and `output/{type}-gw{n}/prompt.txt`
2. **Generate script:** Claude Code reads `prompt.txt` and writes:
   - `content/{type}-gw{n}/script.md` — full script with metadata header
   - `content/{type}-gw{n}/narration.txt` — clean text for TTS (no [VISUAL] cues, [PAUSE] → "...")
   - `content/{type}-gw{n}/metadata.json` — `{ title, description, tags, thumbnailPrompt }`
3. **Commit** the content files to `youtube-pipeline/content/`
4. **Voice** (optional): `npm run voice` — ElevenLabs TTS from narration.txt
5. **Upload** (optional): `npm run upload` — YouTube Data API

### Video Types
- `gw-preview` (Friday) — captain picks, differentials, avoid
- `gw-review` (Tuesday) — overperformers, underperformers, xG vs reality
- `price-watch` (Wednesday) — price risers/fallers, transfer targets
- `deep-dive` (monthly) — full xG breakdown, clinical finishing analysis

### Script Generation Rules
When generating a script from a prompt.txt file:
- Write the script as a confident, data-driven FPL content creator
- Reference specific numbers: "Salah leads with 12.4 xG" not "Salah has good stats"
- Include [VISUAL: description] markers for where charts should appear
- Include [PAUSE] markers for natural pauses
- Keep language accessible — explain xG briefly for newer viewers
- Do NOT use emoji in scripts

## Docker

Multi-stage Dockerfile included. Final image uses `node:20-alpine`, serves on port 3000.
