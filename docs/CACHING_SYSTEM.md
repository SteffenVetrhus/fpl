# FPL API Caching System

## Overview

The FPL application uses a two-tier caching system with PocketBase to dramatically reduce API calls to the Fantasy Premier League API and avoid rate limiting.

## Architecture

```
┌─────────────┐
│ React Router│
│   Loader    │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────┐
│   Cached FPL API Client         │
│   (app/lib/fpl-api/cached-client)│
└────┬─────────────────────┬───────┘
     │                     │
     │ Cache Miss          │ Cache Hit
     ↓                     ↓
┌─────────────┐      ┌──────────────┐
│  FPL API    │      │  PocketBase  │
│  (External) │      │  (Database)  │
└─────────────┘      └──────────────┘
```

## Cache Strategy

### 1. Bootstrap-Static Data
**What**: All player stats, teams, and gameweek metadata (~2MB)

**Cache Key**: Current gameweek number

**TTL**: 1 hour

**Rationale**: Player stats update throughout the day during live gameweeks

**Usage**:
```typescript
import { fetchBootstrapStatic } from "~/lib/fpl-api/cached-client";

const bootstrap = await fetchBootstrapStatic(currentGameweek);
// First call: Fetches from FPL API, caches in PocketBase
// Subsequent calls (within 1 hour): Returns from cache
```

### 2. Manager Gameweek Picks
**What**: Team selection, captain, bench for a specific manager/gameweek

**Cache Key**: `(manager_id, gameweek)`

**TTL**:
- Completed gameweeks: Forever (immutable)
- Current gameweek: 10 minutes

**Rationale**: Historical data never changes, current gameweek updates during live matches

**Usage**:
```typescript
import { fetchManagerGameweekPicks } from "~/lib/fpl-api/cached-client";

const picks = await fetchManagerGameweekPicks("123456", 5, true);
// isCompleted = true means cache forever
```

### 3. Batch Fetching
**What**: Fetch multiple gameweeks for a manager efficiently

**Benefits**:
- Single database query for all cached gameweeks
- Parallel fetches for cache misses
- Automatically uses cached data when available

**Usage**:
```typescript
import { fetchManagerPicksBatch } from "~/lib/fpl-api/cached-client";

const picksMap = await fetchManagerPicksBatch("123456", [1, 2, 3, 4, 5]);
// Returns Map<gameweek, FPLGameweekPicks>
// Fetches only uncached gameweeks from FPL API
```

## Performance Comparison

### Without Caching (Current Implementation)
**Captain Regret for Single Player (13 gameweeks):**
- Bootstrap-static: 1 API call
- Manager picks: 13 API calls
- **Total**: 14 API calls
- **Time**: ~7-10 seconds
- **Risk**: High rate limiting risk with multiple users

### With Caching (New Implementation)
**Captain Regret for Single Player (13 gameweeks):**

**First Load (Cold Cache):**
- Bootstrap-static: 1 API call → cached
- Manager picks: 13 API calls → cached
- **Total**: 14 API calls (same as without caching)
- **Time**: ~7-10 seconds

**Second Load (Warm Cache):**
- Bootstrap-static: 0 API calls (from cache)
- Manager picks: 0 API calls (from cache)
- **Total**: 0 API calls ✅
- **Time**: ~500ms ⚡
- **Risk**: Zero rate limiting risk

**Shared Cache Benefits:**
- User A loads data → caches for all users
- User B gets instant results from User A's cache
- Multiple users benefit from single cache

## Implementation

### Step 1: Use Cached Client

Replace direct FPL API calls with cached versions:

```typescript
// ❌ Before (Direct API)
import { fetchBootstrapStatic, fetchManagerGameweekPicks } from "~/lib/fpl-api/client";

// ✅ After (Cached)
import { fetchBootstrapStatic, fetchManagerGameweekPicks } from "~/lib/fpl-api/cached-client";
```

### Step 2: Mark Completed Gameweeks

When fetching historical data, mark gameweeks as completed:

```typescript
const picks = await fetchManagerGameweekPicks(
  managerId,
  gameweek,
  isCompleted  // ← Set to true for finished gameweeks
);
```

### Step 3: Use Batch Fetching for Multiple Gameweeks

```typescript
// ❌ Before (Sequential)
const picks1 = await fetchManagerGameweekPicks(id, 1, true);
const picks2 = await fetchManagerGameweekPicks(id, 2, true);
const picks3 = await fetchManagerGameweekPicks(id, 3, true);
// 3+ API calls, slow

// ✅ After (Batch)
const allPicks = await fetchManagerPicksBatch(id, [1, 2, 3]);
// 0-3 API calls (depending on cache), fast
```

