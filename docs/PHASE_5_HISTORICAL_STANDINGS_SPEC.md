# Phase 5: Historical League Standings (Gameweek Navigator)

## 🎯 Feature Overview
Allow users to navigate through gameweeks and see the league standings as they were at that specific point in time. This creates a "time machine" experience where users can relive the league's evolution week by week.

## 📊 User Story
**As a** league member,
**I want** to view historical league standings for any gameweek,
**So that** I can see how rankings changed over time and relive exciting moments.

## ✨ Acceptance Criteria
- [ ] View league standings for any completed gameweek
- [ ] Navigate between gameweeks (previous/next buttons or dropdown)
- [ ] See rank changes from previous gameweek
- [ ] See gameweek points and total points for each manager
- [ ] Highlight gameweek winner (most points scored that week)
- [ ] URL parameter support for sharing specific gameweeks (e.g., `/standings?gw=5`)
- [ ] Responsive design for mobile/desktop
- [ ] Clear indication of current vs historical data

## 📐 Data Structure

### Available Data (Already Fetched)
From `FPLManagerGameweek`:
```typescript
{
  event: number;          // Gameweek number (1, 2, 3...)
  points: number;         // Points scored in THIS gameweek
  total_points: number;   // Cumulative points up to this gameweek
  rank: number;           // League rank at this gameweek
  rank_sort: number;      // Tiebreaker rank
  overall_rank: number;   // Global FPL rank
}
```

### Data Transformation
We need to aggregate all managers' data for a specific gameweek:

```typescript
interface GameweekStanding {
  managerName: string;
  teamName: string;
  rank: number;
  prevRank: number | null;  // Rank in previous gameweek
  rankChange: number;       // Calculated: prevRank - rank
  gameweekPoints: number;   // Points scored this week
  totalPoints: number;      // Cumulative points
  isGameweekWinner: boolean; // Highest points this week
}

interface GameweekLeagueData {
  gameweekNumber: number;
  standings: GameweekStanding[];
  averagePoints: number;     // Average GW points across all managers
  highestPoints: number;     // Highest GW points
  finishedDate?: string;     // From bootstrap-static events
}
```

## 🎨 UI Design

### Option 1: New Route `/standings` (Recommended)
```
┌─────────────────────────────────────────────────────────┐
│ 🏆 Historical League Standings                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Gameweek Selector                                 │  │
│  │                                                    │  │
│  │  [◄ Prev]  Gameweek 5  [Next ►]                   │  │
│  │            (Deadline: Oct 1, 2024)                 │  │
│  │                                                    │  │
│  │  Average Points: 54 | Highest: 92 (Alice)         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Rank │ Manager      │ GW Pts │ Total │ Change    │  │
│  ├──────┼──────────────┼────────┼───────┼───────────┤  │
│  │  👑1 │ Alice        │   92 ⭐│  543  │ ↑ +2      │  │
│  │  🥈2 │ Bob          │   76   │  521  │ = 0       │  │
│  │  🥉3 │ Charlie      │   68   │  512  │ ↓ -1      │  │
│  │   4  │ Diana        │   65   │  498  │ ↑ +1      │  │
│  │   5  │ Eve          │   54   │  487  │ ↓ -2      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  💡 Tip: Share this gameweek with others!               │
│     /standings?gw=5                                     │
└─────────────────────────────────────────────────────────┘
```

### Option 2: Enhanced Existing Route `/gameweeks`
Add a "Historical Standings" tab that shows the table view alongside the existing grid view.

### Option 3: Modal/Overlay
Add a "View League Standings" button to each gameweek in the current grid view, opening a modal with the table.

## 🔧 Technical Implementation

### Component Structure
```
app/
├── components/
│   ├── GameweekNavigator/
│   │   ├── GameweekNavigator.tsx
│   │   └── GameweekNavigator.test.tsx
│   └── HistoricalLeagueTable/
│       ├── HistoricalLeagueTable.tsx
│       └── HistoricalLeagueTable.test.tsx
├── routes/
│   ├── standings.tsx              (NEW - recommended)
│   └── standings.test.tsx
└── utils/
    ├── historical-standings.ts     (Data aggregation logic)
    └── historical-standings.test.ts
```

### Key Functions

#### 1. `calculateHistoricalStandings()`
```typescript
export function calculateHistoricalStandings(
  managers: ManagerGameweekData[],
  gameweekNumber: number
): GameweekLeagueData {
  // 1. Extract each manager's data for this specific gameweek
  // 2. Sort by rank
  // 3. Calculate rank changes from previous gameweek
  // 4. Determine gameweek winner (highest points)
  // 5. Calculate statistics (average, highest points)

  return {
    gameweekNumber,
    standings: [...],
    averagePoints: ...,
    highestPoints: ...
  };
}
```

#### 2. `getAvailableGameweeks()`
```typescript
export function getAvailableGameweeks(
  managers: ManagerGameweekData[]
): number[] {
  // Return list of gameweeks that have data
  // Example: [1, 2, 3, 4, 5, 6] if 6 gameweeks have been played
}
```

