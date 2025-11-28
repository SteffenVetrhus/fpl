# FPL Features Specification
## Advanced Features Roadmap

### Overview
This document serves as the technical specification for advanced "Side Pot" and "Community" features for the FPL application. All features utilize the official FPL API.

### Global Technical Constraints:
- **Rate Limiting**: FPL API is strict. All data fetching logic must sit behind a caching layer (Redis/Vercel KV).
- **Data Freshness**: "Live" features poll `event/{gw}/live/`. Static features poll `bootstrap-static` or `entry/{id}/...`.

---

## 1. Automated "Side Pot" Mini-Games

### 1.1 "Bench Boost" Championship
**Objective**: Leaderboard tracking points scored purely by benched players.

**Data Source**: `entry/{team_id}/event/{gw}/picks/`

**Logic**:
- Fetch picks for the Gameweek
- Identify players where `multiplier: 0` (The Bench)
- Sum points for these players using the live stats endpoint
- **Edge Case**: If a user plays the "Bench Boost" chip, their bench points count toward their main total. Decide if this counts for this mini-game (Recommended: Exclude if chip is active to keep it fair)

**Implementation Priority**: Medium

---

### 1.2 The "Anti-FPL" Table
**Objective**: Lowest score wins. Criteria: Players must play >60 mins.

**Data Source**: `entry/{team_id}/event/{gw}/picks/` + `element-summary/{player_id}/`

**Logic**:
- Filter current Starting XI
- Check `minutes_played > 60` for each player
- Sum points of valid players
- Sort leaderboard Ascending (Lowest score top)

**Implementation Priority**: Medium

---

### 1.3 Last Man Standing (Survival Mode)
**Objective**: Elimination tournament starting GW5.

**Logic**:
- **Trigger**: Post-GW calculations
- Determine the lowest GW score among "Active" participants
- Update database: Mark that `team_id` as `eliminated: true`
- **UI**: Render eliminated teams with grayscale CSS filter / strikethrough

**Storage**: Database table for tournament state

**Implementation Priority**: Low (requires backend state management)

---

### 1.4 "Did I Captain The Wrong Guy?" Meter
**Objective**: Quantify "Captain Regret."

**Logic**:
- Identify User's Captain (`is_captain: true`). Get Points (x2)
- Identify User's Highest Scoring Player (in Starting XI). Calculate Theoretical Points (x2)
- **Formula**: `Regret = (Max_Possible_Points) - (Actual_Captain_Points)`
- **Metric**: "Total Captain Regret" (Season Cumulative)

**Implementation Priority**: High (popular feature, easy to implement)

---

## 2. Advanced Leaderboards

### 2.1 The "Pep Roulette" Award
**Objective**: Track automatic substitutions (autosubs).

**Data Source**: `entry/{team_id}/event/{gw}/picks/` -> `automatic_subs` array

**Logic**:
- Iterate through all completed GWs
- Count length of `automatic_subs` array
- Leaderboard sorts by Highest Count

**Implementation Priority**: High (data already available)

---

### 2.2 "Moneyball" Rankings (ROI)
**Objective**: Efficiency rating (Points per Million).

**Formula**: `ROI = Total_Points / (Team_Value / 10)`

**UI**: Display as a ratio (e.g., "12.5 pts/£m")

**Implementation Priority**: Medium

---

### 2.3 The "Voldemort" Table
**Objective**: Shame the lowest monthly scorer.

**Logic**:
- Aggregate points for the current calendar month (e.g., GWs in October)
- Identify lowest scorer
- **UI Middleware**: When rendering the dashboard, check if `user_id == voldemort_id`
- **Action**: Replace `entry.name` string with "He Who Must Not Be Named"

**Implementation Priority**: Low (fun but not essential)

---

### 2.4 Transfer Market Tycoon
**Objective**: Leaderboard for Team Value.

**Data Source**: `entry/{team_id}/` -> `summary_overall_rank` (contains value data) or transfers endpoint

**Logic**: `Current_Team_Value + Bank`. Sort Descending.

**Implementation Priority**: Medium

---

## 3. Interactive Tools & Rivalry

### 3.1 Live Rivalry Tracker ("The Clencher")
**Objective**: Side-by-side comparison of two teams.

**Key Feature**: "Differentials Only" Mode

