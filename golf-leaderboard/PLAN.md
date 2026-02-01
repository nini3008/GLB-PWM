# Product Improvement Plan

## Philosophy

The app's core loop is solid: create season → create games → submit scores → view leaderboard. Rather than adding tangential features, these improvements focus on making that core loop **stickier** and filling the most painful UX gaps.

Organized into 3 tiers by impact.

---

## Tier 1: High Impact, Core Experience

### 1. Dashboard Activity Feed & Quick Stats
**Why:** The dashboard is just a grid of buttons — players have no reason to open the app unless they need to do something specific. A feed gives them a reason to check in daily.

**What:**
- Show the player's current rank, points, and recent trend (up/down arrow)
- Activity feed: "John submitted 82 at Pine Valley", "New game created: Sunday Round", "You earned 'Hot Streak' badge"
- Quick action: "You have 1 unsubmitted score" prompt if a game exists they haven't scored in

**Files to change:**
- `src/components/dashboard/DashboardView.tsx` — add stats bar + feed section
- `src/lib/supabase/client.ts` — add `getRecentActivity(seasonId)` and `getPlayerQuickStats(userId, seasonId)` functions
- New: `src/components/dashboard/ActivityFeed.tsx`
- New: `src/components/dashboard/QuickStats.tsx`

**Risks:** Requires a new Supabase view or RPC function to aggregate activity efficiently. Without an index, this could be slow on large datasets.

**Verification:** Load dashboard, see current rank/points and 5-10 recent activities. Confirm it updates after submitting a new score.

---

### 2. URL-Based Routing
**Why:** The app uses `useState` for navigation. Users can't bookmark pages, share links, or use browser back/forward. This is the single biggest UX gap.

**What:**
- Migrate from state-based views to Next.js App Router pages
- Routes: `/dashboard`, `/leaderboard`, `/scores/enter`, `/scores/view`, `/profile`, `/admin/*`
- Preserve session-based auth gating

**Files to change:**
- `app/page.tsx` — becomes redirect to `/dashboard`
- New: `app/(authenticated)/dashboard/page.tsx`, `app/(authenticated)/leaderboard/page.tsx`, etc.
- `src/components/GolfLeaderboardApp.tsx` — remove view state machine, becomes a layout wrapper
- All components that call `onReturn` or `setCurrentView` — replace with `router.push()`

**Risks:** This is the largest refactor. Every component that uses `onReturn` prop needs updating. Auth protection needs a layout-level guard. Must handle the reset-password flow carefully.

**Verification:** Every view accessible via URL. Browser back/forward works. Deep links work. Auth redirect works. No regressions in any flow.

---

### 3. Player-to-Player Comparison
**Why:** Competition is the core motivation. Players want to see how they stack up against specific opponents, not just the whole leaderboard.

**What:**
- "Compare" button on leaderboard rows and player cards
- Side-by-side view: games played together, head-to-head record, avg score comparison, points per game trend
- Chart showing score trends over time for both players

**Files to change:**
- New: `src/components/leaderboard/PlayerComparison.tsx`
- `src/components/leaderboard/LeaderboardTable.tsx` — add compare button
- `src/components/leaderboard/PlayerCard.tsx` — add compare button
- `src/lib/supabase/client.ts` — add `getHeadToHead(player1Id, player2Id, seasonId?)` function

**Risks:** Need to query overlapping games efficiently. Chart library adds bundle size (consider lightweight option like recharts or a simple SVG).

**Verification:** Select two players, see comparison data. Verify it handles edge cases: no shared games, one player with 0 scores, same player selected twice.

---

### 4. Score Submission Reminders / Pending Scores
**Why:** The biggest drop-off is players forgetting to submit scores. The app has no way to nudge them.

**What:**
- On dashboard: "You have 2 games without scores" banner with direct links
- Query: games in the player's active seasons where they haven't submitted and game date has passed
- Optional: admin can set a submission deadline per game, show countdown

**Files to change:**
- `src/components/dashboard/DashboardView.tsx` — add pending scores banner
- `src/lib/supabase/client.ts` — add `getPendingGames(userId)` function
- `src/lib/supabase/types.ts` — add optional `submission_deadline` to games table
- New migration: add `submission_deadline` column to games

**Risks:** "Pending" logic needs to correctly handle: games with no deadline, games the player wasn't present for (they shouldn't be nagged). May need a "skip this game" option.

**Verification:** Create a game, don't submit score, see it on dashboard. Submit score, it disappears. Verify no false positives for games in seasons the player hasn't joined.

---

## Tier 2: Medium Impact, Polish

### 5. Score Trends & Personal Analytics
**Why:** Players are motivated by seeing improvement. Currently they get a flat list of scores with no context.

**What:**
- Profile page "Scores" tab: add a simple line chart showing score over time
- Stats: best score, worst score, improvement trend, most-played course, best course
- Handicap history graph (requires storing historical values)

