# FPL League Tracker — Multi-League Monetization Plan

## Overview

Transform the current single-league deployment into a **multi-league platform** where league owners pay for access (based on league size), then invite their members. No Stripe — payments are handled manually (Vipps, Monzo, bank transfer, cash at the pub). Admins manage access via PocketBase.

---

## 1. Business Model

### League Owner Pays, Members Get Invited

The owner is the person who wants to run the tracker for their FPL league. They pay, set up their league, and invite their mates. Members don't pay — they get access through the owner's league.

### Pricing Tiers (by league size)

| Tier | Max Members | Price/Season | Target |
|------|-------------|-------------|--------|
| **Small** | Up to 8 | 29 NOK (~2.50 GBP) | Mates league |
| **Medium** | Up to 16 | 49 NOK (~4.00 GBP) | Office/pub league |
| **Large** | Up to 30 | 79 NOK (~6.50 GBP) | Big league |

> Prices are suggestions — configurable by the platform admin.

### Access Model

```
Platform Admin (you)
  └── League Owner (paid)
        └── League Members (invited, free)
              └── Access to all features for THAT league
```

- **Platform admin**: Manages the deployment, approves league owners, sets pricing
- **League owner**: Pays for a league, invites members, manages their league
- **League member**: Accepted into a league by the owner, sees all features for that league
- A user can be a member of multiple leagues and an owner of multiple leagues
- Premium features (Banter Zone, Decision Tools, Stat Corner, Mini Games) require an **active paid league**

---

## 2. Current Architecture Pain Points

These are the things that make this a significant refactor:

| Problem | Current State | Target State |
|---------|--------------|--------------|
| League ID source | `FPL_LEAGUE_ID` env var (single) | PocketBase `leagues` collection (multiple) |
| Route loaders | All call `getEnvConfig().fplLeagueId` (26+ places) | Read active league from session/URL |
| User-league binding | `users.fpl_manager_id` (UNIQUE, one league) | Junction table `league_members` |
| Stat Corner | Global, no league filtering | Scoped per league's players |
| Seed script | Seeds one league's users | Self-service: owner adds league, members join |
| Navigation | Static, one league | League switcher in nav |
| Transfer Plans | No league field | Scoped per league |

---

## 3. New PocketBase Schema

### New Collection: `leagues`

The core new entity. Each row = one paid league on the platform.

| Field | Type | Description |
|-------|------|-------------|
| `id` | auto | PocketBase ID |
| `fpl_league_id` | number (required, unique) | FPL API league ID |
| `name` | text (required) | League display name (fetched from FPL API) |
| `owner` | relation → users (required) | Who paid for this league |
| `tier` | select: `small`, `medium`, `large` | Pricing tier |
| `max_members` | number | 8, 16, or 30 based on tier |
| `status` | select: `pending`, `active`, `expired`, `suspended` | Payment/access status |
| `paid_until` | date | End of paid season (e.g., 2026-06-30) |
| `created` | autoDate | When league was added |

**API Rules:**
- `listRule`: `owner = @request.auth.id || @request.auth.id ?= league_members_via_league.user`
- `viewRule`: same as list
- `createRule`: `@request.auth.id != ""`
- `updateRule`: `owner = @request.auth.id`

### New Collection: `league_members`

Junction table linking users to leagues. Replaces the single `fpl_manager_id` approach for multi-league.

| Field | Type | Description |
|-------|------|-------------|
| `id` | auto | PocketBase ID |
| `league` | relation → leagues (required) | Which league |
| `user` | relation → users (required) | Which user |
| `fpl_manager_id` | number (required) | FPL manager ID in this league |
| `player_name` | text | Manager name in this league |
| `team_name` | text | Team name in this league |
| `role` | select: `owner`, `member` | Role within the league |
| `invited_by` | relation → users | Who invited this member |
| `joined_at` | date | When they joined |

**Unique index:** `(league, user)` — one membership per user per league.

**API Rules:**
- `listRule`: `league.owner = @request.auth.id || user = @request.auth.id`
- `createRule`: `league.owner = @request.auth.id` (only owner can invite)
- `deleteRule`: `league.owner = @request.auth.id` (only owner can remove)

### New Collection: `league_invites`

For the invite flow.

