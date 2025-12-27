-- Migration: Fix season_leaderboard view security
-- Changes SECURITY DEFINER to SECURITY INVOKER for proper RLS enforcement
-- Ensures all users can still view the leaderboard

-- Drop the existing view
DROP VIEW IF EXISTS season_leaderboard;

-- Recreate the view with SECURITY INVOKER (uses querying user's permissions)
CREATE VIEW season_leaderboard
WITH (security_invoker = true)
AS
SELECT
    s.id AS season_id,
    s.name AS season_name,
    p.id AS player_id,
    p.username,
    p.profile_image_url,
    COALESCE(COUNT(sc.id), 0) AS games_played,
    COALESCE(SUM(sc.points + sc.bonus_points), 0) AS total_points,
    COALESCE(AVG(sc.raw_score), 0) AS avg_score
FROM
    seasons s
    INNER JOIN season_participants sp ON sp.season_id = s.id
    INNER JOIN profiles p ON p.id = sp.player_id
    LEFT JOIN games g ON g.season_id = s.id
    LEFT JOIN scores sc ON sc.game_id = g.id AND sc.player_id = p.id
GROUP BY
    s.id, s.name, p.id, p.username, p.profile_image_url
ORDER BY
    total_points DESC NULLS LAST;

-- Grant permissions to view
GRANT SELECT ON season_leaderboard TO anon, authenticated;

-- Ensure RLS policies allow users to see leaderboard data
-- These policies allow authenticated users to read public leaderboard information

-- Seasons: Everyone can view all seasons
DROP POLICY IF EXISTS "Seasons are viewable by everyone" ON seasons;
CREATE POLICY "Seasons are viewable by everyone"
  ON seasons FOR SELECT
  USING (true);

-- Profiles: Everyone can view all player profiles (public info only)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Scores: Everyone can view all scores (leaderboard is public)
DROP POLICY IF EXISTS "Scores are viewable by everyone" ON scores;
CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT
  USING (true);

-- Games: Everyone can view all games
DROP POLICY IF EXISTS "Games are viewable by everyone" ON games;
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

-- Season Participants: Everyone can see who's in which season
DROP POLICY IF EXISTS "Season participants are viewable by everyone" ON season_participants;
CREATE POLICY "Season participants are viewable by everyone"
  ON season_participants FOR SELECT
  USING (true);

COMMENT ON VIEW season_leaderboard IS 'Season leaderboard with player statistics. Uses SECURITY INVOKER for proper RLS enforcement. All users can view.';
