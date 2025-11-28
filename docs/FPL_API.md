# Fantasy Premier League API Documentation

**Last Updated:** 2025-11-27
**API Version:** Unofficial (community-maintained)
**Base URL:** `https://fantasy.premierleague.com/api/`

---

## ⚠️ Important Notes

### Unofficial API
- The FPL API is **not officially documented** by the Premier League
- Endpoints are maintained by the community through reverse engineering
- **May change without notice** during the season
- No rate limiting documentation (use caching to be safe)

### CORS Policy
- API has **CORS restrictions**
- Cannot be called directly from browser JavaScript
- **Must use server-side requests** (React Router loaders are perfect for this)

### Authentication
- Most endpoints are **public** and don't require authentication
- Some endpoints (like `/my-team/` and `/transfers-latest/`) require login cookies
- For our league tracker, we only use **public endpoints**

---

## Core Endpoints for FPL League Tracker

### 1. Bootstrap Static
**Endpoint:** `GET /api/bootstrap-static/`
**Authentication:** None required
**Purpose:** Returns all static game data including teams, players, gameweeks, and settings

**Response Structure:**
```json
{
  "events": [
    {
      "id": 1,
      "name": "Gameweek 1",
      "deadline_time": "2024-08-16T17:30:00Z",
      "finished": true,
      "highest_score": 112,
      "average_entry_score": 65,
      "is_current": false,
      "is_next": false
    }
  ],
  "teams": [
    {
      "id": 1,
      "name": "Arsenal",
      "short_name": "ARS",
      "strength": 4
    }
  ],
  "elements": [
    {
      "id": 1,
      "first_name": "Mohamed",
      "second_name": "Salah",
      "team": 14,
      "element_type": 3,
      "now_cost": 130,
      "total_points": 187
    }
  ],
  "element_types": [
    { "id": 1, "singular_name": "Goalkeeper" },
    { "id": 2, "singular_name": "Defender" },
    { "id": 3, "singular_name": "Midfielder" },
    { "id": 4, "singular_name": "Forward" }
  ]
}
```

**Usage:**
- Get current gameweek
- Get all teams and players
- Cache heavily (changes infrequently)

---

### 2. League Standings (Classic)
**Endpoint:** `GET /api/leagues-classic/{league_id}/standings/`
**Authentication:** None required (for public leagues)
**Purpose:** Returns league standings and manager rankings

**URL Parameters:**
- `page_standings` - Pagination (optional, default: 1)
- `page_new_entries` - New entries pagination (optional)

**Example:** `https://fantasy.premierleague.com/api/leagues-classic/1313411/standings/`

**Response Structure:**
```json
{
  "league": {
    "id": 1313411,
    "name": "My FPL League",
    "created": "2024-08-01T10:00:00Z",
    "start_event": 1,
    "code_privacy": "p"
  },
  "standings": {
    "has_next": false,
    "page": 1,
    "results": [
      {
        "id": 123456,
        "event_total": 85,
        "player_name": "John Doe",
        "rank": 1,
        "last_rank": 2,
        "rank_sort": 1,
        "total": 1543,
        "entry": 789012,
        "entry_name": "Team Name"
      }
    ]
  }
}
```

**Usage:**
- Display league table
- Track rank changes
- Identify current leader

---

### 3. Manager Entry (Summary)
**Endpoint:** `GET /api/entry/{manager_id}/`
**Authentication:** None required
**Purpose:** Returns manager profile and overall statistics

**Example:** `https://fantasy.premierleague.com/api/entry/789012/`

**Response Structure:**
```json
{
  "id": 789012,
  "player_first_name": "John",
  "player_last_name": "Doe",
  "name": "Team Awesome",
  "summary_overall_points": 1543,
  "summary_overall_rank": 245678,
  "summary_event_points": 85,
  "summary_event_rank": 1234567,
  "current_event": 15,
  "started_event": 1,
  "favourite_team": 1
}
```

**Usage:**
- Display manager details
- Show overall rank
- Get current gameweek points

---

