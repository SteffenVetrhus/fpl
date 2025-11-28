# Historical Standings - Example Data

## Scenario: Viewing Gameweek 5

### Raw Data (What We Have)
```javascript
// Manager 1: Alice
{
  gameweeks: [
    { event: 1, points: 65, total_points: 65, rank: 3 },
    { event: 2, points: 72, total_points: 137, rank: 2 },
    { event: 3, points: 78, total_points: 215, rank: 2 },
    { event: 4, points: 56, total_points: 271, rank: 3 },
    { event: 5, points: 92, total_points: 363, rank: 1 },  // ← Viewing this GW
  ]
}

// Manager 2: Bob
{
  gameweeks: [
    { event: 1, points: 78, total_points: 78, rank: 1 },
    { event: 2, points: 68, total_points: 146, rank: 1 },
    { event: 3, points: 71, total_points: 217, rank: 1 },
    { event: 4, points: 82, total_points: 299, rank: 1 },
    { event: 5, points: 62, total_points: 361, rank: 2 },  // ← Viewing this GW
  ]
}

// Manager 3: Charlie
{
  gameweeks: [
    { event: 1, points: 82, total_points: 82, rank: 2 },
    { event: 2, points: 65, total_points: 147, rank: 3 },
    { event: 3, points: 69, total_points: 216, rank: 3 },
    { event: 4, points: 88, total_points: 304, rank: 2 },
    { event: 5, points: 54, total_points: 358, rank: 3 },  // ← Viewing this GW
  ]
}
```

### Transformed Data (What We Display)
```javascript
{
  gameweekNumber: 5,
  standings: [
    {
      managerName: "Alice",
      teamName: "Alice's Aces",
      rank: 1,
      prevRank: 3,
      rankChange: +2,           // Jumped from 3rd to 1st!
      gameweekPoints: 92,       // HIGHEST - Gameweek Winner ⭐
      totalPoints: 363,
      isGameweekWinner: true
    },
    {
      managerName: "Bob",
      teamName: "Bob's Best",
      rank: 2,
      prevRank: 1,
      rankChange: -1,           // Dropped from 1st to 2nd
      gameweekPoints: 62,
      totalPoints: 361,
      isGameweekWinner: false
    },
    {
      managerName: "Charlie",
      teamName: "Charlie's Champions",
      rank: 3,
      prevRank: 2,
      rankChange: -1,           // Dropped from 2nd to 3rd
      gameweekPoints: 54,
      totalPoints: 358,
      isGameweekWinner: false
    }
  ],
  averagePoints: 69.3,
  highestPoints: 92,
  lowestPoints: 54
}
```

### How It Would Display

```
╔══════════════════════════════════════════════════════════╗
║          🏆 Historical League Standings                  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   ┌─────────────────────────────────────────────────┐   ║
║   │  [◄ Gameweek 4]  Gameweek 5  [Gameweek 6 ►]    │   ║
║   │                                                  │   ║
║   │  Average: 69 pts  |  Highest: 92 pts (Alice)   │   ║
║   └─────────────────────────────────────────────────┘   ║
║                                                          ║
║   Rank  Manager          GW Points    Total    Change   ║
║   ────────────────────────────────────────────────────   ║
║   👑 1  Alice                92 ⭐     363     ↑ +2      ║
║                                                          ║
║   🥈 2  Bob                  62       361     ↓ -1      ║
║                                                          ║
║   🥉 3  Charlie              54       358     ↓ -1      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

Story: In Gameweek 5, Alice had an amazing week with 92 points
(38 points above average!), jumping from 3rd place to 1st place
and overtaking both Bob and Charlie. Bob, who had been leading
since Gameweek 1, dropped to 2nd place despite a decent 62 points.
```

## Use Cases

### 1. Reliving Dramatic Moments
```
User navigates to Gameweek 10:
"Oh wow, I remember this! John went from 8th to 2nd place with
a massive 103-point haul. That was the week he triple-captained
Salah!"
```

