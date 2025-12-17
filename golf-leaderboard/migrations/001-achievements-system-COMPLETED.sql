-- Migration: Add Achievements System
-- Run this SQL in your Supabase SQL Editor

-- Create achievements table to define all available badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- Unique identifier for the achievement
  name TEXT NOT NULL, -- Display name
  description TEXT NOT NULL, -- What the achievement is for
  icon TEXT NOT NULL, -- Icon identifier (lucide icon name)
  category TEXT NOT NULL, -- Category: 'milestone', 'performance', 'consistency', 'special'
  tier TEXT NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_achievements table to track earned badges
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL, -- Track which season it was earned in
  metadata JSONB, -- Store additional context (e.g., streak count, score value)
  UNIQUE(user_id, achievement_id, season_id) -- Prevent duplicate achievements per season
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_season_id ON user_achievements(season_id);

-- Insert predefined achievements
INSERT INTO achievements (key, name, description, icon, category, tier) VALUES
  -- Milestone achievements
  ('first_score', 'First Steps', 'Submit your first score', 'Target', 'milestone', 'bronze'),
  ('first_win', 'First Victory', 'Earn your first bonus point', 'Trophy', 'milestone', 'bronze'),
  ('games_5', 'Getting Started', 'Play 5 games', 'Flag', 'milestone', 'bronze'),
  ('games_10', 'Regular Player', 'Play 10 games', 'Flag', 'milestone', 'silver'),
  ('games_25', 'Dedicated Golfer', 'Play 25 games', 'Flag', 'milestone', 'gold'),
  ('games_50', 'Golf Veteran', 'Play 50 games', 'Flag', 'milestone', 'platinum'),
  ('points_50', 'Half Century', 'Earn 50 total points in a season', 'Award', 'milestone', 'bronze'),
  ('points_100', 'Century Club', 'Earn 100 total points in a season', 'Award', 'milestone', 'silver'),
  ('points_200', 'Double Century', 'Earn 200 total points in a season', 'Award', 'milestone', 'gold'),

  -- Performance achievements
  ('hot_streak_3', 'Hot Streak', 'Win bonus points in 3 consecutive games', 'Flame', 'performance', 'silver'),
  ('hot_streak_5', 'On Fire', 'Win bonus points in 5 consecutive games', 'Flame', 'performance', 'gold'),
  ('perfect_score', 'Eagle Eye', 'Score under par', 'Eye', 'performance', 'gold'),
  ('domination', 'Dominator', 'Win 5+ bonus points in a season', 'Crown', 'performance', 'gold'),

  -- Consistency achievements
  ('perfect_attendance', 'Perfect Attendance', 'Play all rounds in a season', 'CheckCircle', 'consistency', 'silver'),
  ('consistent_scorer', 'Mr. Reliable', 'Play 5+ games with less than 5 strokes variance', 'TrendingUp', 'consistency', 'silver'),

  -- Special achievements
  ('season_champion', 'Season Champion', 'Finish 1st in a season', 'Crown', 'special', 'platinum'),
  ('runner_up', 'Runner Up', 'Finish 2nd in a season', 'Medal', 'special', 'gold'),
  ('top_three', 'Podium Finish', 'Finish in top 3 of a season', 'Medal', 'special', 'silver'),
  ('comeback_king', 'Comeback King', 'Climb 5+ positions in final 3 games', 'TrendingUp', 'special', 'gold'),
  ('early_bird', 'Early Bird', 'Submit score within 24 hours of game date', 'Clock', 'special', 'bronze')
ON CONFLICT (key) DO NOTHING;

-- Create a function to get user's achievements
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id UUID)
RETURNS TABLE (
  achievement_id UUID,
  achievement_key TEXT,
  achievement_name TEXT,
  achievement_description TEXT,
  achievement_icon TEXT,
  achievement_category TEXT,
  achievement_tier TEXT,
  earned_at TIMESTAMPTZ,
  season_id UUID,
  season_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.key,
    a.name,
    a.description,
    a.icon,
    a.category,
    a.tier,
    ua.earned_at,
    ua.season_id,
    s.name as season_name
  FROM user_achievements ua
  JOIN achievements a ON ua.achievement_id = a.id
  LEFT JOIN seasons s ON ua.season_id = s.id
  WHERE ua.user_id = p_user_id
  ORDER BY ua.earned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to award an achievement to a user
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id UUID,
  p_achievement_key TEXT,
  p_season_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Get achievement ID
  SELECT id INTO v_achievement_id
  FROM achievements
  WHERE key = p_achievement_key;

  IF v_achievement_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id
    AND achievement_id = v_achievement_id
    AND (season_id = p_season_id OR (season_id IS NULL AND p_season_id IS NULL))
  ) INTO v_exists;

  IF v_exists THEN
    RETURN FALSE; -- Already earned
  END IF;

  -- Award the achievement
  INSERT INTO user_achievements (user_id, achievement_id, season_id, metadata)
  VALUES (p_user_id, v_achievement_id, p_season_id, p_metadata);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON achievements TO anon, authenticated;
GRANT ALL ON user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION award_achievement TO authenticated;

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (read-only for all)
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view all achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE achievements IS 'Defines all available achievements/badges in the system';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements each user has earned';
COMMENT ON FUNCTION get_user_achievements IS 'Returns all achievements earned by a specific user';
COMMENT ON FUNCTION award_achievement IS 'Awards an achievement to a user if they haven''t earned it yet';
