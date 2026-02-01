// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database, Json } from './types';
import { updateBonusPoints } from '../utils/scoring';
import { calculateHandicap, ScoreForHandicap } from '../utils/handicap';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

// Check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data?.is_admin || false;
}

// Get all seasons that a user has joined
export async function getUserSeasons(userId: string) {
  const { data, error } = await supabase
    .from('season_participants')
    .select(`
      id,
      seasons:season_id (
        id,
        name,
        code,
        start_date,
        end_date,
        is_active
      )
    `)
    .eq('player_id', userId);

  if (error) throw error;

  // Transform the data to make it easier to work with
  return data.map(participant => ({
    id: participant.seasons.id,
    name: participant.seasons.name,
    code: participant.seasons.code,
    startDate: participant.seasons.start_date,
    endDate: participant.seasons.end_date,
    isActive: participant.seasons.is_active,
    participantId: participant.id
  }));
}

// Create a new game/round
export async function createGame(gameData: {
  name: string;
  course_id: string;
  season_id: string;
  round_code: string;
  game_date: string;
  created_by: string;
  status?: string;
}) {
    const gameDataWithStatus = {
        ...gameData,
        status: gameData.status || 'active'
      };

  const { data, error } = await supabase
    .from('games')
    .insert(gameDataWithStatus)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Add a player to a season
export async function joinSeason(seasonCode: string, playerId: string) {
  // First, get the season ID from the code
  const { data: seasonData, error: seasonError } = await supabase
    .from('seasons')
    .select('id')
    .eq('code', seasonCode)
    .single();
  
  if (seasonError) throw seasonError;
  
  // Then add the player to the season
  const { data, error } = await supabase
    .from('season_participants')
    .insert({
      season_id: seasonData.id,
      player_id: playerId
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Submit a score for a round
export async function submitScore(scoreData: {
  game_id: string;
  player_id: string;
  raw_score: number;
  points: number;
  bonus_points: number;
  notes?: string;
}) {
  // First, let's debug by getting all columns
  const { data: debugData } = await supabase
    .from('games')
    .select('*')
    .eq('id', scoreData.game_id)
    .single();
  
  if (debugData && debugData.status === 'completed') {
    throw new Error('This round is completed. No new scores can be submitted.');
  }
  const { data, error } = await supabase
    .from('scores')
    .insert(scoreData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get all scores for a specific game/round
export async function getGameScores(gameId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id,
      game_id,
      player_id,
      raw_score,
      points,
      bonus_points,
      notes,
      submitted_at,
       profiles!player_id(username, profile_image_url)
    `)
    .eq('game_id', gameId)
    .order('raw_score', { ascending: true });
  
  if (error) throw error;
  return data;
}

// Get the leaderboard for a specific season
export async function getSeasonLeaderboard(seasonId: string) {
  const { data, error } = await supabase
    .from('season_leaderboard')
    .select('*')
    .eq('season_id', seasonId)
    .order('total_points', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Update a score (admin only)
export async function updateScore(
  scoreId: string, 
  updates: {
    raw_score?: number;
    points?: number;
    bonus_points?: number;
    notes?: string;
    edited_by: string;
    edited_at: string;
  }
) {
  const { data, error } = await supabase
    .from('scores')
    .update(updates)
    .eq('id', scoreId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}


/**
 * Update bonus points for a specific score
 * Used when recalculating scores after a new submission
 */
/**
 * Update bonus points for a specific score
 */
export async function updateScoreBonusPoints(scoreId: string, bonusPoints: number) {
    // Update the score with new bonus points and total points
    const { error } = await supabase
      .from('scores')
      .update({ 
        bonus_points: bonusPoints
      })
      .eq('id', scoreId)
      .select();
    
    if (error) {
      throw error;
    }
    return true;
}


/**
 * Admin function to recalculate bonus points for a specific game/round
 * This ensures only the player(s) with the lowest score get bonus points
 * 
 * @param gameId ID of the game/round to recalculate
 * @returns Object with success status and message
 */
export async function recalculateBonusPoints(gameId: string) {
    // Get all scores for the game
    const { data: scores, error } = await supabase
      .from('scores')
      .select('id, player_id, raw_score, bonus_points, points')
      .eq('game_id', gameId);
    
    if (error) {
      throw error;
    }
    
    // Format for the updateBonusPoints function
    const scoresForUpdate = scores.map(score => ({
      playerId: score.player_id,
      rawScore: score.raw_score,
      bonusPoints: score.bonus_points
    }));
    
    // Calculate who should have bonus points
    const bonusUpdates = updateBonusPoints(scoresForUpdate);
    
    // Track which scores were updated
    const updatedScores = [];
    const failedUpdates = [];
    
    // Update each score as needed
    for (const update of bonusUpdates) {
      const shouldHaveBonus = update.shouldHaveBonus ? 1 : 0;
      const scoreToUpdate = scores.find(score => score.player_id === update.playerId);
      
      if (scoreToUpdate && scoreToUpdate.bonus_points !== shouldHaveBonus) {
        try {
          await updateScoreBonusPoints(scoreToUpdate.id, shouldHaveBonus);
          updatedScores.push({
            id: scoreToUpdate.id,
            rawScore: scoreToUpdate.raw_score,
            oldBonus: scoreToUpdate.bonus_points,
            newBonus: shouldHaveBonus
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          failedUpdates.push({
            id: scoreToUpdate.id,
            error: error.message
          });
        }
      }
    }
    
    return {
      success: failedUpdates.length === 0,
      updatedScores,
      failedUpdates,
      message: `Updated ${updatedScores.length} scores, ${failedUpdates.length} failures`
    };
  }

// Get user's scores (all scores for accurate average calculation)
export async function getUserRecentScores(userId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id,
      raw_score,
      points,
      bonus_points,
      submitted_at,
      games:game_id (
        id,
        name,
        game_date,
        courses:course_id (
          name,
          par
        )
      )
    `)
    .eq('player_id', userId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Validate round code and get game details
export async function validateRoundCode(roundCode: string) {
  const { data, error } = await supabase
    .from('games')
    .select(`
      id,
      name,
      game_date,
      season_id,
      courses:course_id (
        id,
        name,
        par
      )
    `)
    .eq('round_code', roundCode)
    .single();
  
  if (error) throw error;
  return data;
}

// Check if the user has already submitted a score for this game
export async function hasUserSubmittedScore(gameId: string, playerId: string) {
  const { error, count } = await supabase
    .from('scores')
    .select('id', { count: 'exact' })
    .eq('game_id', gameId)
    .eq('player_id', playerId);
  
  if (error) throw error;
  return count && count > 0;
}

// Check if user is part of the season for this game
export async function isUserInSeason(seasonId: string, playerId: string) {
  const { error, count } = await supabase
    .from('season_participants')
    .select('id', { count: 'exact' })
    .eq('season_id', seasonId)
    .eq('player_id', playerId);
  
  if (error) throw error;
  return count && count > 0;
}
// Add to src/lib/supabase/client.ts
export async function deleteScore(scoreId: string) {
    const { data, error } = await supabase
      .from('scores')
      .delete()
      .eq('id', scoreId);
    
    if (error) throw error;
    return data;
  }

  // Get game status
export async function getGameStatus(gameId: string) {
    const { data, error } = await supabase
      .from('games')
      .select('status')
      .eq('id', gameId)
      .single();
    
    if (error) throw error;
    return data.status;
  }
  
  // Update game status (admin only)
  export async function updateGameStatus(gameId: string, status: 'active' | 'completed') {
    const { data, error } = await supabase
      .from('games')
      .update({ status })
      .eq('id', gameId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== ACHIEVEMENTS FUNCTIONS =====

  // Get all available achievements
  export async function getAllAchievements() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Get user's earned achievements
  export async function getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        id,
        earned_at,
        season_id,
        metadata,
        achievements:achievement_id (
          id,
          key,
          name,
          description,
          icon,
          category,
          tier
        ),
        seasons:season_id (
          name
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Award achievement to user (called from client-side after detection)
  export async function awardAchievement(
    userId: string,
    achievementKey: string,
    seasonId?: string,
    metadata?: Record<string, unknown>
  ) {
    // First get the achievement ID by key
    const { data: achievement, error: achError } = await supabase
      .from('achievements')
      .select('id')
      .eq('key', achievementKey)
      .single();

    if (achError || !achievement) throw achError || new Error('Achievement not found');

    // Check if already earned
    let query = supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id);

    // Add season filter if provided, otherwise check for null
    if (seasonId) {
      query = query.eq('season_id', seasonId);
    } else {
      query = query.is('season_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return { alreadyEarned: true, data: null };
    }

    // Award the achievement
    const insertData: {
      user_id: string;
      achievement_id: string;
      season_id?: string | null;
      metadata?: Json | null;
    } = {
      user_id: userId,
      achievement_id: achievement.id,
    };

    if (seasonId !== undefined) {
      insertData.season_id = seasonId;
    }

    if (metadata !== undefined) {
      insertData.metadata = metadata as Json;
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .insert(insertData)
      .select(`
        id,
        earned_at,
        achievements:achievement_id (
          name,
          description,
          icon,
          tier
        )
      `)
      .single();

    if (error) throw error;
    return { alreadyEarned: false, data };
  }

  // Get user's season-specific scores for stats calculation
  export async function getUserSeasonScores(userId: string, seasonId: string) {
    const { data, error } = await supabase
      .from('scores')
      .select(`
        id,
        raw_score,
        points,
        bonus_points,
        submitted_at,
        games:game_id (
          id,
          name,
          game_date,
          season_id,
          courses:course_id (
            name,
            par
          )
        )
      `)
      .eq('player_id', userId)
      .eq('games.season_id', seasonId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    // Filter out any scores where games is null (shouldn't happen but be safe)
    return data.filter(score => score.games !== null);
  }

  // Get user's rank in a specific season
  export async function getUserSeasonRank(userId: string, seasonId: string) {
    const { data, error } = await supabase
      .from('season_leaderboard')
      .select('player_id, total_points')
      .eq('season_id', seasonId)
      .order('total_points', { ascending: false });

    if (error) throw error;

    const rank = data.findIndex(player => player.player_id === userId) + 1;
    return { rank, totalPlayers: data.length };
  }

  // Get comprehensive player card data for modal display
  export async function getPlayerCardData(userId: string) {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, first_name, last_name, bio, handicap, profile_image_url')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get ALL scores for stats calculation
    const { data: allScores, error: allScoresError } = await supabase
      .from('scores')
      .select('raw_score, points, bonus_points')
      .eq('player_id', userId);

    if (allScoresError) throw allScoresError;

    // Calculate stats from ALL scores
    const stats = {
      gamesPlayed: (allScores || []).length,
      averageScore: (allScores || []).length > 0
        ? (allScores || []).reduce((sum, s) => sum + s.raw_score, 0) / (allScores || []).length
        : 0,
      bestScore: (allScores || []).length > 0
        ? Math.min(...(allScores || []).map(s => s.raw_score))
        : null,
      totalPoints: (allScores || []).reduce((sum, s) => sum + s.points + s.bonus_points, 0),
    };

    // Get recent scores with game and course info for display (limit to 10)
    const { data: recentScores, error: scoresError } = await supabase
      .from('scores')
      .select(`
        id,
        raw_score,
        points,
        bonus_points,
        submitted_at,
        games:game_id (
          name,
          game_date,
          courses:course_id (
            name,
            par
          )
        )
      `)
      .eq('player_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (scoresError) throw scoresError;

    // Get achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        id,
        earned_at,
        season_id,
        achievements:achievement_id (
          id,
          key,
          name,
          description,
          icon,
          category,
          tier
        ),
        seasons:season_id (
          name
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(20);

    if (achievementsError) throw achievementsError;

    // Transform the data
    const transformedScores = (recentScores || []).map(score => ({
      id: score.id,
      raw_score: score.raw_score,
      points: score.points,
      bonus_points: score.bonus_points,
      submitted_at: score.submitted_at,
      game: {
        name: score.games.name,
        game_date: score.games.game_date,
        course: {
          name: score.games.courses.name,
          par: score.games.courses.par,
        },
      },
    }));

    return {
      profile,
      stats,
      recentScores: transformedScores,
      achievements: achievements || [],
    };
  }

  // Calculate and update player handicap
  export async function updatePlayerHandicap(userId: string): Promise<number | null> {
    // Get all player scores with course par
    const { data: scores, error } = await supabase
      .from('scores')
      .select(`
        raw_score,
        games:game_id (
          courses:course_id (
            par
          )
        )
      `)
      .eq('player_id', userId);

    if (error) throw error;

    // Transform scores for handicap calculation
    const scoresForHandicap: ScoreForHandicap[] = (scores || [])
      .filter(score => !!score.games?.courses?.par)
      .map(score => ({
        raw_score: score.raw_score,
        par: score.games.courses.par,
      }));

    // Calculate handicap
    const handicap = calculateHandicap(scoresForHandicap);

    // Update profile with calculated handicap
    if (handicap !== null) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ handicap })
        .eq('id', userId);

      if (updateError) throw updateError;
    }

    return handicap;
  }

  // ===== DASHBOARD QUERY FUNCTIONS =====

  export async function getUserCurrentSeasonStats(userId: string) {
    // Get user's active seasons
    const { data: participations, error: pError } = await supabase
      .from('season_participants')
      .select('season_id, seasons:season_id (id, name, is_active)')
      .eq('player_id', userId);

    if (pError) throw pError;

    const activeSeasons = (participations || []).filter(p => p.seasons?.is_active);
    if (activeSeasons.length === 0) return null;

    const season = activeSeasons[0].seasons!;

    // Get leaderboard for this season
    const { data: leaderboard, error: lError } = await supabase
      .from('season_leaderboard')
      .select('*')
      .eq('season_id', season.id)
      .order('total_points', { ascending: false });

    if (lError) throw lError;

    const userRow = (leaderboard || []).find(r => r.player_id === userId);
    const rank = userRow
      ? (leaderboard || []).findIndex(r => r.player_id === userId) + 1
      : null;

    return {
      seasonId: season.id,
      seasonName: season.name,
      rank,
      totalPlayers: (leaderboard || []).length,
      totalPoints: userRow?.total_points ?? 0,
      gamesPlayed: userRow?.games_played ?? 0,
      avgScore: userRow?.avg_score ?? null,
    };
  }

  export async function getUserPendingGames(userId: string) {
    // Get user's active season IDs
    const { data: participations, error: pError } = await supabase
      .from('season_participants')
      .select('season_id, seasons:season_id (id, is_active)')
      .eq('player_id', userId);

    if (pError) throw pError;

    const activeSeasonIds = (participations || [])
      .filter(p => p.seasons?.is_active)
      .map(p => p.season_id);

    if (activeSeasonIds.length === 0) return [];

    const today = new Date().toISOString().split('T')[0];

    const { data: games, error: gError } = await supabase
      .from('games')
      .select(`
        id, name, game_date,
        seasons:season_id (name),
        courses:course_id (name)
      `)
      .in('season_id', activeSeasonIds)
      .lte('game_date', today)
      .eq('status', 'active')
      .order('game_date', { ascending: false });

    if (gError) throw gError;

    const pending = [];
    for (const game of games || []) {
      const submitted = await hasUserSubmittedScore(game.id, userId);
      if (!submitted) {
        pending.push({
          id: game.id,
          name: game.name,
          game_date: game.game_date,
          season_name: game.seasons?.name ?? '',
          course_name: game.courses?.name ?? '',
        });
      }
    }
    return pending;
  }

  // ===== COURSE MANAGEMENT FUNCTIONS =====

  export async function getCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  export async function createCourse(courseData: { name: string; location?: string; par: number }) {
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  export async function updateCourse(id: string, updates: { name?: string; location?: string; par?: number }) {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== PLAYER STATS FUNCTION =====

  export async function getPlayerStats(userId: string, seasonId?: string) {
    let query = supabase
      .from('scores')
      .select(`
        id,
        raw_score,
        points,
        bonus_points,
        submitted_at,
        notes,
        games:game_id (
          id,
          name,
          game_date,
          season_id,
          courses:course_id (
            name,
            par
          )
        )
      `)
      .eq('player_id', userId)
      .order('submitted_at', { ascending: false });

    if (seasonId) {
      query = query.eq('games.season_id', seasonId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const scores = (data || []).filter(s => s.games !== null);
    return scores;
  }

  // ===== HEAD TO HEAD COMPARISON =====

  export async function getHeadToHead(player1Id: string, player2Id: string, seasonId: string) {
    // Get profiles
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, username, profile_image_url')
      .in('id', [player1Id, player2Id]);

    if (pError) throw pError;

    const p1Profile = profiles?.find(p => p.id === player1Id);
    const p2Profile = profiles?.find(p => p.id === player2Id);

    // Get all scores for both players in the season
    const { data: allScores, error: sError } = await supabase
      .from('scores')
      .select(`
        id, player_id, raw_score, points, bonus_points,
        games:game_id (id, name, game_date, season_id, courses:course_id (par))
      `)
      .in('player_id', [player1Id, player2Id])
      .order('submitted_at', { ascending: true });

    if (sError) throw sError;

    const seasonScores = (allScores || []).filter(s => s.games?.season_id === seasonId);

    // Group by game
    const gameMap = new Map<string, { gameName: string; gameDate: string; p1Score?: number; p2Score?: number; p1Points?: number; p2Points?: number }>();

    for (const score of seasonScores) {
      if (!score.games) continue;
      const gameId = score.games.id;
      if (!gameMap.has(gameId)) {
        gameMap.set(gameId, { gameName: score.games.name, gameDate: score.games.game_date });
      }
      const entry = gameMap.get(gameId)!;
      if (score.player_id === player1Id) {
        entry.p1Score = score.raw_score;
        entry.p1Points = score.points + score.bonus_points;
      } else {
        entry.p2Score = score.raw_score;
        entry.p2Points = score.points + score.bonus_points;
      }
    }

    // Find shared games
    const sharedGames: Array<{ gameName: string; gameDate: string; p1Score: number; p2Score: number; winner: 'p1' | 'p2' | 'tie' }> = [];
    let p1Wins = 0, p2Wins = 0, ties = 0;

    for (const [, game] of gameMap) {
      if (game.p1Score !== undefined && game.p2Score !== undefined) {
        const winner = game.p1Score < game.p2Score ? 'p1' : game.p1Score > game.p2Score ? 'p2' : 'tie';
        if (winner === 'p1') p1Wins++;
        else if (winner === 'p2') p2Wins++;
        else ties++;
        sharedGames.push({
          gameName: game.gameName,
          gameDate: game.gameDate,
          p1Score: game.p1Score,
          p2Score: game.p2Score,
          winner,
        });
      }
    }

    // Compute stats per player
    const p1Scores = seasonScores.filter(s => s.player_id === player1Id);
    const p2Scores = seasonScores.filter(s => s.player_id === player2Id);

    const calcStats = (scores: typeof p1Scores) => ({
      gamesPlayed: scores.length,
      avgScore: scores.length > 0 ? scores.reduce((sum, s) => sum + s.raw_score, 0) / scores.length : 0,
      totalPoints: scores.reduce((sum, s) => sum + s.points + s.bonus_points, 0),
      bestScore: scores.length > 0 ? Math.min(...scores.map(s => s.raw_score)) : null,
    });

    return {
      player1: { username: p1Profile?.username || 'Unknown', profile_image_url: p1Profile?.profile_image_url || null, ...calcStats(p1Scores) },
      player2: { username: p2Profile?.username || 'Unknown', profile_image_url: p2Profile?.profile_image_url || null, ...calcStats(p2Scores) },
      sharedGames,
      record: { p1Wins, p2Wins, ties },
    };
  }

  // ===== ROUND RECAP =====

  export async function getRoundRecap(gameId: string) {
    const { data: game, error: gError } = await supabase
      .from('games')
      .select(`
        id, name, game_date,
        courses:course_id (name, par)
      `)
      .eq('id', gameId)
      .single();

    if (gError) throw gError;

    const { data: scores, error: sError } = await supabase
      .from('scores')
      .select(`
        id, raw_score, points, bonus_points, notes,
        profiles!player_id (username, profile_image_url)
      `)
      .eq('game_id', gameId)
      .order('raw_score', { ascending: true });

    if (sError) throw sError;

    return {
      game: { name: game.name, game_date: game.game_date },
      course: { name: game.courses.name, par: game.courses.par },
      scores: (scores || []).map(s => ({
        player: { username: s.profiles?.username || 'Unknown', profile_image_url: s.profiles?.profile_image_url || null },
        score: s.raw_score,
        points: s.points,
        bonus_points: s.bonus_points,
        notes: s.notes,
      })),
    };
  }

  export async function getUserActivityFeed(userId: string, limit = 10) {
    // Get user's season IDs
    const { data: participations, error: pError } = await supabase
      .from('season_participants')
      .select('season_id')
      .eq('player_id', userId);

    if (pError) throw pError;

    const seasonIds = (participations || []).map(p => p.season_id);
    if (seasonIds.length === 0) return [];

    // Three parallel queries
    const [scoresRes, gamesRes, achievementsRes] = await Promise.all([
      // Recent scores from others in user's seasons
      supabase
        .from('scores')
        .select(`
          id, raw_score, submitted_at, player_id,
          profiles!player_id (username),
          games:game_id (name, season_id, courses:course_id (name))
        `)
        .neq('player_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(20),
      // Recent games created in user's seasons
      supabase
        .from('games')
        .select(`
          id, name, game_date, season_id,
          profiles:created_by (username),
          courses:course_id (name)
        `)
        .in('season_id', seasonIds)
        .order('game_date', { ascending: false })
        .limit(10),
      // Recent achievements from others
      supabase
        .from('user_achievements')
        .select(`
          id, earned_at, user_id, season_id,
          profiles:user_id (username),
          achievements:achievement_id (name)
        `)
        .neq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(10),
    ]);

    type FeedItem = {
      type: 'score' | 'game' | 'achievement';
      timestamp: string;
      playerName: string;
      details: string;
    };

    const items: FeedItem[] = [];

    // Filter scores to user's seasons and map
    for (const s of scoresRes.data || []) {
      if (s.games && seasonIds.includes(s.games.season_id)) {
        items.push({
          type: 'score',
          timestamp: s.submitted_at,
          playerName: s.profiles?.username ?? 'Unknown',
          details: `shot ${s.raw_score} at ${s.games.courses?.name ?? 'Unknown Course'}`,
        });
      }
    }

    for (const g of gamesRes.data || []) {
      items.push({
        type: 'game',
        timestamp: g.game_date,
        playerName: g.profiles?.username ?? 'Admin',
        details: `New round: ${g.name} at ${g.courses?.name ?? 'Unknown Course'}`,
      });
    }

    for (const a of achievementsRes.data || []) {
      if (a.season_id && seasonIds.includes(a.season_id)) {
        items.push({
          type: 'achievement',
          timestamp: a.earned_at,
          playerName: a.profiles?.username ?? 'Unknown',
          details: `earned ${a.achievements?.name ?? 'an achievement'}`,
        });
      }
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, limit);
  }

// Subscribe to real-time score changes for a season
export function subscribeToScoreChanges(
  seasonId: string,
  callback: () => void
) {
  const channel = supabase
    .channel(`scores-season-${seasonId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'scores' },
      () => callback()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}