## Monitoring

The cached client logs all cache operations:

```bash
# Cache hit (data from database)
[Cache HIT] Bootstrap data (245s old)
[Cache HIT] Manager 123456 GW5 (permanent)
[Batch Cache HIT] Manager 123456 GW3

# Cache miss (fetching from FPL API)
[Cache MISS] Fetching fresh bootstrap data from FPL API
[Cache MISS] Fetching manager 123456 GW5 from FPL API
[Batch Cache MISS] Fetching 5 gameweeks for manager 123456
```

## Cache Invalidation

### Automatic
- Bootstrap data expires after 1 hour
- Current gameweek picks expire after 10 minutes
- Completed gameweeks never expire

### Manual
To force refresh:

**Via PocketBase Admin UI:**
1. Go to https://fpl.soyna.no/_/
2. Navigate to Collections
3. Delete records from `bootstrap_cache`
4. Delete records from `manager_picks` where `is_completed = false`

**Via API:**
```typescript
// Clear bootstrap cache for current gameweek
await pb.deleteBootstrapCache(currentGameweek);

// Clear manager picks for current gameweek
await pb.deleteManagerPicks(managerId, currentGameweek);
```

## Error Handling

The caching layer is fault-tolerant:

```typescript
try {
  // Try cache
  const cached = await pb.getBootstrapCache(gameweek);
  if (cached && isFresh(cached)) {
    return cached.data;
  }
} catch (error) {
  console.warn("Cache read failed, fetching fresh:", error);
  // Falls through to FPL API fetch
}

// Always falls back to FPL API if cache fails
const data = await fetchBootstrapDirect();
```

**Benefits:**
- Cache failures don't break the app
- Always serves data (either cached or fresh)
- Logs warnings for debugging

## Database Size

**Expected Storage:**
- Bootstrap cache: ~2MB × 2 records (current + previous GW) = 4MB
- Manager picks: ~10KB × (10 managers × 38 GWs) = 3.8MB
- **Total**: ~8MB for entire season

**Growth Rate:**
- Grows linearly with gameweeks
- Minimal storage impact
- Can run on free PocketBase tier

## Security

**Authentication:**
- All API requests use admin authentication
- Token auto-refreshes every hour
- Credentials stored in environment variables

**API Rules:**
```javascript
// Only authenticated users can access
listRule: "@request.auth.id != ''"
viewRule: "@request.auth.id != ''"
createRule: "@request.auth.id != ''"
```

## Setup Required

See [POCKETBASE_SCHEMA.md](./POCKETBASE_SCHEMA.md) for:
1. Creating collections in PocketBase
2. Setting up indexes
3. Configuring environment variables

## Future Optimizations

### Background Refresh
Refresh cache in background before expiry:
```typescript
// If cache is 50+ minutes old, trigger background refresh
if (cacheAge > 3000000) {
  refreshInBackground(gameweek).catch(console.error);
}
return cachedData; // Return stale data immediately
```

### Pre-warming
Pre-fetch upcoming gameweek data:
```typescript
// When GW5 starts, pre-cache GW6 captain data
if (gameweekJustStarted) {
  preWarmCache(nextGameweek);
}
```

### Cache Statistics
Track hit/miss rates:
```typescript
{
  total_requests: 1000,
  cache_hits: 950,
  cache_misses: 50,
  hit_rate: 0.95, // 95% hit rate
  avg_response_time: 120ms
}
```

## Testing

Mock PocketBase in tests:
```typescript
vi.mock("~/lib/pocketbase/client", () => ({
  getPocketBaseClient: () => ({
    getBootstrapCache: vi.fn().mockResolvedValue(null),
    setBootstrapCache: vi.fn(),
    getManagerPicks: vi.fn().mockResolvedValue(null),
    setManagerPicks: vi.fn(),
  }),
}));
```

## Troubleshooting

**Problem**: "PocketBase auth failed: 400"
- **Solution**: Check POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env

**Problem**: All requests are cache misses
- **Solution**: Verify PocketBase collections exist (see POCKETBASE_SCHEMA.md)

**Problem**: Stale data showing
- **Solution**: Clear cache manually or wait for TTL expiry

**Problem**: "Failed to fetch manager picks"
- **Solution**: Check manager ID exists in FPL, verify gameweek number is valid
