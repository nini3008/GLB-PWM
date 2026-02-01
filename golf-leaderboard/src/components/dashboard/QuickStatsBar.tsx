'use client'

import React, { useEffect, useState } from 'react';
import { Trophy, Award, Calendar, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserCurrentSeasonStats } from '@/lib/supabase/client';

interface QuickStatsBarProps {
  userId: string;
}

export default function QuickStatsBar({ userId }: QuickStatsBarProps) {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getUserCurrentSeasonStats>>>(undefined as unknown as null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserCurrentSeasonStats(userId)
      .then(setStats)
      .catch(err => console.error('Failed to load stats:', err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100 text-center text-gray-500">
        Join a season to track your stats
      </div>
    );
  }

  const items = [
    { icon: Trophy, label: 'Season Rank', value: stats.rank ? `#${stats.rank} of ${stats.totalPlayers}` : '—', color: 'text-yellow-600 bg-yellow-50' },
    { icon: Award, label: 'Total Points', value: stats.totalPoints, color: 'text-green-600 bg-green-50' },
    { icon: Calendar, label: 'Games Played', value: stats.gamesPlayed, color: 'text-blue-600 bg-blue-50' },
    { icon: TrendingUp, label: 'Avg Score', value: stats.avgScore !== null ? Number(stats.avgScore).toFixed(1) : '—', color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stats.seasonName}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-md ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
