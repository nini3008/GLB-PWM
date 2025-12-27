'use client'

import React, { useEffect, useState } from 'react';
import { Trophy, TrendingDown, Calendar, Award, Loader2, User as UserIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPlayerCardData } from '@/lib/supabase/client';
import BadgesDisplay from '@/components/player/BadgesDisplay';

interface PlayerCardProps {
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PlayerData {
  profile: {
    username: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    handicap: number | null;
    profile_image_url: string | null;
  };
  stats: {
    gamesPlayed: number;
    averageScore: number;
    bestScore: number | null;
    totalPoints: number;
  };
  recentScores: Array<{
    id: string;
    raw_score: number;
    points: number;
    bonus_points: number;
    submitted_at: string;
    game: {
      name: string;
      game_date: string;
      course: {
        name: string;
        par: number;
      };
    };
  }>;
  achievements: Array<{
    id: string;
    earned_at: string;
    season_id: string | null;
    achievements: {
      id: string;
      key: string;
      name: string;
      description: string;
      icon: string;
      category: string;
      tier: string;
    };
    seasons?: {
      name: string;
    } | null;
  }>;
}

export function PlayerCard({ playerId, isOpen, onClose }: PlayerCardProps) {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!isOpen || !playerId) return;

      setIsLoading(true);
      try {
        const data = await getPlayerCardData(playerId);
        setPlayerData(data);
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId, isOpen]);

  const getInitials = (username: string, firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (username: string, firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    return username;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {isLoading
              ? 'Loading player profile'
              : playerData
                ? `Player Profile - ${getDisplayName(
                    playerData.profile.username,
                    playerData.profile.first_name,
                    playerData.profile.last_name
                  )}`
                : 'Player Profile'
            }
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading player profile...</p>
          </div>
        ) : playerData ? (
          <>
            <div className="flex flex-col items-center gap-4 pb-6 border-b">
              <Avatar className="h-24 w-24 border-4 border-green-100">
                <AvatarImage src={playerData.profile.profile_image_url || undefined} />
                <AvatarFallback className="text-2xl bg-green-100 text-green-700">
                  {getInitials(
                    playerData.profile.username,
                    playerData.profile.first_name,
                    playerData.profile.last_name
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {getDisplayName(
                    playerData.profile.username,
                    playerData.profile.first_name,
                    playerData.profile.last_name
                  )}
                </h2>
                <p className="text-sm text-gray-500">@{playerData.profile.username}</p>
              </div>

              {/* Bio Section */}
              {playerData.profile.bio && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 w-full">
                  <div className="flex items-start gap-2">
                    <UserIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-1">About</p>
                      <p className="text-sm text-gray-700 italic leading-relaxed">
                        &ldquo;{playerData.profile.bio}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mt-2">
                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                  <Trophy className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-blue-600 font-medium mb-1">Games Played</p>
                  <p className="text-xl font-bold text-blue-900">{playerData.stats.gamesPlayed}</p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                  <TrendingDown className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-green-600 font-medium mb-1">Avg Score</p>
                  <p className="text-xl font-bold text-green-900">
                    {playerData.stats.averageScore ? playerData.stats.averageScore.toFixed(1) : 'N/A'}
                  </p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-100">
                  <Award className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-purple-600 font-medium mb-1">Best Score</p>
                  <p className="text-xl font-bold text-purple-900">
                    {playerData.stats.bestScore || 'N/A'}
                  </p>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg text-center border border-amber-100">
                  <Trophy className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs text-amber-600 font-medium mb-1">Handicap</p>
                  <p className="text-xl font-bold text-amber-900">
                    {playerData.profile.handicap !== null ? playerData.profile.handicap.toFixed(1) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs for Recent Scores and Achievements */}
            <Tabs defaultValue="scores" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scores">Recent Scores</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="scores" className="space-y-3 mt-4">
                {playerData.recentScores.length > 0 ? (
                  <div className="space-y-2">
                    {playerData.recentScores.slice(0, 10).map((score) => (
                      <div
                        key={score.id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{score.game.name}</p>
                            <p className="text-xs text-gray-500">
                              {score.game.course.name} • Par {score.game.course.par}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-700">{score.raw_score}</p>
                            <p className="text-xs text-gray-500">
                              {score.raw_score - score.game.course.par > 0 ? '+' : ''}
                              {score.raw_score - score.game.course.par}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{formatDate(score.game.game_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {score.points + score.bonus_points} pts
                            </Badge>
                            {score.bonus_points > 0 && (
                              <Badge className="bg-amber-500 text-white text-xs">
                                +{score.bonus_points} bonus
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No scores recorded yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="achievements" className="mt-4">
                {playerData.achievements.length > 0 ? (
                  <BadgesDisplay userAchievements={playerData.achievements} isLoading={false} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No achievements earned yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Failed to load player data</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
