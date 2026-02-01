'use client'

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, TrendingDown, TrendingUp, MapPin, Award } from 'lucide-react';

interface PlayerStatsProps {
  scores: Array<{
    raw_score: number;
    games: {
      courses: {
        name: string;
        par: number;
      };
    };
  }>;
}

export default function PlayerStats({ scores }: PlayerStatsProps) {
  if (scores.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              No scores recorded yet
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allScores = scores.map(s => s.raw_score);
  const bestScore = Math.min(...allScores);

  let improvement = 0;
  let improvementText = 'N/A';
  let isImproving = false;

  if (scores.length >= 6) {
    const firstThree = scores.slice(0, 3).map(s => s.raw_score);
    const lastThree = scores.slice(-3).map(s => s.raw_score);
    const firstAvg = firstThree.reduce((a, b) => a + b, 0) / 3;
    const lastAvg = lastThree.reduce((a, b) => a + b, 0) / 3;
    improvement = firstAvg - lastAvg;
    isImproving = improvement > 0;
    improvementText = `${improvement > 0 ? '-' : '+'}${Math.abs(improvement).toFixed(1)} strokes`;
  } else if (scores.length >= 2) {
    const firstScore = scores[0].raw_score;
    const lastScore = scores[scores.length - 1].raw_score;
    improvement = firstScore - lastScore;
    isImproving = improvement > 0;
    improvementText = `${improvement > 0 ? '-' : '+'}${Math.abs(improvement).toFixed(1)} strokes`;
  }

  const courseFrequency = scores.reduce((acc, score) => {
    const courseName = score.games.courses.name;
    acc[courseName] = (acc[courseName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostPlayedCourse = Object.entries(courseFrequency).reduce(
    (max, [course, count]) => (count > max.count ? { course, count } : max),
    { course: '', count: 0 }
  );

  const courseAverages = scores.reduce((acc, score) => {
    const courseName = score.games.courses.name;
    if (!acc[courseName]) {
      acc[courseName] = { total: 0, count: 0, par: score.games.courses.par };
    }
    acc[courseName].total += score.raw_score;
    acc[courseName].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number; par: number }>);

  const bestCourseEntry = Object.entries(courseAverages).reduce(
    (best, [course, data]) => {
      const avg = data.total / data.count;
      const relativeToPar = avg - data.par;
      if (!best.course || relativeToPar < best.relativeToPar) {
        return { course, avg, relativeToPar };
      }
      return best;
    },
    { course: '', avg: 0, relativeToPar: Infinity }
  );

  const statCards = [
    {
      icon: Trophy,
      label: 'Best Score',
      value: bestScore.toString(),
      color: 'text-yellow-600'
    },
    {
      icon: Award,
      label: 'Best Course',
      value: bestCourseEntry.course || 'N/A',
      subValue: bestCourseEntry.course ? `${bestCourseEntry.avg.toFixed(1)} avg` : undefined,
      color: 'text-green-600'
    },
    {
      icon: isImproving ? TrendingDown : TrendingUp,
      label: 'Improvement',
      value: improvementText,
      color: isImproving ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'
    },
    {
      icon: MapPin,
      label: 'Most Played',
      value: mostPlayedCourse.course || 'N/A',
      subValue: mostPlayedCourse.count > 0 ? `${mostPlayedCourse.count} rounds` : undefined,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.subValue && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
                  )}
                </div>
                <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
