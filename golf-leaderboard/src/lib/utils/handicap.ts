// src/lib/utils/handicap.ts

/**
 * Calculate golf handicap using the USGA Handicap System
 *
 * USGA System:
 * - Uses best scores based on total rounds played
 * - Handicap Index = (Average of best score differentials) × 0.96
 * - Score Differential = (Adjusted Gross Score - Course Rating) × (113 / Slope Rating)
 *
 * Simplified version (no course rating/slope available):
 * - Score Differential = (Raw Score - Par)
 * - Uses USGA table for number of best scores based on total rounds
 */

export interface ScoreForHandicap {
  raw_score: number;
  par: number;
}

/**
 * Get number of best scores to use based on USGA guidelines
 * @param totalRounds - Total number of rounds played
 * @returns Number of best scores to use for handicap calculation
 */
function getUSGABestScoresCount(totalRounds: number): number {
  if (totalRounds < 5) return 0;         // Not enough rounds
  if (totalRounds <= 6) return 1;        // 5-6 rounds: use best 1
  if (totalRounds <= 8) return 2;        // 7-8 rounds: use best 2
  if (totalRounds <= 11) return 3;       // 9-11 rounds: use best 3
  if (totalRounds <= 14) return 4;       // 12-14 rounds: use best 4
  if (totalRounds <= 16) return 5;       // 15-16 rounds: use best 5
  if (totalRounds <= 18) return 6;       // 17-18 rounds: use best 6
  if (totalRounds === 19) return 7;      // 19 rounds: use best 7
  return 8;                              // 20+ rounds: use best 8
}

/**
 * Calculate handicap from player scores using USGA system
 * @param scores - Array of ALL scores with raw score and par
 * @returns Calculated handicap or null if insufficient data
 */
export function calculateHandicap(scores: ScoreForHandicap[]): number | null {
  const totalRounds = scores.length;

  // Need at least 5 scores to calculate handicap per USGA
  if (totalRounds < 5) {
    return null;
  }

  // Calculate score differentials for each round
  // Differential = (Score - Par)
  const differentials = scores.map(score => score.raw_score - score.par);

  // Sort differentials to find the best ones (lowest/best)
  const sortedDifferentials = [...differentials].sort((a, b) => a - b);

  // Get number of best scores to use based on USGA guidelines
  const numBestScores = getUSGABestScoresCount(totalRounds);

  // Take the best differentials
  const bestDifferentials = sortedDifferentials.slice(0, numBestScores);

  // Calculate average of best differentials
  const averageDifferential = bestDifferentials.reduce((sum, diff) => sum + diff, 0) / bestDifferentials.length;

  // Apply the USGA 0.96 multiplier (96% of average for "bonus for excellence")
  const handicapIndex = averageDifferential * 0.96;

  // Round to 1 decimal place per USGA standards
  return Math.round(handicapIndex * 10) / 10;
}

/**
 * Get handicap display string
 * @param handicap - Handicap value
 * @returns Formatted handicap string with + or - prefix
 */
export function formatHandicap(handicap: number | null): string {
  if (handicap === null) {
    return 'N/A';
  }

  const sign = handicap > 0 ? '+' : '';
  return `${sign}${handicap.toFixed(1)}`;
}

/**
 * Calculate handicap category/level
 * @param handicap - Handicap value
 * @returns Category description
 */
export function getHandicapCategory(handicap: number | null): string {
  if (handicap === null) return 'Unrated';

  if (handicap <= 0) return 'Scratch or Better';
  if (handicap <= 5) return 'Low Handicap';
  if (handicap <= 10) return 'Mid Handicap';
  if (handicap <= 20) return 'Average Handicap';
  return 'High Handicap';
}
