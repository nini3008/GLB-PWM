'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Flag, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface RoundRecapProps {
  recap: {
    game: {
      name: string;
      game_date: string
    };
    course: {
      name: string;
      par: number
    };
    scores: Array<{
      player: {
        username: string;
        profile_image_url: string | null
      };
      score: number;
      points: number;
      bonus_points: number;
      notes: string | null;
    }>;
  };
}

export default function RoundRecap({ recap }: RoundRecapProps) {
  const sortedScores = [...recap.scores].sort((a, b) => a.score - b.score);
  const winningScore = sortedScores[0]?.score;

  const getScoreDiff = (score: number) => {
    const diff = score - recap.course.par;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const getScoreBadgeVariant = (score: number) => {
    const diff = score - recap.course.par;
    if (diff < 0) return 'default';
    if (diff === 0) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-xl mb-1">{recap.game.name}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(recap.game.game_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flag className="h-3.5 w-3.5" />
                <span>{recap.course.name} (Par {recap.course.par})</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {sortedScores.map((scoreEntry, index) => {
            const isWinner = scoreEntry.score === winningScore;
            const totalPoints = scoreEntry.points + (scoreEntry.bonus_points || 0);
            const scoreDiff = getScoreDiff(scoreEntry.score);

            return (
              <div
                key={index}
                className={`
                  p-4 rounded-lg border transition-colors
                  ${isWinner ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}
                `}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {isWinner ? (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-yellow-900">
                          <Trophy className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${isWinner ? 'text-yellow-900' : ''}`}>
                          {scoreEntry.player.username}
                        </span>
                        {isWinner && (
                          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                            Winner
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xl font-bold">{scoreEntry.score}</span>
                          <Badge variant={getScoreBadgeVariant(scoreEntry.score)} className="text-xs">
                            {scoreDiff}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{totalPoints}</span> pts
                          {scoreEntry.bonus_points > 0 && (
                            <span className="text-green-600 ml-1">
                              (+{scoreEntry.bonus_points} bonus)
                            </span>
                          )}
                        </div>
                      </div>

                      {scoreEntry.notes && (
                        <div className="mt-2 flex items-start gap-1.5 text-sm">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground italic">{scoreEntry.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedScores.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No scores recorded for this round.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
