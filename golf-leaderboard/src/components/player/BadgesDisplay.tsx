'use client'
// src/components/player/BadgesDisplay.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AchievementProgress } from '@/lib/utils/achievementProgress';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
}

interface UserAchievement {
  id: string;
  earned_at: string;
  season_id: string | null;
  achievements: Achievement;
  seasons?: {
    name: string;
  } | null;
}

interface BadgesDisplayProps {
  userAchievements: UserAchievement[];
  isLoading: boolean;
  allAchievements?: Achievement[];
  progress?: Map<string, AchievementProgress>;
}

export default function BadgesDisplay({
  userAchievements,
  isLoading,
  allAchievements,
  progress,
}: BadgesDisplayProps) {
  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get category emoji
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'milestone':
        return '🎯';
      case 'performance':
        return '⚡';
      case 'consistency':
        return '📊';
      case 'special':
        return '⭐';
      default:
        return '🏆';
    }
  };

  // Dynamically get Lucide icon
  const getIcon = (iconName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-5 w-5" /> : <LucideIcons.Award className="h-5 w-5" />;
  };

  // Determine which achievements to show
  const earnedAchievementKeys = new Set(userAchievements.map(ua => ua.achievements.key));

  // If allAchievements provided, compute earned and locked
  const earnedAchievements = userAchievements;
  const lockedAchievements = allAchievements
    ? allAchievements.filter(a => !earnedAchievementKeys.has(a.key))
    : [];

  // Group earned achievements by category
  const groupedEarnedAchievements = earnedAchievements.reduce((acc, ua) => {
    const category = ua.achievements.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ua);
    return acc;
  }, {} as Record<string, UserAchievement[]>);

  // Group locked achievements by category
  const groupedLockedAchievements = lockedAchievements.reduce((acc, a) => {
    const category = a.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(a);
    return acc;
  }, {} as Record<string, Achievement[]>);

  // Combine categories
  const allCategories = new Set([
    ...Object.keys(groupedEarnedAchievements),
    ...Object.keys(groupedLockedAchievements),
  ]);

  if (isLoading) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
            <LucideIcons.Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userAchievements.length === 0 && !allAchievements) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
            <LucideIcons.Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <LucideIcons.Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700">No achievements yet</h3>
            <p className="text-gray-500 mt-2">
              Play more games to unlock achievements!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
            <LucideIcons.Award className="h-5 w-5" />
            Achievements
          </CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {userAchievements.length} {allAchievements ? `/ ${allAchievements.length}` : 'Earned'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from(allCategories).map((category) => {
            const earned = groupedEarnedAchievements[category] || [];
            const locked = groupedLockedAchievements[category] || [];

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span>{getCategoryEmoji(category)}</span>
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Earned achievements first */}
                  {earned.map((ua) => (
                    <div
                      key={ua.id}
                      className={`p-4 rounded-lg border-2 ${getTierColor(ua.achievements.tier)} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getIcon(ua.achievements.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">
                              {ua.achievements.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getTierColor(ua.achievements.tier)} capitalize`}
                            >
                              {ua.achievements.tier}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            {ua.achievements.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {formatDate(ua.earned_at)}
                            </span>
                            {ua.seasons && (
                              <span className="text-xs bg-white/50 px-2 py-0.5 rounded">
                                {ua.seasons.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Locked achievements */}
                  {locked.map((a) => {
                    const progressData = progress?.get(a.key);

                    return (
                      <div
                        key={a.id}
                        className="p-4 rounded-lg border-2 opacity-60 bg-gray-50 border-gray-200 transition-all hover:opacity-75"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 relative">
                            <div className="opacity-40">
                              {getIcon(a.icon)}
                            </div>
                            <LucideIcons.Lock className="h-3 w-3 absolute -top-1 -right-1 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm truncate text-gray-700">
                                {a.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-xs bg-gray-100 text-gray-600 border-gray-300 capitalize"
                              >
                                {a.tier}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {a.description}
                            </p>

                            {/* Progress bar if progress data exists */}
                            {progressData && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, (progressData.current / progressData.target) * 100)}%`
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {progressData.label}: {progressData.current}/{progressData.target}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
