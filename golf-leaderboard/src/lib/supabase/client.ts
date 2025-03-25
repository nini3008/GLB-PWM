// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

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
  
  console.log("Game data for debugging:", debugData);
  console.log("Columns available:", debugData ? Object.keys(debugData) : "No data");
  
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
export async function updateScoreBonusPoints(scoreId: string, bonusPoints: number) {
    // First, get the current score to calculate the total points
    const { data: scoreData, error: fetchError } = await supabase
      .from('scores')
      .select('points')
      .eq('id', scoreId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching score points:', fetchError);
      throw fetchError;
    }
    
    // Calculate total points manually (base points + bonus points)
    const totalPoints = scoreData.points + bonusPoints;
    
    // Update the score with new bonus points and total points
    const { error } = await supabase
      .from('scores')
      .update({ 
        bonus_points: bonusPoints,
        // Calculate total points as the sum of base points and bonus points
        total_points: totalPoints
      })
      .eq('id', scoreId);
    
    if (error) {
      console.error('Error updating bonus points:', error);
      throw error;
    }
    
    return true;
  }

// Get user's recent scores (limited to last 10)
export async function getUserRecentScores(userId: string, limit: number = 10) {
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
    .order('submitted_at', { ascending: false })
    .limit(limit);
  
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