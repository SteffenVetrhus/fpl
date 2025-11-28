# 🎯 Phase 4: Enhanced Features & Bug Fixes

## Overview
Improve gameweek winner logic and add player filtering capabilities to make the app more useful and accurate.

---

## 🐛 Bug Fixes

### Issue #1: Gameweek Winner Logic is Incorrect
**Current Behavior:**
- Winner is determined by `rank: 1` which is the league rank at that point in the season
- This shows the current overall league leader, NOT the gameweek winner

**Expected Behavior:**
- Winner should be whoever scored the MOST POINTS in that specific gameweek within the league
- Should compare `event_total` (gameweek points) across all league members for that GW
- Multiple winners possible if tied on points

**Fix Required:**
- Create utility function `calculateGameweekWinner(managers, gameweekNumber)`
- Update `GameweekHistory` component to highlight correct winner
- Update `GameweekCard` to show winner badge based on league points, not rank

---

## ✨ New Features

### Feature #1: Player Tags
**User Story:**
As a league member, I want to tag/label managers (e.g., "Friends", "Family", "Work") so I can filter and focus on specific groups.

**Implementation:**
- Add tags support to manager profiles
- Store tags in local storage (no backend needed for MVP)
- Visual tag badges with colors

### Feature #2: Single Player Gameweek View
**User Story:**
As a league member, I want to view gameweek history for ONE player at a time, so I'm not overwhelmed by all players' data at once.

**Implementation:**
- Add player selector/dropdown on gameweeks page
- Default: Show first player (current leader)
- Switch between players without page reload
- Smooth transitions
- Show player's total wins, average points, best/worst gameweek

---

## 📋 Detailed Task Breakdown

### Phase 4A: Fix Gameweek Winner Logic (6 tasks)
**Priority: HIGH - This is a critical bug**

1. **Create utility test for gameweek winner calculation**
   - File: `app/utils/gameweek-winner.test.ts`
   - Test cases:
     - Single winner with highest points
     - Multiple winners (tied on points)
     - Empty gameweek data
     - Edge case: All managers scored same points

2. **Implement gameweek winner utility**
   - File: `app/utils/gameweek-winner.ts`
   - Function: `calculateGameweekWinner(gameweeks: GameweekData[], gameweekNumber: number)`
   - Returns: Array of manager IDs who won (handles ties)

3. **Update GameweekCard component tests**
   - File: `app/components/GameweekCard/GameweekCard.test.tsx`
   - New prop: `isWinner` (boolean)
   - Test winner styling based on prop, not rank

4. **Update GameweekCard component**
   - File: `app/components/GameweekCard/GameweekCard.tsx`
   - Add `isWinner` prop
   - Show winner badge when `isWinner === true`
   - Remove rank-based winner logic

5. **Update GameweekHistory component tests**
   - File: `app/components/GameweekHistory/GameweekHistory.test.tsx`
   - Test that correct manager is highlighted as winner
   - Test tied winners both get highlighted

6. **Update GameweekHistory component**
   - File: `app/components/GameweekHistory/GameweekHistory.tsx`
   - Use `calculateGameweekWinner()` to determine winners
   - Pass `isWinner` to each `GameweekCard`
   - Add winner summary (e.g., "Alice won 5 gameweeks, Bob won 3")

### Phase 4B: Player Filtering & Single View (8 tasks)

7. **Create player selector component test**
   - File: `app/components/PlayerSelector/PlayerSelector.test.tsx`
   - Test rendering all players
   - Test selection changes
   - Test showing current selection

8. **Implement player selector component**
   - File: `app/components/PlayerSelector/PlayerSelector.tsx`
   - Dropdown with all league members
   - Shows team name and current rank
   - Search/filter capability

9. **Create player stats component test**
   - File: `app/components/PlayerStats/PlayerStats.test.tsx`
   - Test showing total wins
   - Test showing average points
   - Test showing best/worst gameweek

10. **Implement player stats component**
    - File: `app/components/PlayerStats/PlayerStats.tsx`
    - Summary card: Total GWs won, avg points, best GW, worst GW
    - Visual indicators (🏆 for wins, 📈 for trends)

