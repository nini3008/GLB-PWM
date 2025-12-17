'use client'
// src/components/player/BadgesDisplay.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';

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
}

export default function BadgesDisplay({ userAchievements, isLoading }: BadgesDisplayProps) {
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

  // Group achievements by category
  const groupedAchievements = userAchievements.reduce((acc, ua) => {
    const category = ua.achievements.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ua);
    return acc;
  }, {} as Record<string, UserAchievement[]>);

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

  if (userAchievements.length === 0) {
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
            {userAchievements.length} Earned
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedAchievements).map(([category, achievements]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span>{getCategoryEmoji(category)}</span>
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((ua) => (
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
                            {new Date(ua.earned_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
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
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
