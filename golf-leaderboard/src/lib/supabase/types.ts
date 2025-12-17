// src/lib/supabase/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          name: string
          location: string | null
          par: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          par: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          par?: number
          created_at?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          id: string
          name: string
          course_id: string
          season_id: string
          round_code: string
          game_date: string
          created_by: string
          created_at: string
          status: string;
        }
        Insert: {
          id?: string
          name: string
          course_id: string
          season_id: string
          round_code: string
          game_date: string
          created_by: string
          created_at?: string
          status: string;
        }
        Update: {
          id?: string
          name?: string
          course_id?: string
          season_id?: string
          round_code?: string
          game_date?: string
          created_by?: string
          created_at?: string
          status: string;
        }
        Relationships: [
          {
            foreignKeyName: "games_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_season_id_fkey"
            columns: ["season_id"]
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string
          first_name: string | null
          last_name: string | null
          email: string
          handicap: number | null
          bio: string | null
          profile_image_url: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          first_name?: string | null
          last_name?: string | null
          email: string
          handicap?: number | null
          bio?: string | null
          profile_image_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          handicap?: number | null
          bio?: string | null
          profile_image_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      scores: {
        Row: {
          id: string
          game_id: string
          player_id: string
          raw_score: number
          points: number
          bonus_points: number
          notes: string | null
          submitted_at: string
          edited_by: string | null
          edited_at: string | null
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          raw_score: number
          points: number
          bonus_points?: number
          notes?: string | null
          submitted_at?: string
          edited_by?: string | null
          edited_at?: string | null
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          raw_score?: number
          points?: number
          bonus_points?: number
          notes?: string | null
          submitted_at?: string
          edited_by?: string | null
          edited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_edited_by_fkey"
            columns: ["edited_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_game_id_fkey"
            columns: ["game_id"]
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      season_participants: {
        Row: {
          id: string
          season_id: string
          player_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          season_id: string
          player_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          player_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_participants_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_participants_season_id_fkey"
            columns: ["season_id"]
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          }
        ]
      }
      achievements: {
        Row: {
          id: string
          key: string
          name: string
          description: string
          icon: string
          category: string
          tier: string
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          description: string
          icon: string
          category: string
          tier?: string
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          description?: string
          icon?: string
          category?: string
          tier?: string
          created_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
          season_id: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
          season_id?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
          season_id?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_season_id_fkey"
            columns: ["season_id"]
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          }
        ]
      }
      seasons: {
        Row: {
          id: string
          name: string
          code: string
          start_date: string
          end_date: string | null
          created_by: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          code: string
          start_date: string
          end_date?: string | null
          created_by: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          code?: string
          start_date?: string
          end_date?: string | null
          created_by?: string
          created_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "seasons_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      season_leaderboard: {
        Row: {
          season_id: string | null
          season_name: string | null
          player_id: string | null
          username: string | null
          profile_image_url: string | null
          games_played: number | null
          total_points: number | null
          avg_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_created_by_fkey"
            columns: ["season_id"]
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["player_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      calculate_points: {
        Args: {
          raw_score: number
          par: number
        }
        Returns: number
      }
    }
  }
}