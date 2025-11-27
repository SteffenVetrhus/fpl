# Architecture Documentation

## Overview

This document outlines the architectural decisions, patterns, and principles used in the FPL League Tracker application.

**Last Updated:** 2025-11-27
**Version:** 1.0.0
**Status:** Phase 0 Complete

---

## Tech Stack

### Core Framework
- **React Router v7.9.2** - Full-stack React framework with file-based routing
- **React 19.1.1** - Latest React with improved performance and features
- **TypeScript 5.9.2** - Type safety and improved developer experience
- **Vite 7.1.7** - Lightning-fast HMR and build tooling

### Styling
- **Tailwind CSS v4.1.13** - Utility-first CSS with @theme configuration
- Modern CSS with dark mode support

### Testing
- **Vitest v4.0.14** - Unit and integration testing with jsdom
- **@testing-library/react v16.3.0** - Component testing utilities
- **Playwright v1.57.0** - End-to-end browser testing
- **@testing-library/jest-dom** - DOM matchers for assertions

### Development Approach
- **Atomic TDD (Test-Driven Development)** - Test first, implement second
- **RED → GREEN → REFACTOR** cycle for all features

---

## Project Structure

```
fpl/
├── app/                        # Application source code
│   ├── config/                 # Configuration utilities
│   │   ├── env.ts             # Environment variable parser
│   │   └── env.test.ts        # Config tests
│   ├── routes/                 # React Router v7 file-based routes
│   │   └── home.tsx           # Index route
│   ├── utils/                  # Utility functions
│   │   ├── points.ts          # FPL points calculations
│   │   └── points.test.ts     # Points utility tests
│   ├── root.tsx               # Root layout with error boundary
│   ├── routes.ts              # Route configuration
│   └── app.css                # Global styles + Tailwind imports
├── e2e/                        # Playwright E2E tests
│   └── home.spec.ts           # Home page E2E tests
├── docs/                       # Documentation
│   └── ARCHITECTURE.md        # This file
├── public/                     # Static assets
├── .env.example               # Environment variable template
├── vitest.config.ts           # Vitest configuration
├── playwright.config.ts       # Playwright E2E configuration
├── react-router.config.ts     # React Router configuration
├── vite.config.ts             # Vite bundler configuration
└── tsconfig.json              # TypeScript configuration
```

---

## Architectural Decisions

### 1. React Router v7 over Next.js

**Decision:** Use React Router v7 as the full-stack framework
**Date:** 2025-11-27

**Rationale:**
- File-based routing with type-safe loaders
- Built on Vite for fastest possible HMR
- Simpler mental model than Next.js App Router
- Better suited for SPA-first applications
- Excellent TypeScript integration out of the box

**Trade-offs:**
- Smaller ecosystem compared to Next.js
- Less built-in optimization (but Vite compensates)
- Newer framework (less Stack Overflow answers)

---

### 2. Tailwind CSS v4

**Decision:** Use Tailwind CSS v4 with @theme syntax
**Date:** 2025-11-27

**Rationale:**
- Zero runtime overhead (compiled at build time)
- New @theme syntax simplifies configuration
- Dark mode support out of the box
- Better performance than v3 (no PostCSS)
- Included in React Router template

**Trade-offs:**
- Breaking changes from v3 (but project is greenfield)
- Some plugins not yet compatible with v4

---

### 3. Vitest over Jest

**Decision:** Use Vitest for unit/integration testing
**Date:** 2025-11-27

**Rationale:**
- Native ESM support (no transform needed)
- Vite-powered (shares config with dev environment)
- Faster than Jest (40%+ in benchmarks)
- Compatible with @testing-library
- Watch mode UI included

**Trade-offs:**
- Smaller ecosystem than Jest
- Some Jest plugins not compatible

---

### 4. Playwright for E2E

**Decision:** Use Playwright instead of Cypress
**Date:** 2025-11-27

**Rationale:**
- Supports multiple browsers (Chromium, Firefox, WebKit)
- Faster and more reliable than Selenium
- Better TypeScript support than Cypress
- Auto-wait functionality reduces flaky tests
- Built-in test retry mechanism