| Field | Type | Description |
|-------|------|-------------|
| `id` | auto | PocketBase ID |
| `league` | relation → leagues (required) | Which league |
| `invite_code` | text (required, unique) | Random invite code |
| `created_by` | relation → users (required) | Who created the invite |
| `used_by` | relation → users | Who used it (null if unused) |
| `expires_at` | date | Expiry date |
| `status` | select: `active`, `used`, `expired` | Invite status |

### New Collection: `payments`

Audit trail for manual payments.

| Field | Type | Description |
|-------|------|-------------|
| `id` | auto | PocketBase ID |
| `league` | relation → leagues | Which league was paid for |
| `user` | relation → users | Who paid (the owner) |
| `amount` | number | Amount in smallest currency unit |
| `currency` | text | e.g., `NOK`, `GBP` |
| `method` | text | e.g., `vipps`, `monzo`, `cash`, `bank_transfer` |
| `notes` | text | Admin notes |
| `status` | select: `completed`, `pending`, `refunded` | Payment status |
| `verified_by` | text | Admin who verified the payment |
| `created` | autoDate | Payment date |

### Modified Collection: `users`

Keep existing fields. Remove the hard coupling to a single league:

- **Keep:** `fpl_manager_id` — but make it nullable/optional (for users who haven't linked yet)
- **Keep:** `player_name`, `team_name` — as defaults, but league-specific names come from `league_members`
- **Add:** `is_platform_admin` (bool, default false) — for the platform operator

### Modified Collection: `transfer_plans`

- **Add:** `league` (relation → leagues, required) — scope plans per league

### Modified Collection: `mini_game_rounds`

Already has `league_id` (string). Migrate to a relation → `leagues` for consistency, or keep as string matching `leagues.fpl_league_id`.

---

## 4. URL Structure & League Context

### Option A: League in URL path (Recommended)

```
/leagues                          → list my leagues
/leagues/new                      → create/add a league
/leagues/:leagueId                → league dashboard (current _index)
/leagues/:leagueId/gameweeks      → gameweek history
/leagues/:leagueId/standings      → historical standings
/leagues/:leagueId/transfers      → transfer activity
/leagues/:leagueId/stat-corner    → advanced stats
/leagues/:leagueId/banter/bench-shame  → banter zone
/leagues/:leagueId/tools/captain-picker → decision tools
/leagues/:leagueId/mini-games     → mini games
/leagues/:leagueId/settings       → league settings (owner only)
/leagues/:leagueId/invite         → invite members (owner only)
```

**Why URL path:** Bookmarkable, shareable, no hidden session state, works with browser back/forward. The `:leagueId` is the PocketBase league record ID (not the FPL league ID).

### Route Layout Pattern

Use React Router v7 nested routes with a league layout:

```typescript
// routes.ts
route("leagues", "routes/leagues.tsx", [          // list
  route("new", "routes/league-new.tsx"),           // create
  layout("routes/league-layout.tsx", [             // shared layout with league context
    route(":leagueId", "routes/league-dashboard.tsx"),
    route(":leagueId/gameweeks", "routes/league-gameweeks.tsx"),
    route(":leagueId/standings", "routes/league-standings.tsx"),
    // ... all league-scoped routes
  ]),
]);
```

The `league-layout.tsx` loader:
1. Reads `:leagueId` from params
2. Fetches the league from PocketBase
3. Verifies user is a member of this league
4. Verifies league status is `active`
5. Provides league context to all child routes via outlet context

This replaces `getEnvConfig().fplLeagueId` in every loader.

### Backward Compatibility

The old routes (`/`, `/gameweeks`, `/standings`, etc.) can redirect:
- If user has exactly one league → redirect to `/leagues/:leagueId/...`
- If user has multiple leagues → redirect to `/leagues` (league picker)
- If not authenticated → show marketing/landing page

---

## 5. New & Modified Files

### New Files

| File | Purpose |
|------|---------|
| `app/lib/pocketbase/league.ts` | League CRUD: `createLeague`, `getLeague`, `getUserLeagues`, `requireLeagueMember`, `requireLeagueOwner` |
| `app/lib/pocketbase/league.test.ts` | Tests |
| `app/lib/pocketbase/invite.ts` | Invite CRUD: `createInvite`, `acceptInvite`, `getLeagueInvites` |
| `app/lib/pocketbase/invite.test.ts` | Tests |
| `app/routes/leagues.tsx` | League list page (my leagues) |
| `app/routes/league-new.tsx` | Create league form (enter FPL league ID, auto-fetch name) |
| `app/routes/league-layout.tsx` | Nested layout: loads league, verifies membership, provides context |
| `app/routes/league-dashboard.tsx` | Current `_index.tsx` content, league-scoped |
| `app/routes/league-gameweeks.tsx` | Current `gameweeks.tsx`, league-scoped |
| `app/routes/league-standings.tsx` | Current `standings.tsx`, league-scoped |
| `app/routes/league-transfers.tsx` | Current `transfers.tsx`, league-scoped |
| `app/routes/league-settings.tsx` | Owner: manage league, view members, create invites |
| `app/routes/league-invite.tsx` | Accept invite flow (public link with invite code) |
| `app/routes/admin.tsx` | Platform admin: manage leagues, verify payments, set tiers |
| `app/components/LeagueSwitcher/` | Dropdown in nav to switch between leagues |
| `app/components/LeagueCard/` | Card showing league info on the list page |
| `app/components/InviteLink/` | Generate and share invite link component |
| `pb_migrations/XXXX_create_leagues.js` | Create `leagues` collection |
| `pb_migrations/XXXX_create_league_members.js` | Create `league_members` collection |
| `pb_migrations/XXXX_create_league_invites.js` | Create `league_invites` collection |
| `pb_migrations/XXXX_create_payments.js` | Create `payments` collection |

### Modified Files

| File | Change |
|------|--------|
| `app/routes.ts` | Restructure all routes under `/leagues/:leagueId/` nesting |
| `app/root.tsx` | Add league switcher, update nav to be league-aware, update auth context to include active league |
| `app/config/env.ts` | Make `FPL_LEAGUE_ID` optional (no longer required), add `APP_URL` |
| `app/lib/pocketbase/auth.ts` | Add `is_platform_admin` to `AuthUser` |
| `app/lib/fpl-api/client.ts` | No changes needed — already accepts `leagueId` as parameter |
| `app/lib/fpl-api/league-data.ts` | No changes needed — already accepts `leagueId` as parameter |
| `app/lib/stat-corner/client.ts` | Add league-scoping: filter players by league's managers |
| `app/lib/mini-games/round-manager.ts` | Use PocketBase league ID relation instead of string |
| `scripts/seed-users.ts` | Update to create a league + league_members instead of just users |
| `app/app.css` | Add league management color tokens |
| All 26+ existing route files | Move into league-scoped nested routes, replace `getEnvConfig().fplLeagueId` with layout context |

### Deleted Files (eventually)

| File | Reason |
|------|--------|
| `app/routes/_index.tsx` | Replaced by `league-dashboard.tsx` (old path redirects) |
| `app/routes/gameweeks.tsx` | Replaced by `league-gameweeks.tsx` |
| `app/routes/standings.tsx` | Replaced by `league-standings.tsx` |
| `app/routes/transfers.tsx` | Replaced by `league-transfers.tsx` |
| (and all other route files that move into league scope) | |

---

## 6. Key Implementation Patterns

### League Context via Layout

The `league-layout.tsx` provides league context to all child routes:

```typescript
// app/routes/league-layout.tsx
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const pb = createServerClient(request);

  const league = await pb.collection("leagues").getOne(params.leagueId, {
    expand: "owner",
  });

  // Verify user is a member
  const membership = await pb.collection("league_members").getFirstListItem(
    `league = "${league.id}" && user = "${user.id}"`
  );

  if (!membership) throw redirect("/leagues");
  if (league.status !== "active") throw redirect("/leagues");

  return { league, membership, fplLeagueId: String(league.fpl_league_id) };
}
```

Child route loaders access the FPL league ID from the parent layout, NOT from env config.

### Replacing `getEnvConfig().fplLeagueId`

Every existing loader currently does:
```typescript
const config = getEnvConfig();
const data = await fetchSomething(config.fplLeagueId);
```

In the new structure, nested route loaders get the league ID from the parent layout's data. With React Router v7, child loaders can access parent data. The pattern becomes:

```typescript
// In a child route loader
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  // params.leagueId comes from the URL
  // The league-layout loader already verified membership
  const league = await getLeagueForRoute(request, params.leagueId);
  const data = await fetchSomething(String(league.fpl_league_id));
  return data;
}
```

Where `getLeagueForRoute` is a helper that fetches the league and verifies membership (can be cached per request).

### Invite Flow

```
1. Owner creates league → gets league page
2. Owner goes to league settings → clicks "Generate Invite Link"
3. System creates invite record → returns URL like /join/abc123
4. Owner shares link via WhatsApp/group chat
5. Recipient clicks link:
   a. If not logged in → redirect to /login?redirect=/join/abc123
   b. If logged in but no FPL manager linked → prompt to enter manager ID
   c. If logged in → auto-join league, redirect to league dashboard
6. Owner sees new member in league settings
```

### League Owner Registration Flow

```
1. User visits /leagues/new
2. Enters their FPL classic league ID (from the FPL website URL)
3. System fetches league info from FPL API to verify it exists
4. Shows league name, current members count → confirms
5. Creates league record with status: "pending"
6. Shows "Contact admin to activate" message with payment instructions
7. Platform admin verifies payment → sets status: "active" in PocketBase
8. Owner gets access, can now invite members
```

### Access Control Hierarchy

```
requirePlatformAdmin(request)  → Platform admin routes (/admin)
requireLeagueOwner(request, leagueId)  → League management routes (settings, invites)
requireLeagueMember(request, leagueId) → All league content routes
requireAuth(request)  → Account routes (profile, change-password)
getOptionalAuth(request)  → Public routes (landing page)
```

---

## 7. Migration Strategy

### Phase 1: Foundation (PocketBase + Auth)
1. Create new PocketBase collections via migrations
2. Add `is_platform_admin` to users collection
3. Create `league.ts` and `invite.ts` utility modules with tests
4. Update `AuthUser` interface
5. Keep existing routes working (backward compatible)

### Phase 2: League Management Routes
1. Build `/leagues` list page
2. Build `/leagues/new` create flow
3. Build `/leagues/:leagueId/settings` owner page
4. Build `/join/:inviteCode` invite acceptance flow
5. Build `/admin` platform admin page
6. All new routes — nothing breaks yet

### Phase 3: Route Migration
1. Create `league-layout.tsx` with membership verification
2. Duplicate each existing route as a league-scoped version:
   - `_index.tsx` → `league-dashboard.tsx`
   - `gameweeks.tsx` → `league-gameweeks.tsx`
   - etc.
3. Replace `getEnvConfig().fplLeagueId` with league context in each
4. Add redirect logic on old routes
5. Update navigation in `root.tsx`

### Phase 4: Scoping Existing Features
1. Scope Stat Corner to league's players
2. Migrate mini-games to use leagues relation
3. Scope transfer plans per league
4. Update seed script for multi-league

### Phase 5: Polish
1. League switcher component in nav
2. Landing/marketing page for unauthenticated users
3. Payment tracking and admin dashboard
4. E2E tests for full flows
5. Remove deprecated old routes

### Backward Compatibility During Migration

While migrating, support both modes:
- If `FPL_LEAGUE_ID` env var is set → legacy single-league mode (all old routes work)
- If not set → multi-league mode (requires league context from URL)

This lets the existing deployment keep working while the new system is built out.

---

## 8. What NOT to Build (Keep It Simple)

- **No Stripe / payment processing** — manual payments, admin verifies
- **No email system** — invites are shared via link (WhatsApp, etc.)
- **No subscription management** — admin sets `paid_until` date manually
- **No refund flow** — handled outside the app
- **No public league directory** — all leagues are private, invite-only
- **No free trial** — either the league is paid and active, or it's not
- **No per-feature gating** — if the league is active, all features are available
- **No usage metering** — flat fee per season based on league size tier

---

## 9. Open Questions

1. **Self-registration:** Should users be able to register themselves, or does the seed script / admin create all accounts? Currently, users are seeded. With multi-league, users might need self-registration.

2. **FPL Manager ID linking:** When a user joins a league via invite, how do they link their FPL manager ID? Options:
   - Owner pre-fills manager IDs when creating invites (knows their mates' IDs)
   - User enters their own manager ID on join
   - Auto-match by name from FPL API league data

3. **Season rollover:** What happens when a new FPL season starts? Does the owner need to re-pay? Do all leagues expire and need reactivation?

4. **Platform admin interface:** How minimal can the admin UI be? Could it just be PocketBase admin UI directly, or do you want a custom admin page?

5. **Stat Corner scoping:** Currently global (all PL players). Should it be:
   - Scoped to only players owned by league members? (more relevant but less data)
   - Kept global but accessed through league context? (same data, just gated)