### 4. Manager History (Gameweek-by-Gameweek)
**Endpoint:** `GET /api/entry/{manager_id}/history/`
**Authentication:** None required
**Purpose:** Returns detailed gameweek history and chip usage

**Example:** `https://fantasy.premierleague.com/api/entry/789012/history/`

**Response Structure:**
```json
{
  "current": [
    {
      "event": 1,
      "points": 65,
      "total_points": 65,
      "rank": 2345678,
      "rank_sort": 2345678,
      "overall_rank": 2345678,
      "bank": 5,
      "value": 1000,
      "event_transfers": 0,
      "event_transfers_cost": 0,
      "points_on_bench": 12
    },
    {
      "event": 2,
      "points": 78,
      "total_points": 143,
      "rank": 1234567,
      "rank_sort": 1234567,
      "overall_rank": 1234567,
      "bank": 10,
      "value": 1005,
      "event_transfers": 1,
      "event_transfers_cost": 0,
      "points_on_bench": 8
    }
  ],
  "chips": [
    {
      "name": "wildcard",
      "time": "2024-09-15T10:30:00Z",
      "event": 5
    }
  ],
  "past": []
}
```

**Usage:**
- Calculate gameweek winners
- Display historical performance
- Show points progression

---

### 5. Manager Transfers
**Endpoint:** `GET /api/entry/{manager_id}/transfers/`
**Authentication:** None required
**Purpose:** Returns all transfers made by manager this season

**Example:** `https://fantasy.premierleague.com/api/entry/789012/transfers/`

**Response Structure:**
```json
[
  {
    "element_in": 234,
    "element_in_cost": 85,
    "element_out": 123,
    "element_out_cost": 90,
    "entry": 789012,
    "event": 2,
    "time": "2024-08-23T18:45:00Z"
  },
  {
    "element_in": 456,
    "element_in_cost": 105,
    "element_out": 234,
    "element_out_cost": 85,
    "entry": 789012,
    "event": 3,
    "time": "2024-08-30T19:00:00Z"
  }
]
```

**Note:**
- `element_in` and `element_out` are player IDs
- Use `/api/bootstrap-static/` to map IDs to player names
- Costs are in tenths (85 = £8.5m)

**Usage:**
- Display transfer history
- Track transfer activity per gameweek
- Analyze transfer strategies

---

### 6. Gameweek Team Selection (Optional)
**Endpoint:** `GET /api/entry/{manager_id}/event/{event_id}/picks/`
**Authentication:** None required
**Purpose:** Returns manager's team selection for a specific gameweek

**Example:** `https://fantasy.premierleague.com/api/entry/789012/event/15/picks/`

**Response Structure:**
```json
{
  "active_chip": null,
  "automatic_subs": [],
  "entry_history": {
    "event": 15,
    "points": 85,
    "total_points": 1543,
    "rank": 1234567,
    "event_transfers": 1,
    "event_transfers_cost": 4,
    "points_on_bench": 12
  },
  "picks": [
    {
      "element": 123,
      "position": 1,
      "multiplier": 1,
      "is_captain": false,
      "is_vice_captain": false
    }
  ]
}
```

**Usage (future enhancement):**
- Show team composition
- Display captain choices
- Analyze bench decisions

---

## API Request Best Practices

### Caching Strategy
```typescript
// Cache for 5 minutes (300 seconds)
const CACHE_DURATION = 300;

// bootstrap-static changes rarely - cache for 1 hour
const BOOTSTRAP_CACHE = 3600;

// League standings update frequently - cache for 2 minutes during active gameweek
const LEAGUE_CACHE = 120;
```

### Error Handling
- **404:** Manager/league doesn't exist or is private
- **500:** FPL API is down (happens during heavy traffic)
- **429:** Too many requests (unofficial, but possible)

**Retry Logic:**
```typescript
// Exponential backoff for failed requests
// Retry 3 times with 1s, 2s, 4s delays
```

### Rate Limiting
- No official rate limits documented
- **Recommended:** Max 1 request per second per endpoint
- Use caching aggressively
- Batch requests when possible

---

## Implementation Plan