**Trade-offs:**
- Requires browser binaries (larger install)
- Steeper learning curve than Cypress
- Doesn't run well in all containerized environments

---

### 5. Environment-Based Configuration

**Decision:** Use .env files with type-safe config utility
**Date:** 2025-11-27

**Rationale:**
- Separates config from code (12-factor app)
- Easy to switch between dev/staging/prod
- Type safety via `getEnvConfig()`
- Prevents accidental commit of secrets (.gitignore)
- Default values for optional settings

**Implementation:**
```typescript
// app/config/env.ts
export function getEnvConfig(): EnvConfig {
  return {
    fplLeagueId: process.env.FPL_LEAGUE_ID,
    apiBaseUrl: process.env.FPL_API_BASE_URL || "https://fantasy.premierleague.com/api",
    enableCache: process.env.ENABLE_API_CACHE !== "false",
    cacheDuration: parseInt(process.env.API_CACHE_DURATION || "300", 10),
  };
}
```

---

### 6. Atomic TDD Methodology

**Decision:** Strict test-first development
**Date:** 2025-11-27

**Process:**
1. Write failing test (RED)
2. Implement minimum code to pass (GREEN)
3. Refactor if needed
4. Commit only when tests pass
5. Never skip tests for "simple" code

**Example:**
```typescript
// 1. RED: Write test first
test("should calculate gameweek winner", () => {
  const managers = [
    { id: 1, name: "Alice", points: 75 },
    { id: 2, name: "Bob", points: 92 },
  ];
  expect(calculateGameweekWinner(managers)).toEqual({ id: 2, name: "Bob", points: 92 });
});

// 2. GREEN: Implement function
export function calculateGameweekWinner(managers: Manager[]): Manager {
  return managers.reduce((winner, current) =>
    current.points > winner.points ? current : winner
  );
}

// 3. Tests pass ✓
```

---

## Data Flow Architecture

### FPL API Integration (Planned - Phase 1)

```
┌─────────────┐
│   User      │
│  Browser    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  React Router Loader        │
│  (Server-side data fetch)   │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Cache Layer  │ ◄── 5-minute TTL (configurable)
    └──────┬───────┘
           │
           ▼
┌──────────────────────────┐
│  FPL API Client          │
│  (app/lib/fpl-api/)      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Fantasy Premier League  │
│  Official API            │
│  (unofficial endpoints)  │
└──────────────────────────┘
```

**Key Points:**
- React Router loaders fetch data on the server
- Caching layer prevents FPL API rate limiting
- Type-safe API responses with TypeScript interfaces
- Error boundaries handle API failures gracefully

---

## Testing Strategy

### Unit Tests (Vitest)
- **Location:** `*.test.ts` files next to source
- **Coverage Target:** 80%+ for utilities and business logic
- **Pattern:** RED → GREEN → REFACTOR
- **Run:** `npm test` or `npm run test:watch`

**Example:**
```typescript
// app/utils/points.test.ts
describe("calculateGameweekWinner", () => {
  it("should return the manager with highest points", () => {
    // Arrange
    const managers = [
      { id: 1, name: "Alice", points: 75 },
      { id: 2, name: "Bob", points: 92 },
    ];

    // Act
    const winner = calculateGameweekWinner(managers);

    // Assert
    expect(winner).toEqual({ id: 2, name: "Bob", points: 92 });
  });
});
```

### Integration Tests (Vitest + Testing Library)
- **Location:** Component `*.test.tsx` files
- **Focus:** User interactions and component integration
- **Tools:** @testing-library/react, @testing-library/user-event
- **Run:** `npm test`

### E2E Tests (Playwright)
- **Location:** `e2e/*.spec.ts`
- **Focus:** Critical user journeys
- **Run:** `npm run test:e2e` (requires display environment)
- **CI:** Runs in GitHub Actions with browser binaries

---

## Security Considerations

