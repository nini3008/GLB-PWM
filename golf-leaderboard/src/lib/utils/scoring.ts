// src/lib/utils/scoring.ts

export interface ScoreData {
    rawScore: number;
    coursePar: number;
    playerId: string;
    gameId: string;
    notes?: string;
  }
  
  export interface CalculatedScore {
    rawScore: number;
    overPar: number;
    points: number;
    bonusPoints: number;
    totalPoints: number;
  }
  
  /**
   * Calculate points based on absolute raw score
   * 
   * Scoring system:
   * - 100+: 0 points
   * - 96-99: 1 point
   * - 90-95: 2 points
   * - 85-89: 3 points
   * - 80-84: 4 points
   * - 75-79: 5 points
   * - Below 75: 6 points
   */
  export function calculatePoints(rawScore: number, coursePar: number): number {
    if (rawScore >= 100) return 0;
    if (rawScore >= 96) return 1;
    if (rawScore >= 90) return 2;
    if (rawScore >= 85) return 3;
    if (rawScore >= 80) return 4;
    if (rawScore >= 75) return 5;
    return 6; // Below 75
  }
  
  /**
   * Determines if a score is the lowest in a round
   * Returns true if it's the lowest, false otherwise
   */
  export function isLowestScore(rawScore: number, allScoresInRound: number[]): boolean {
    if (allScoresInRound.length === 0) return true;
    return rawScore <= Math.min(...allScoresInRound);
  }
  
 /**
 * Calculate all score details including points and bonus points
 * 
 * Note: This function calculates what the score WOULD BE if submitted now.
 * To determine final bonus points for all players after submission,
 * you should use the updateBonusPoints function.
 */
export function calculateFullScore(
    scoreData: ScoreData,
    allScoresInRound: number[]
  ): CalculatedScore {
    const { rawScore, coursePar } = scoreData;
    const overPar = rawScore - coursePar;
    const points = calculatePoints(rawScore, coursePar);
    
    // Find the current lowest score among existing scores
    const currentLowestScore = allScoresInRound.length > 0 
      ? Math.min(...allScoresInRound) 
      : Infinity;
    
    // Preview what would happen if this score is submitted
    // If this score is lower than the current lowest, it will get a bonus point
    // and everyone else will lose their bonus points
    // If this score ties the current lowest, it will also get a bonus point
    const bonusPoints = (rawScore <= currentLowestScore) ? 1 : 0;
    
    return {
      rawScore,
      overPar,
      points,
      bonusPoints,
      totalPoints: points + bonusPoints
    };
  }
  
  /**
   * Update bonus points for all scores in a round
   * This should be called after adding or updating a score
   * 
   * @param allScoresInRound Array of all score objects for the round
   * @returns Array of player IDs that need bonus point updates
   */
  export function updateBonusPoints(allScoresInRound: { 
    playerId: string; 
    rawScore: number;
    bonusPoints: number;
  }[]): { 
    playerId: string; 
    shouldHaveBonus: boolean;
  }[] {
    // If no scores, return empty array
    if (allScoresInRound.length === 0) return [];
    
    // Find the lowest score in the round
    const lowestScore = Math.min(...allScoresInRound.map(score => score.rawScore));
    
    // Determine which players should have bonus points
    return allScoresInRound.map(score => ({
      playerId: score.playerId,
      shouldHaveBonus: score.rawScore === lowestScore
    }));
  }
  /**
   * Get the most recent 10 rounds for display
   */
  export function getRecentRounds(rounds: any[], limit: number = 10) {
    return [...rounds]
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
      .slice(0, limit);
  }
  
  /**
   * Format score display for leaderboard
   */
  export function formatScoreDisplay(rawScore: number, coursePar: number): string {
    const overPar = rawScore - coursePar;
    
    if (overPar === 0) return 'E'; // Even par
    if (overPar > 0) return `+${overPar}`; // Over par
    return `${overPar}`; // Under par (already has the minus sign)
  }