**Files to change:**
- `src/components/player/ProfileForm.tsx` — add chart + stats section to scores tab
- New: `src/components/player/ScoreChart.tsx`
- New: `src/components/player/PlayerStats.tsx`
- `src/lib/supabase/client.ts` — add `getPlayerStats(userId, seasonId?)`
- New migration: `handicap_history` table (userId, handicap, calculated_at)
- `src/lib/utils/handicap.ts` — save to history on recalculation

**Risks:** Chart library dependency. Handicap history requires a migration and backfill for existing data.

**Verification:** View profile with 5+ scores, see chart and stats. Verify handicap history populates after recalculation.

---

### 6. Course Management UI
**Why:** Currently courses can only be added directly in the database. Admins need a UI.

**What:**
- Admin view: list all courses, add new course (name, location, par), edit existing
- Used during game creation — currently the course dropdown only shows DB entries

**Files to change:**
- New: `src/components/admin/ManageCoursesView.tsx`
- `src/components/GolfLeaderboardApp.tsx` — add route/view
- `src/components/dashboard/DashboardView.tsx` — add admin card
- `src/lib/supabase/client.ts` — add `createCourse()`, `updateCourse()`, `getCourses()`

**Risks:** Low risk. Straightforward CRUD. Need to prevent duplicate course names.

**Verification:** Admin creates course, it appears in "Create Game" course dropdown. Edit course par, verify existing scores aren't affected.

---

### 7. Achievement Progress Tracking
**Why:** Achievements exist but players can't see progress toward unearned ones. This removes the motivational "almost there" feeling.

**What:**
- Show all possible achievements (not just earned ones)
- For unearned: show progress bar (e.g., "Games Played: 3/5")
- Lock icon for unearned, with description of how to earn

**Files to change:**
- `src/components/player/BadgesDisplay.tsx` — show all achievements with progress
- `src/lib/utils/achievements.ts` — add `getAchievementProgress(userId, seasonId?)` that returns progress for each achievement
- `src/lib/supabase/client.ts` — add query for all possible achievements with user progress

**Risks:** Some achievements (like "hot_streak") are harder to show progress for. Need to decide: show "2 consecutive wins" or just hide progress for complex ones.

**Verification:** View achievements tab, see both earned and locked achievements. Progress bars update after submitting scores.

---

### 8. Game Notes & Round Recap
**Why:** Golf is social. Players want to remember the round, not just the number. Currently notes are admin-only editable.

**What:**
- Let players add notes during score submission (weather, memorable shots, etc.)
- After all scores are in for a round, show a "Round Recap" card: who played, who won, notable scores
- Optional: players can add a comment/reaction to each round

**Files to change:**
- `src/components/player/EnterScoreForm.tsx` — notes field already exists, make it more prominent
- New: `src/components/player/RoundRecap.tsx`
- `src/lib/supabase/client.ts` — add `getRoundRecap(gameId)`

**Risks:** Low risk. The notes field exists in the DB already. Round recap is read-only aggregation.

**Verification:** Submit score with notes, view round recap, see all player scores and notes for that round.

---

## Tier 3: Nice to Have

### 9. Season Summary & Awards
**Why:** When a season ends, there's no ceremony. A summary page would make season endings feel meaningful.

**What:**
- Auto-generated season summary when a season is deactivated
- Awards: MVP, Most Improved, Most Consistent, Best Single Round
- Shareable image/card

**Files:** New components + new Supabase function to aggregate season stats.

---

### 10. QR Codes for Round/Season Codes
**Why:** Typing codes manually is friction. A QR code displayed after creation + scanner on join would be smoother.

**Files:** Add QR generation to CreateGameForm + CreateSeasonForm success states. Add QR scanner option to JoinSeasonForm + EnterScoreForm.

---

### 11. Real-time Leaderboard Updates
**Why:** During active rounds, the leaderboard is stale until refresh.

**Files:** Add Supabase Realtime subscription to LeaderboardTable and activity feed.

---

## Recommended Implementation Order

1. **Dashboard Activity Feed & Quick Stats** (#1) — Immediate engagement boost, moderate effort
2. **Score Submission Reminders** (#4) — Directly improves score submission rate
3. **Achievement Progress** (#7) — Leverages existing system, moderate effort
4. **Course Management UI** (#6) — Unblocks admins, low effort
5. **Score Trends & Analytics** (#5) — Retention feature, moderate effort
6. **Player Comparison** (#3) — Fun social feature, moderate effort
7. **Game Notes & Round Recap** (#8) — Social polish, low effort
8. **URL-Based Routing** (#2) — Highest effort, but foundational for growth (shareable links)
9. **Season Summary** (#9), **QR Codes** (#10), **Real-time** (#11) — Polish

Items 1-4 would have the biggest impact on daily engagement and could be implemented independently.
