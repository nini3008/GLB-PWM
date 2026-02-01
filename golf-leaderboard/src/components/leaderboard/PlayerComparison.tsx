'use client'

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy } from 'lucide-react';
import { getHeadToHead } from '@/lib/supabase/client';

interface PlayerComparisonProps {
  player1Id: string;
  player2Id: string;
  seasonId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface HeadToHeadData {
  player1: {
    username: string;
    profile_image_url: string | null;
    gamesPlayed: number;
    avgScore: number;
    totalPoints: number;
    bestScore: number | null
  };
  player2: {
    username: string;
    profile_image_url: string | null;
    gamesPlayed: number;
    avgScore: number;
    totalPoints: number;
    bestScore: number | null
  };
  sharedGames: Array<{
    gameName: string;
    gameDate: string;
    p1Score: number;
    p2Score: number;
    winner: 'p1' | 'p2' | 'tie'
  }>;
  record: {
    p1Wins: number;
    p2Wins: number;
    ties: number
  };
}

export default function PlayerComparison({ player1Id, player2Id, seasonId, isOpen, onClose }: PlayerComparisonProps) {
  const [data, setData] = useState<HeadToHeadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && player1Id && player2Id && seasonId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, player1Id, player2Id, seasonId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await getHeadToHead(player1Id, player2Id, seasonId);
      setData(result);
    } catch (err) {
      console.error('Error loading head-to-head data:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const StatBar = ({
    label,
    value1,
    value2,
    format = (v: number) => v.toString(),
    reverse = false
  }: {
    label: string;
    value1: number;
    value2: number;
    format?: (v: number) => string;
    reverse?: boolean;
  }) => {
    const max = Math.max(value1, value2);
    const percentage1 = max > 0 ? (value1 / max) * 100 : 50;
    const percentage2 = max > 0 ? (value2 / max) * 100 : 50;

    const better1 = reverse ? value1 < value2 : value1 > value2;
    const better2 = reverse ? value2 < value1 : value2 > value1;

    return (
      <div className="mb-6">
        <div className="text-sm font-medium text-center mb-2">{label}</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-right">
            <div className="mb-1">
              <span className={`text-lg font-bold ${better1 ? 'text-green-600' : ''}`}>
                {format(value1)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${better1 ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-300`}
                style={{ width: `${percentage1}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-1">
              <span className={`text-lg font-bold ${better2 ? 'text-green-600' : ''}`}>
                {format(value2)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${better2 ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-300`}
                style={{ width: `${percentage2}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Player Comparison</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={data.player1.profile_image_url || undefined} />
                  <AvatarFallback className="text-lg">{getInitials(data.player1.username)}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{data.player1.username}</h3>
              </div>

              <div className="text-center px-4">
                <div className="text-3xl font-bold text-gray-400">VS</div>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={data.player2.profile_image_url || undefined} />
                  <AvatarFallback className="text-lg">{getInitials(data.player2.username)}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{data.player2.username}</h3>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center mb-4">
                <h4 className="font-semibold text-sm text-gray-600 mb-2">HEAD-TO-HEAD RECORD</h4>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={data.record.p1Wins > data.record.p2Wins ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                    {data.record.p1Wins}
                  </Badge>
                  <span className="text-gray-400">-</span>
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {data.record.ties}
                  </Badge>
                  <span className="text-gray-400">-</span>
                  <Badge variant={data.record.p2Wins > data.record.p1Wins ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                    {data.record.p2Wins}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <StatBar
                label="Games Played"
                value1={data.player1.gamesPlayed}
                value2={data.player2.gamesPlayed}
              />

              <StatBar
                label="Average Score"
                value1={data.player1.avgScore}
                value2={data.player2.avgScore}
                format={(v) => v.toFixed(1)}
                reverse
              />

              <StatBar
                label="Total Points"
                value1={data.player1.totalPoints}
                value2={data.player2.totalPoints}
              />

              <StatBar
                label="Best Score"
                value1={data.player1.bestScore || 999}
                value2={data.player2.bestScore || 999}
                reverse
              />
            </div>

            {data.sharedGames.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Shared Games ({data.sharedGames.length})
                </h4>
                <div className="space-y-2">
                  {data.sharedGames.map((game, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{game.gameName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(game.gameDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${game.winner === 'p1' ? 'text-green-600' : 'text-gray-600'}`}>
                          {game.p1Score}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className={`font-bold ${game.winner === 'p2' ? 'text-green-600' : 'text-gray-600'}`}>
                          {game.p2Score}
                        </span>
                        {game.winner === 'tie' && (
                          <Badge variant="outline" className="ml-2">Tie</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.sharedGames.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p>These players haven&apos;t competed in the same games yet.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
