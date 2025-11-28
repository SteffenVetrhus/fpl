# PocketBase Schema Setup

## Overview
This document describes the PocketBase collections needed for FPL API caching.

## Collections

### 1. `bootstrap_cache`
Caches bootstrap-static data (all players, teams, gameweeks).

**Fields:**
- `gameweek` (Number, Required) - Gameweek number as cache key
- `data` (JSON, Required) - Full bootstrap-static response
- `fetched_at` (Date, Required) - When data was fetched

**Indexes:**
- `gameweek` (Unique) - For fast lookups

**API Rules:**
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id != ""`

### 2. `manager_picks`
Caches gameweek picks for managers.

**Fields:**
- `manager_id` (Text, Required) - FPL manager ID
- `gameweek` (Number, Required) - Gameweek number
- `data` (JSON, Required) - FPLGameweekPicks response
- `is_completed` (Bool, Required) - True if gameweek is finished (cache forever)
- `fetched_at` (Date, Required) - When data was fetched

**Indexes:**
- `manager_id, gameweek` (Unique composite) - For fast lookups

**API Rules:**
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id != ""`

## Setup Instructions

### Option 1: Using PocketBase Admin UI

1. Go to https://fpl.soyna.no/_/
2. Login with admin credentials
3. Navigate to Collections
4. Create `bootstrap_cache` collection:
   ```
   - Field: gameweek (Number, Required)
   - Field: data (JSON, Required)
   - Field: fetched_at (Date, Required)
   - Index: gameweek (Unique)
   ```
5. Create `manager_picks` collection:
   ```
   - Field: manager_id (Text, Required)
   - Field: gameweek (Number, Required)
   - Field: data (JSON, Required)
   - Field: is_completed (Bool, Required, Default: false)
   - Field: fetched_at (Date, Required)
   - Index: manager_id + gameweek (Unique composite)
   ```

### Option 2: Using PocketBase Collections Import

Create a file `pb_schema.json`:

```json
[
  {
    "id": "bootstrap_cache",
    "name": "bootstrap_cache",
    "type": "base",
    "schema": [
      {
        "name": "gameweek",
        "type": "number",
        "required": true
      },
      {
        "name": "data",
        "type": "json",
        "required": true
      },
      {
        "name": "fetched_at",
        "type": "date",
        "required": true
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_gameweek ON bootstrap_cache (gameweek)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  },
  {
    "id": "manager_picks",
    "name": "manager_picks",
    "type": "base",
    "schema": [
      {
        "name": "manager_id",
        "type": "text",
        "required": true
      },
      {
        "name": "gameweek",
        "type": "number",
        "required": true
      },
      {
        "name": "data",
        "type": "json",
        "required": true
      },
      {
        "name": "is_completed",
        "type": "bool",
        "required": true
      },
      {
        "name": "fetched_at",
        "type": "date",
        "required": true
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_manager_gameweek ON manager_picks (manager_id, gameweek)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  }
]
```

Then import via Admin UI.

## Environment Variables

Add these to your `.env` file:

```bash
POCKETBASE_URL=https://fpl.soyna.no
POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password
```

## Cache Strategy

### Bootstrap Data
- **TTL**: 1 hour
- **Invalidation**: Automatic by age
- **Key**: Current gameweek number
- **Rationale**: Player stats update throughout the day

### Manager Picks
- **TTL**:
  - Completed gameweeks: Forever (immutable)
  - Current gameweek: 10 minutes
- **Key**: `(manager_id, gameweek)`
- **Rationale**: Historical picks never change, current picks update during live gameweeks

## Performance Impact

### Before Caching:
- Every page load: 10+ API calls
- Captain Regret (single player): 14 API calls
- High risk of rate limiting

### After Caching:
- First load: 14 API calls (cache miss)
- Subsequent loads: 0-1 API calls (cache hit)
- Multiple users share cache
- No rate limiting risk

## Monitoring

Check PocketBase logs for cache hit/miss rates:
```
[Cache HIT] Bootstrap data (245s old)
[Cache MISS] Fetching fresh bootstrap data from FPL API
[Cache HIT] Manager 123456 GW5 (permanent)
[Batch Cache HIT] Manager 123456 GW3
```

## Maintenance

### Clear Cache
To force refresh:
1. Delete records from `bootstrap_cache` collection
2. Delete records from `manager_picks` where `is_completed = false`

### Monitor Size
- Bootstrap cache: ~2MB per record
- Manager picks: ~10KB per record
- Expected size: < 100MB for full season
