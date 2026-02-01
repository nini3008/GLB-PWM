'use client'

import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserActivityFeed, subscribeToScoreChanges } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';

interface ActivityFeedProps {
  userId: string;
}

const borderColors: Record<string, string> = {
  score: 'border-l-green-500',
  game: 'border-l-blue-500',
  achievement: 'border-l-amber-500',
};

export default function ActivityFeed({ userId }: ActivityFeedProps) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof getUserActivityFeed>>>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = () => {
    getUserActivityFeed(userId)
      .then(setItems)
      .catch(err => console.error('Failed to load activity feed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Real-time: refetch on any score change
  useEffect(() => {
    const unsubscribe = subscribeToScoreChanges('activity-feed', fetchActivity);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-1 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No recent activity in your seasons</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className={`border-l-4 ${borderColors[item.type]} pl-3 py-2`}
            >
              <p className="text-sm text-gray-800">
                <span className="font-semibold">{item.playerName}</span>{' '}
                {item.details}
              </p>
              <p className="text-xs text-gray-400">{formatRelativeTime(item.timestamp)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