### API Keys & Secrets
- ✅ `.env` in `.gitignore` (never commit secrets)
- ✅ `.env.example` documents required variables
- ✅ No API keys in client-side code
- ✅ Environment variables accessed only in loaders (server-side)

### FPL API
- ⚠️ Unofficial API (no authentication required)
- ⚠️ Public league data only (no private league support without auth)
- ✅ Rate limiting via caching (5-minute default)
- ✅ No user passwords or sensitive data

---

## Performance Optimizations

### Current (Phase 0)
- ✅ Vite for fast HMR (<50ms updates)
- ✅ Tailwind CSS (purged, minimal bundle)
- ✅ TypeScript for compile-time optimization
- ✅ React 19 (automatic batching, transitions)

### Planned (Phase 2+)
- [ ] React Query for intelligent caching
- [ ] Code splitting by route
- [ ] Image optimization (if needed)
- [ ] Service Worker for offline support
- [ ] CDN deployment (Cloudflare, Vercel, etc.)

---

## Error Handling Strategy

### Error Boundaries
- Root-level error boundary in `app/root.tsx`
- Catches React errors and displays user-friendly message
- Development: Shows error stack trace
- Production: Generic error message + error logging

### API Error Handling (Planned)
```typescript
// Loader error handling
export async function loader() {
  try {
    const data = await fetchLeagueStandings();
    return { data };
  } catch (error) {
    // React Router will catch and display via ErrorBoundary
    throw new Response("Failed to load league data", { status: 500 });
  }
}
```

---

## Deployment Architecture (Planned)

### Docker Deployment (Included)
- `Dockerfile` provided in project root
- Multi-stage build (build → serve)
- Port: 3000
- Supports: AWS ECS, Google Cloud Run, Azure Container Apps, Fly.io

### Recommended Platform
- **Vercel** or **Cloudflare Pages** (zero-config React Router support)
- **Fly.io** (Docker-based, edge deployment)
- **Railway** (easy environment variable management)

---

## Future Enhancements

### Phase 1 (Data Layer)
- [ ] FPL API client implementation
- [ ] Type-safe API interfaces
- [ ] Data caching layer
- [ ] Error handling and retries

### Phase 2 (UI Components)
- [ ] League table component
- [ ] Gameweek history view
- [ ] Transfer tracker
- [ ] Responsive design

### Phase 3 (Advanced Features)
- [ ] Real-time gameweek updates
- [ ] Historical trend charts
- [ ] Transfer analysis
- [ ] Prize money tracking
- [ ] Mobile-first PWA

---

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your FPL League ID to .env
# FPL_LEAGUE_ID=12345

# Run dev server
npm run dev

# Open http://localhost:5173
```

### Development Commands
```bash
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm run start            # Serve production build
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests
npm run typecheck        # TypeScript type checking
```

### Git Workflow
1. Create feature branch: `git checkout -b feature/name`
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass: `npm test`
5. Type check: `npm run typecheck`
6. Commit with descriptive message
7. Push and create PR

---

## Questions & Decisions Log

### Why React Router v7 instead of Next.js?
- User preference for React Router ecosystem
- Simpler learning curve
- Vite-first approach (faster DX)
- SPA-friendly architecture

### Why not use React Query from the start?
- Phase 0 focuses on infrastructure
- Will add in Phase 4 when building data layer
- Allows for proper evaluation of caching needs

### Why Tailwind v4 instead of v3?
- Included in React Router template
- Better performance (no PostCSS)
- Future-proof (v4 is latest)

---

## References

- [React Router v7 Docs](https://reactrouter.com/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [FPL API Endpoints (Community)](https://github.com/vaastav/Fantasy-Premier-League)

---

## Changelog

### 2025-11-27 - Phase 0 Complete
- ✅ React Router v7 initialized
- ✅ Tailwind CSS v4 configured
- ✅ Vitest unit testing setup
- ✅ Playwright E2E testing setup
- ✅ Environment configuration with .env
- ✅ Architecture documentation
- ✅ 8/8 tests passing
- ✅ TypeScript type checking passing

**Next Steps:** Begin Phase 1 (FPL API Integration)