### Route Implementation (`app/routes/standings.tsx`)

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const gwParam = url.searchParams.get("gw");

  const config = getEnvConfig();
  const leagueData = await fetchLeagueStandings(config.fplLeagueId);

  // Fetch all managers' histories (same as gameweeks route)
  const managers = await Promise.all(
    leagueData.standings.results.map(async (manager) => {
      const history = await fetchManagerHistory(manager.entry.toString());
      return {
        name: manager.player_name,
        teamName: manager.entry_name,
        gameweeks: history.current,
      };
    })
  );

  // Determine which gameweek to show
  const availableGameweeks = getAvailableGameweeks(managers);
  const selectedGameweek = gwParam
    ? parseInt(gwParam, 10)
    : availableGameweeks[availableGameweeks.length - 1]; // Default to latest

  // Calculate historical standings
  const historicalData = calculateHistoricalStandings(
    managers,
    selectedGameweek
  );

  return {
    historicalData,
    availableGameweeks,
    selectedGameweek,
  };
}
```

## 🎯 Features Breakdown

### MVP Features (Phase 5A)
1. **Basic Historical Table**
   - Display standings for a specific gameweek
   - Show rank, manager name, GW points, total points
   - Gameweek selector (dropdown or prev/next buttons)

2. **Navigation**
   - Previous/Next gameweek buttons
   - URL parameter support (`?gw=5`)

3. **Visual Enhancements**
   - Crown emoji for #1, medals for top 3
   - Gameweek winner badge (⭐ for highest GW points)
   - Rank change indicators (↑↓=)

### Enhanced Features (Phase 5B - Optional)
4. **Statistics Panel**
   - Average points for the gameweek
   - Highest scoring team
   - Lowest scoring team
   - Point spread (max - min)

5. **Comparison View**
   - Side-by-side view of two gameweeks
   - Animated transitions between gameweeks

6. **Gameweek Info**
   - Deadline date/time
   - Which chips were played
   - Average global points

## 🧪 Testing Strategy

### Unit Tests
```typescript
// utils/historical-standings.test.ts
describe("calculateHistoricalStandings", () => {
  it("should calculate standings for a specific gameweek");
  it("should sort managers by rank");
  it("should calculate rank changes from previous gameweek");
  it("should identify gameweek winner");
  it("should handle tied gameweek winners");
  it("should calculate average points");
  it("should handle first gameweek (no previous rank)");
});

// components/HistoricalLeagueTable.test.tsx
describe("HistoricalLeagueTable", () => {
  it("should render all managers");
  it("should show rank change indicators");
  it("should highlight gameweek winner");
  it("should show crown for rank 1");
  it("should handle empty data");
});

// components/GameweekNavigator.test.tsx
describe("GameweekNavigator", () => {
  it("should show current gameweek");
  it("should disable prev button on gameweek 1");
  it("should disable next button on latest gameweek");
  it("should call onGameweekChange when navigating");
  it("should show gameweek info");
});
```

## 📋 Implementation Tasks

### Phase 5A: Basic Historical Standings (8 tasks)
- [ ] Create `utils/historical-standings.test.ts`
- [ ] Implement `utils/historical-standings.ts` (calculateHistoricalStandings, getAvailableGameweeks)
- [ ] Create `components/GameweekNavigator/GameweekNavigator.test.tsx`
- [ ] Implement `components/GameweekNavigator/GameweekNavigator.tsx`
- [ ] Create `components/HistoricalLeagueTable/HistoricalLeagueTable.test.tsx`
- [ ] Implement `components/HistoricalLeagueTable/HistoricalLeagueTable.tsx`
- [ ] Create `routes/standings.test.tsx`
- [ ] Implement `routes/standings.tsx` with loader

### Phase 5B: Enhanced Features (Optional - 4 tasks)
- [ ] Add statistics panel to HistoricalLeagueTable
- [ ] Add gameweek metadata (deadline, chips played)
- [ ] Implement animated transitions between gameweeks
- [ ] Add comparison view (side-by-side gameweeks)

## 🎨 UI Mockup Examples

### Mobile View
```
┌─────────────────────┐
│ ◄ GW 5 ►            │
│ Oct 1, 2024         │
├─────────────────────┤
│ Avg: 54 | Max: 92   │
├─────────────────────┤
│ 👑1 Alice      ↑+2  │
│    92⭐ pts (543)    │
├─────────────────────┤
│ 🥈2 Bob        =    │
│    76 pts (521)     │
├─────────────────────┤
│ 🥉3 Charlie    ↓-1  │
│    68 pts (512)     │
└─────────────────────┘
```

### Desktop View (Full Table)
Wide enough to show all columns clearly with good spacing.

## 🔄 Integration Points

### Navigation Updates
Add new link to main navigation:
```tsx
<Link to="/standings">Historical Standings</Link>
```

### Cross-linking
- From `/gameweeks`: "View league standings for this gameweek" button
- From `/`: "View historical standings" link in league table

### URL Sharing
Users can share specific gameweeks:
- `/standings?gw=1` - Opening gameweek
- `/standings?gw=5` - Any specific gameweek
- `/standings` - Latest gameweek (default)

## 💡 User Benefits

1. **Relive Exciting Moments**: See when a manager made a big jump
2. **Historical Context**: Understand league progression
3. **Strategy Analysis**: Review what worked in past gameweeks
4. **Shareable**: Send links to specific memorable gameweeks
5. **Storytelling**: Great for league newsletters or recaps

## 🚀 Future Enhancements

- **Trend Graphs**: Show rank progression over time
- **Heatmap**: Color-code performance across all gameweeks
- **Annotations**: Add notes/comments to specific gameweeks
- **Export**: Download historical data as CSV/PDF
- **League Milestones**: Highlight significant events (biggest point swing, etc.)

## ⚡ Performance Considerations

- Data is already fetched for other routes (reuse)
- Calculation happens on the server (loader)
- Client-side navigation between gameweeks (no refetch)
- Could add caching for frequently viewed gameweeks

## 🎯 Success Metrics

- Users navigate to `/standings` route
- Average gameweeks viewed per session
- URL sharing frequency (gameweek-specific links)
- Time spent on historical standings page

---

**Estimated Complexity**: Medium
**Estimated Tasks**: 8-12
**Dependencies**: None (uses existing data)
**Impact**: High (frequently requested feature for league sites)
