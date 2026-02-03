'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ChevronRight } from 'lucide-react';
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
  const router = useRouter();
  const [items, setItems] = useState<Awaited<ReturnType<typeof getUserActivityFeed>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchActivity = () => {
    setError(false);
    setLoading(true);
    getUserActivityFeed(userId)
      .then(setItems)
      .catch(err => {
        console.error('Failed to load activity feed:', err);
        setError(true);
      })
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

  const handleItemClick = (item: (typeof items)[0]) => {
    // Navigate based on activity type
    if (item.type === 'score') {
      router.push('/scores/view');
    } else if (item.type === 'game') {
      router.push('/leaderboard');
    } else if (item.type === 'achievement') {
      router.push('/leaderboard');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-red-700">Failed to load activity</span>
          <button onClick={fetchActivity} className="text-sm font-medium text-red-700 underline hover:no-underline">Retry</button>
        </div>
      ) : loading ? (
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
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              onClick={() => handleItemClick(item)}
              className={`border-l-4 ${borderColors[item.type]} pl-3 py-2 pr-2 rounded-r-lg cursor-pointer hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between group`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{item.playerName}</span>{' '}
                  {item.details}
                </p>
                <p className="text-xs text-gray-400">{formatRelativeTime(item.timestamp)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