### Phase 1: Core Data Fetching
1. ✅ Document API endpoints
2. ⬜ Create TypeScript interfaces
3. ⬜ Implement `fetchBootstrapStatic()`
4. ⬜ Implement `fetchLeagueStandings(leagueId)`
5. ⬜ Implement `fetchManagerHistory(managerId)`
6. ⬜ Implement `fetchManagerTransfers(managerId)`

### Phase 2: Caching Layer
- In-memory cache with TTL
- React Router loader-based caching
- Consider using React Query (Phase 4)

### Phase 3: Error Handling
- Custom error types
- Retry logic
- Fallback UI states

---

## Example Usage in React Router Loader

```typescript
// app/routes/_index.tsx
import { getEnvConfig } from "~/config/env";
import { fetchLeagueStandings } from "~/lib/fpl-api/client";

export async function loader() {
  const { fplLeagueId } = getEnvConfig();

  if (!fplLeagueId) {
    throw new Response("League ID not configured", { status: 500 });
  }

  try {
    const standings = await fetchLeagueStandings(fplLeagueId);
    return { standings };
  } catch (error) {
    throw new Response("Failed to fetch league data", { status: 500 });
  }
}
```

---

## Data Relationships

```
bootstrap-static
├── events[] (gameweeks)
├── teams[] (PL teams)
└── elements[] (players)

league standings
├── league info
└── results[] (managers)
    └── entry (manager_id) → links to manager endpoints

manager entry
└── id (manager_id)

manager history
├── current[] (gameweek results)
│   └── event (gameweek_id) → links to bootstrap-static.events
└── chips[] (chip usage)

manager transfers
└── element_in/out → links to bootstrap-static.elements
```

---

## Testing Endpoints

### Test League (Public Example)
- League ID: `314` (Community league, publicly accessible)
- Use for integration tests

### Test Manager
- Any manager in your league works
- Get manager IDs from league standings endpoint

### Testing Script
```bash
# Test bootstrap-static
curl https://fantasy.premierleague.com/api/bootstrap-static/ | jq '.events[0]'

# Test league standings
curl https://fantasy.premierleague.com/api/leagues-classic/1313411/standings/ | jq '.standings.results[0]'

# Test manager history
curl https://fantasy.premierleague.com/api/entry/789012/history/ | jq '.current[0]'
```

---

## Known Issues & Gotchas

### CORS
- ✅ Solved by using React Router loaders (server-side)
- ❌ Cannot call from `useEffect` or client-side fetch

### Private Leagues
- May return 404 if league is private
- No authentication method documented for private leagues
- Assume public leagues only

### Player ID Mapping
- Player IDs in transfers don't include names
- Must cross-reference with `bootstrap-static.elements`
- Cache the bootstrap data for lookups

### Gameweek Timing
- `is_current` vs `is_next` can be confusing during deadline
- Use `finished: true` to identify completed gameweeks
- Current gameweek may still be in progress

---

## Community Resources

### Documentation
- [Oliver Looney's FPL API Guide](https://www.oliverlooney.com/blogs/FPL-APIs-Explained) - Comprehensive endpoint reference
- [FPL Postman Collection](https://www.postman.com/fplassist/fpl-assist/collection/zqlmv01/fantasy-premier-league-api) - Interactive API testing
- [GitHub: vaastav/Fantasy-Premier-League](https://github.com/vaastav/Fantasy-Premier-League) - Historical data repository

### Libraries
- [fpl (Python)](https://fpl.readthedocs.io/) - Async Python wrapper
- [jeppe-smith/fpl-api (TypeScript)](https://github.com/jeppe-smith/fpl-api) - TypeScript types

### Updates
- Follow FPL subreddit for API changes
- Monitor community GitHub repos for updates
- Test endpoints at start of each season

---

## Next Steps

1. ✅ API endpoints documented
2. ⬜ Create TypeScript interfaces based on response structures
3. ⬜ Implement client functions with proper error handling
4. ⬜ Add unit tests for each client function
5. ⬜ Test with real league data (League ID: 1313411)

---

**Status:** Phase 1, Task 1 Complete ✅