11. **Update gameweeks route test**
    - File: `app/routes/gameweeks.test.tsx`
    - Test single player view by default
    - Test switching between players
    - Test player stats display

12. **Update gameweeks route**
    - File: `app/routes/gameweeks.tsx`
    - Add player selector at top
    - Show only selected player's gameweeks
    - Show player stats summary
    - Add URL parameter for selected player (e.g., `/gameweeks?player=123456`)

13. **Add player tags utility test**
    - File: `app/utils/player-tags.test.ts`
    - Test saving tags to localStorage
    - Test loading tags from localStorage
    - Test tag color assignment

14. **Implement player tags utility**
    - File: `app/utils/player-tags.ts`
    - Functions: `saveTags()`, `loadTags()`, `getTagColor()`
    - Interface: `PlayerTag { managerId: string, tags: string[], color: string }`

---

## 🎨 UI/UX Improvements

### Gameweek Winner Display
```
Before (Incorrect):
┌─────────────────────────────┐
│ 🏆 GAMEWEEK WINNER 🏆      │ ← Shows rank 1 (overall leader)
│ Gameweek 5                  │
│ 87 pts  |  Rank #1          │
└─────────────────────────────┘

After (Correct):
┌─────────────────────────────┐
│ ⭐ GAMEWEEK WINNER ⭐       │ ← Shows highest scorer THIS gameweek
│ Gameweek 5                  │
│ 87 pts  |  League Rank #2   │
│ 🎯 Highest in league!       │
└─────────────────────────────┘
```

### Player Selector
```
┌─────────────────────────────────────────┐
│ 👤 View Player:  [Alice Johnson ▼]     │
├─────────────────────────────────────────┤
│ Team: Alice's Aces                      │
│ 🏆 5 GW Wins | 📊 Avg: 67 pts          │
│ 🔥 Best: 92 pts (GW 1)                 │
│ 💤 Worst: 42 pts (GW 8)                │
└─────────────────────────────────────────┘

[Gameweek Cards for Alice only...]
```

---

## 🧪 Testing Strategy

### Unit Tests
- ✅ Gameweek winner calculation with various scenarios
- ✅ Player selector renders and handles selection
- ✅ Player stats calculations are correct
- ✅ Tag storage/retrieval works correctly

### Integration Tests
- ✅ Gameweek page shows correct winner badges
- ✅ Switching players updates view correctly
- ✅ Winner summary counts are accurate

### Edge Cases
- ✅ Multiple tied winners in same gameweek
- ✅ Player with zero gameweeks played
- ✅ All players scored same points (all winners)
- ✅ No data for selected gameweek

---

## 📊 Success Metrics

### Bug Fix Success
- [x] Winner badge appears on correct manager (highest GW points)
- [x] Tied winners both get highlighted
- [x] Winner summary shows accurate counts

### Feature Success
- [x] Can select any player and see only their gameweeks
- [x] Player stats show correct calculations
- [x] Smooth switching between players (< 100ms)
- [x] URL updates with selected player (shareable links)

---

## 🚀 Implementation Order

**Week 1: Bug Fix (Critical)**
1. Days 1-2: Gameweek winner utility (tasks 1-2)
2. Days 3-4: Update components (tasks 3-6)
3. Day 5: Testing and validation

**Week 2: Single Player View**
1. Days 1-2: Player selector (tasks 7-8)
2. Days 3-4: Player stats + route updates (tasks 9-12)
3. Day 5: Polish and testing

**Week 3: Player Tags (Optional Enhancement)**
1. Days 1-2: Tag utility (tasks 13-14)
2. Days 3-5: UI integration and polish

---

## 💡 Future Considerations

### Beyond Phase 4
- **Head-to-Head Comparison**: Compare any two players side-by-side
- **League Insights**: "Most consistent player", "Transfer king", "Dark horse"
- **Notifications**: Alert when you win a gameweek
- **Export Data**: Download league history as CSV
- **Mobile App**: React Native version

### Technical Debt
- Add React Query for better caching
- Implement skeleton loaders
- Add error boundaries
- PWA support for offline viewing

---

## 📝 Notes

- All features follow existing Atomic TDD methodology
- Maintain 100% test coverage
- Keep bundle size < 200KB
- Ensure dark mode works for all new components
- Mobile-first responsive design
