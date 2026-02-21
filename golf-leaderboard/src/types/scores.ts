// src/types/scores.ts
// Shared types for score-related components

export interface ScoreWithPlayer {
  id: string;
  player_id: string;
  raw_score: number;
  points: number;
  bonus_points: number;
  notes: string | null;
  submitted_at: string;
  profiles: {
    username: string;
    profile_image_url: string | null;
  };
}

export interface GameWithCourse {
  id: string;
  name: string;
  game_date: string;
  courses: {
    id: string;
    name: string;
    par: number;
  };
}

export interface RoundRecap {
  game: {
    name: string;
    game_date: string;
  };
  course: {
    name: string;
    par: number;
  };
  scores: Array<{
    player: {
      username: string;
      profile_image_url: string | null;
    };
    score: number;
    points: number;
    bonus_points: number;
    notes: string | null;
  }>;
}

export interface UserSeason {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

// Type for rounds used in getRecentRounds
export interface RoundData {
  game_date: string;
  [key: string]: unknown;
}

// Utility type guard for filtering valid scores
export function isValidScore<T extends { id?: string; player_id?: string }>(
  score: T
): score is T & { id: string; player_id: string } {
  return Boolean(score.id && score.player_id);
}

// Filter utility for valid scores
export function filterValidScores<T extends { id?: string; player_id?: string }>(
  scores: T[]
): Array<T & { id: string; player_id: string }> {
  return scores.filter(isValidScore);
}
