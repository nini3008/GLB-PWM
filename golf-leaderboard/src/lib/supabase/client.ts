// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database, Json } from './types';
import { updateBonusPoints } from '../utils/scoring';

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
        end_date
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