**Logic**:
- Fetch Picks for Team A and Team B
- `Intersection = Picks_A ∩ Picks_B`
- `Differentials_A = Picks_A - Intersection`
- `Differentials_B = Picks_B - Intersection`
- Display only the Differentials and their Live Points

**Implementation Priority**: Medium (requires real-time updates)

---

### 3.2 "What If" Machine
**Objective**: Compare current rank vs. "Set and Forget" rank.

**Logic**:
- Fetch GW1 Picks
- Calculate points for GW1 Picks across all subsequent Gameweeks (ignoring transfers/chips)
- Compare `Actual_Total_Points` vs `Zombie_Total_Points`

**Implementation Priority**: High (very interesting feature)

---

### 3.3 The Trophy Cabinet
**Objective**: Badges for arbitrary achievements.

**Storage**: Relational DB Table `user_badges`

**Badges**:
- **The Bus Parker**: Won H2H by 1 point
- **The Psychic**: Captain is a DEF AND `Captain_Goals > 0`
- **The Early Bird**: Transfer timestamp is > 5 days before deadline

**Implementation Priority**: Low (requires backend state)

---

## 4. Community Features

### 4.1 "Wheel of Doom" Widget
**Objective**: Random punishment selector for the weekly loser.

**UI Component**: Canvas/SVG Spinning Wheel

**Inputs**: Array of strings (e.g., "Change Name", "Write Apology Poem")

**Trigger**: Manual click by the lowest scoring user (authenticated)

**Implementation Priority**: Low (fun but requires auth)

---

### 4.2 Smack Talk Board
**Objective**: Comment feed per GW.

**Tech Stack**: Supabase (Postgres + Realtime)

**Schema**:
```sql
CREATE TABLE comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gameweek_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation Priority**: Low (requires backend + auth)

---

## 5. Technical Implementation Strategy

### 5.1 Architecture
- **Backend**: Vercel Serverless Functions / Node.js
- **Database**: Supabase (for User mapping, Badge state, Chat)
- **Caching**: Redis (Upstash) or In-Memory (short TTL)

### 5.2 API Optimization
To avoid rate limits:
- **Bootstrap Data**: Fetch `bootstrap-static` once every 10 minutes
- **Live Scoring**: Poll `event/{gw}/live` once every 60 seconds only during match times
- **Lineups**: Fetch `picks` only on page load or user request; Cache response for the duration of the Gameweek (since picks are locked)

### 5.3 Recommended Implementation Order

**Phase 1 - Quick Wins (High Value, Low Complexity)**:
1. Captain Regret Meter
2. Pep Roulette Award (Autosubs tracking)
3. What If Machine (Set and Forget comparison)

**Phase 2 - Advanced Leaderboards**:
4. Moneyball ROI Rankings
5. Transfer Market Tycoon
6. Bench Boost Championship

**Phase 3 - Interactive Features**:
7. Live Rivalry Tracker
8. Anti-FPL Table

**Phase 4 - Community (Requires Backend)**:
9. Trophy Cabinet
10. Smack Talk Board
11. Last Man Standing
12. Voldemort Table
13. Wheel of Doom

---

## 6. Data Requirements

### Existing Data (Already Fetched)
- ✅ League standings
- ✅ Manager histories
- ✅ Transfer data

### Additional Data Needed
- Gameweek picks (`entry/{team_id}/event/{gw}/picks/`)
- Live player stats (`event/{gw}/live/`)
- Element summaries (`element-summary/{player_id}/`)
- Bootstrap static (for player/team metadata)

### Storage Requirements
For features requiring state:
- User badges
- Tournament elimination status
- Comment history
- Wheel of Doom punishment history

---

## 7. UI/UX Considerations

### New Routes Needed
- `/mini-games` - Hub for all side pot competitions
- `/rivalry` - Head-to-head comparison tool
- `/achievements` - Trophy cabinet
- `/chat` - Smack talk board

### Components Needed
- `CaptainRegretMeter` - Visual gauge/chart
- `AutosubsLeaderboard` - Table component
- `RivalryComparison` - Split view with differentials
- `WheelOfDoom` - SVG/Canvas spinning wheel
- `BadgeCollection` - Grid of achievements
- `CommentFeed` - Real-time chat component

---

## 8. Success Metrics

### Engagement Metrics
- Time spent on mini-games pages
- Rivalry tracker usage frequency
- Comment board activity
- Badge unlock rate

### Technical Metrics
- API cache hit rate
- Page load times
- Error rates on external API calls

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Status**: Specification Draft
