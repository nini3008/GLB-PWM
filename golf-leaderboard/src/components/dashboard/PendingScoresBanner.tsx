'use client'

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { getUserPendingGames } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface PendingScoresBannerProps {
  userId: string;
  onNavigateToEnterScore: () => void;
}

export default function PendingScoresBanner({ userId, onNavigateToEnterScore }: PendingScoresBannerProps) {
  const [games, setGames] = useState<Awaited<ReturnType<typeof getUserPendingGames>>>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getUserPendingGames(userId)
      .then(setGames)
      .catch(err => console.error('Failed to load pending games:', err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || games.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="font-semibold text-amber-800">
            You have {games.length} unsubmitted score{games.length !== 1 ? 's' : ''}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {games.map(game => (
            <div key={game.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
              <div>
                <p className="font-medium text-gray-800 text-sm">{game.name}</p>
                <p className="text-xs text-gray-500">
                  {game.course_name} &middot; {formatDate(game.game_date)}
                </p>
              </div>
              <button
                onClick={onNavigateToEnterScore}
                className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Enter Score
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
