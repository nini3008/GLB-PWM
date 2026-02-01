// src/lib/utils/achievementProgress.ts
import {
  getUserRecentScores,
  getUserSeasonScores,
  getUserSeasonRank,
  getSeasonLeaderboard,
} from '@/lib/supabase/client';

export interface AchievementProgress {
  current: number;
  target: number;
  label: string;
}

/**
 * Computes progress toward unearned achievements
 * @param userId - The user's ID
 * @param seasonId - Optional season ID for season-specific progress
 * @returns Map of achievement keys to their progress data
 */
export async function getAchievementProgress(
  userId: string,
  seasonId?: string
): Promise<Map<string, AchievementProgress>> {
  const progressMap = new Map<string, AchievementProgress>();

  // Fetch all scores
  const allScores = await getUserRecentScores(userId);

  // Fetch season scores if seasonId provided
  const seasonScores = seasonId ? await getUserSeasonScores(userId, seasonId) : [];

  // Calculate bonus count (wins) from all scores
  const bonusCount = allScores.filter((s) => s.bonus_points > 0).length;

  // Calculate season bonus count
  const seasonBonusCount = seasonScores.filter((s) => s.bonus_points > 0).length;

  // Calculate season points
  const seasonPoints = seasonScores.reduce(
    (sum, s) => sum + s.points + s.bonus_points,
    0
  );

  // Calculate best streak (consecutive bonus_points > 0 scores, sorted by date ascending)
  const sortedScores = [...allScores].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );
  let currentStreak = 0;
  let bestStreak = 0;
  for (const score of sortedScores) {
    if (score.bonus_points > 0) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Get total games in season (max games_played from leaderboard)
  let totalGamesInSeason = 0;
  const userGamesInSeason = seasonScores.length;
  if (seasonId) {
    const leaderboard = await getSeasonLeaderboard(seasonId);
    totalGamesInSeason = Math.max(...leaderboard.map((p) => p.games_played ?? 0), 0);
  }

  // Get user's current rank in season
  let rank = 0;
  if (seasonId) {
    const rankData = await getUserSeasonRank(userId, seasonId);
    rank = rankData.rank;
  }

  // Progress mappings
  progressMap.set('first_score', {
    current: allScores.length,
    target: 1,
    label: 'Scores submitted',
  });

  progressMap.set('games_5', {
    current: allScores.length,
    target: 5,
    label: 'Games played',
  });

  progressMap.set('games_10', {
    current: allScores.length,
    target: 10,
    label: 'Games played',
  });

  progressMap.set('games_25', {
    current: allScores.length,
    target: 25,
    label: 'Games played',
  });

  progressMap.set('games_50', {
    current: allScores.length,
    target: 50,
    label: 'Games played',
  });

  progressMap.set('first_win', {
    current: bonusCount,
    target: 1,
    label: 'Wins',
  });

  progressMap.set('points_50', {
    current: seasonPoints,
    target: 50,
    label: 'Season points',
  });

  progressMap.set('points_100', {
    current: seasonPoints,
    target: 100,
    label: 'Season points',
  });

  progressMap.set('points_200', {
    current: seasonPoints,
    target: 200,
    label: 'Season points',
  });

  progressMap.set('hot_streak_3', {
    current: bestStreak,
    target: 3,
    label: 'Best streak',
  });

  progressMap.set('hot_streak_5', {
    current: bestStreak,
    target: 5,
    label: 'Best streak',
  });

  progressMap.set('domination', {
    current: seasonBonusCount,
    target: 5,
    label: 'Season wins',
  });

  progressMap.set('perfect_attendance', {
    current: userGamesInSeason,
    target: totalGamesInSeason,
    label: 'Games played',
  });

  progressMap.set('season_champion', {
    current: rank <= 1 ? 1 : 0,
    target: 1,
    label: 'Current rank',
  });

  progressMap.set('season_runner_up', {
    current: rank <= 2 ? 1 : 0,
    target: 1,
    label: 'Current rank',
  });

  progressMap.set('season_top_three', {
    current: rank <= 3 ? 1 : 0,
    target: 1,
    label: 'Current rank',
  });

  // Hidden achievements (no progress bar): perfect_score, early_bird, consistent_scorer
  // These are not included in the map

  return progressMap;
}