### 2. Analyzing Trends
```
User cycles through GW 1 → 2 → 3 → 4 → 5:
"Sarah has been consistently finishing 2nd or 3rd every week.
She's the most consistent performer even though she's not #1."
```

### 3. Sharing Highlights
```
User copies URL: /standings?gw=5
Sends to league group chat:
"Remember when Alice had that insane 92-point week? Check this out!"
```

### 4. League Recaps
```
Commissioner writes monthly newsletter:
"Let's review the key moments:
- GW 1: Bob takes early lead
- GW 5: Alice's 92-point masterclass (/standings?gw=5)
- GW 8: Complete reshuffle after DGW
- GW 12: Current standings (/standings?gw=12)"
```

## Navigation Flow

### From Homepage (/)
```
Current League Table
├─ "View Historical Standings" button
└─ Opens /standings (defaults to latest GW)
```

### From Gameweeks (/gameweeks)
```
Alice's Gameweek 5 Card
├─ Shows: 92 points, Rank: 1 ⭐
└─ "View League Standings for GW 5" button
   └─ Opens /standings?gw=5
```

### From Standings (/standings)
```
GameweekNavigator
├─ [◄ Prev] button → /standings?gw=4
├─ Dropdown selector → /standings?gw=[selected]
└─ [Next ►] button → /standings?gw=6
```

## Mobile vs Desktop Views

### Mobile (Stacked Cards)
```
┌──────────────────┐
│ ◄ Gameweek 5 ►   │
├──────────────────┤
│ 👑 #1 (+2)       │
│ Alice            │
│ 92⭐ pts │ 363   │
├──────────────────┤
│ 🥈 #2 (-1)       │
│ Bob              │
│ 62 pts │ 361     │
├──────────────────┤
│ 🥉 #3 (-1)       │
│ Charlie          │
│ 54 pts │ 358     │
└──────────────────┘
```

### Desktop (Full Table)
```
┌────────────────────────────────────────────────────────────┐
│ Rank │ Manager  │ Team Name    │ GW Pts │ Total │ Change  │
├──────┼──────────┼──────────────┼────────┼───────┼─────────┤
│ 👑 1 │ Alice    │ Alice's Aces │   92⭐ │  363  │ ↑ +2    │
│ 🥈 2 │ Bob      │ Bob's Best   │   62   │  361  │ ↓ -1    │
│ 🥉 3 │ Charlie  │ Champs       │   54   │  358  │ ↓ -1    │
└────────────────────────────────────────────────────────────┘
```

## Implementation Complexity

### Easy Parts ✅
- Data already available (no new API calls)
- Sorting and filtering (straightforward)
- UI components (similar to existing LeagueTable)
- Rank change calculation (simple math)

### Medium Complexity ⚠️
- Gameweek navigation logic
- URL parameter handling
- Responsive table design
- Loading states for navigation

### Optional Advanced Features 🚀
- Animated transitions between gameweeks
- Trend charts overlaid on table
- Side-by-side gameweek comparison
- Export to PDF/CSV

## Questions for You

1. **Route Preference**: Do you want this as:
   - A) New route `/standings` (recommended - clean separation)
   - B) Tab/view on existing `/gameweeks` route (integrated)
   - C) Modal/overlay from gameweeks page (minimal navigation)

2. **Navigation Style**: How should users change gameweeks?
   - A) Previous/Next buttons (simple, mobile-friendly)
   - B) Dropdown selector (fast, shows all available GWs)
   - C) Both (most flexible, slightly more complex)
   - D) Timeline slider (cool but more complex)

3. **Default View**: When user visits `/standings` with no params:
   - A) Latest completed gameweek (most recent data)
   - B) Current gameweek (matches live standings)
   - C) Gameweek 1 (chronological start)

4. **Additional Data**: Would you like to show:
   - A) Just rank and points (minimal, clean)
   - B) + Rank changes (adds context)
   - C) + Statistics (average, highest, etc.)
   - D) All of the above (comprehensive)

5. **Priority**: Is this feature:
   - A) High priority (want it ASAP)
   - B) Medium (would be nice to have)
   - C) Low (future enhancement)
