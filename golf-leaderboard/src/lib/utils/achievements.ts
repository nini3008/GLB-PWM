// src/lib/utils/achievements.ts
import { awardAchievement, getUserRecentScores, getUserSeasonScores, getUserSeasonRank, getSeasonLeaderboard } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Score {
  id: string;
  raw_score: number;
  points: number;
  bonus_points: number;
  submitted_at: string;
  games: {
    id: string;
    name: string;
    game_date: string;
    season_id?: string;
    courses: {
      name: string;
      par: number;
    };
  };
}

/**
 * Check and award achievements for a user after they submit a score
 */
export async function checkAndAwardAchievements(
  userId: string,
  seasonId?: string
): Promise<void> {
  try {
    // Get all user scores (for all-time achievements)
    const allScores = await getUserRecentScores(userId);

    // Get season-specific scores if seasonId provided
    const seasonScores = seasonId
      ? await getUserSeasonScores(userId, seasonId)
      : [];

    // Check milestone achievements
    await checkMilestoneAchievements(userId, allScores, seasonScores, seasonId);

    // Check performance achievements
    await checkPerformanceAchievements(userId, allScores, seasonScores, seasonId);

    // Check consistency achievements
    await checkConsistencyAchievements(userId, allScores, seasonScores, seasonId);

    // Check season-end achievements (if season provided)
    if (seasonId) {
      await checkSeasonAchievements(userId, seasonId);
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

/**
 * Check milestone achievements (games played, points earned)
 */
async function checkMilestoneAchievements(
  userId: string,
  allScores: Score[],
  seasonScores: Score[],
  seasonId?: string
) {
  const totalGames = allScores.length;

  // First score ever
  if (totalGames === 1) {
    await tryAwardAchievement(userId, 'first_score', 'First Steps! 🎯', seasonId);
  }

  // Games played milestones
  const gameMilestones = [
    { count: 5, key: 'games_5', name: 'Getting Started! 🏌️' },
    { count: 10, key: 'games_10', name: 'Regular Player! 🏌️' },
    { count: 25, key: 'games_25', name: 'Dedicated Golfer! 🏌️' },
    { count: 50, key: 'games_50', name: 'Golf Veteran! 🏌️' }
  ];

  for (const milestone of gameMilestones) {
    if (totalGames === milestone.count) {
      await tryAwardAchievement(userId, milestone.key, milestone.name);
    }
  }

  // First win (bonus point)
  const hasWon = allScores.some(score => score.bonus_points > 0);
  if (hasWon && allScores.filter(s => s.bonus_points > 0).length === 1) {
    await tryAwardAchievement(userId, 'first_win', 'First Victory! 🏆', seasonId);
  }

  // Season points milestones
  if (seasonId && seasonScores.length > 0) {
    const seasonTotalPoints = seasonScores.reduce(
      (sum, score) => sum + score.points + score.bonus_points,
      0
    );

    const pointsMilestones = [
      { points: 50, key: 'points_50', name: 'Half Century! 🎖️' },
      { points: 100, key: 'points_100', name: 'Century Club! 🎖️' },
      { points: 200, key: 'points_200', name: 'Double Century! 🎖️' }
    ];

    for (const milestone of pointsMilestones) {
      if (seasonTotalPoints >= milestone.points) {
        await tryAwardAchievement(userId, milestone.key, milestone.name, seasonId);
      }
    }
  }
}

/**
 * Check performance achievements (streaks, special scores)
 */
async function checkPerformanceAchievements(
  userId: string,
  allScores: Score[],
  seasonScores: Score[],
  seasonId?: string
) {
  // Check for hot streaks (consecutive bonus points)
  const streak = checkWinStreak(allScores);

  if (streak >= 3) {
    await tryAwardAchievement(userId, 'hot_streak_3', 'Hot Streak! 🔥', seasonId);
  }
  if (streak >= 5) {
    await tryAwardAchievement(userId, 'hot_streak_5', 'On Fire! 🔥🔥', seasonId);
  }

  // Check for perfect score (under par)
  const hasUnderPar = allScores.some(
    score => score.raw_score < score.games.courses.par
  );
  if (hasUnderPar) {
    await tryAwardAchievement(userId, 'perfect_score', 'Eagle Eye! 👁️', seasonId);
  }

  // Check for domination (5+ bonus points in a season)
  if (seasonId && seasonScores.length > 0) {
    const bonusPointCount = seasonScores.filter(s => s.bonus_points > 0).length;
    if (bonusPointCount >= 5) {
      await tryAwardAchievement(userId, 'domination', 'Dominator! 👑', seasonId);
    }
  }

  // Check for early bird (submit within 24 hours)
  const latestScore = allScores[0];
  if (latestScore) {
    const submittedAt = new Date(latestScore.submitted_at);
    const gameDate = new Date(latestScore.games.game_date);
    const hoursDiff = (submittedAt.getTime() - gameDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff <= 24 && hoursDiff >= 0) {
      await tryAwardAchievement(userId, 'early_bird', 'Early Bird! 🕐', seasonId);
    }
  }
}

/**
 * Check consistency achievements
 */
async function checkConsistencyAchievements(
  userId: string,
  allScores: Score[],
  seasonScores: Score[],
  seasonId?: string
) {
  // Check for consistent scorer (low variance)
  if (allScores.length >= 5) {
    const recentFive = allScores.slice(0, 5);
    const scores = recentFive.map(s => s.raw_score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const variance = maxScore - minScore;

    if (variance < 5) {
      await tryAwardAchievement(userId, 'consistent_scorer', 'Mr. Reliable! 📊', seasonId);
    }
  }

  // Note: Perfect attendance is checked at season end
}

/**
 * Check season-specific achievements (rank-based)
 * Call this when viewing profile or at season end
 */
export async function checkSeasonAchievements(
  userId: string,
  seasonId: string
) {
  try {
    const { rank } = await getUserSeasonRank(userId, seasonId);

    if (rank === 1) {
      await tryAwardAchievement(userId, 'season_champion', 'Season Champion! 🏆', seasonId);
    } else if (rank === 2) {
      await tryAwardAchievement(userId, 'runner_up', 'Runner Up! 🥈', seasonId);
    } else if (rank === 3) {
      await tryAwardAchievement(userId, 'top_three', 'Podium Finish! 🥉', seasonId);
    }

    // Check perfect attendance
    const leaderboard = await getSeasonLeaderboard(seasonId);
    if (leaderboard.length > 0) {
      const userStats = leaderboard.find(p => p.player_id === userId);
      const maxGames = Math.max(...leaderboard.map(p => p.games_played || 0));

      if (userStats && userStats.games_played === maxGames && maxGames > 0) {
        await tryAwardAchievement(userId, 'perfect_attendance', 'Perfect Attendance! ✓', seasonId);
      }
    }
  } catch (error) {
    console.error('Error checking season achievements:', error);
  }
}

/**
 * Helper to check for win streaks
 */
function checkWinStreak(scores: Score[]): number {
  let streak = 0;
  let currentStreak = 0;

  // Sort by date ascending to check chronologically
  const sortedScores = [...scores].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );

  for (const score of sortedScores) {
    if (score.bonus_points > 0) {
      currentStreak++;
      streak = Math.max(streak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return streak;
}

/**
 * Try to award an achievement and show toast if successful
 */
async function tryAwardAchievement(
  userId: string,
  achievementKey: string,
  toastMessage?: string,
  seasonId?: string
) {
  try {
    const result = await awardAchievement(userId, achievementKey, seasonId);

    if (!result.alreadyEarned && toastMessage) {
      toast.success('Achievement Unlocked!', {
        description: toastMessage,
        duration: 5000,
      });
    }
  } catch (error) {
    console.error(`Error awarding achievement ${achievementKey}:`, error);
  }
}
