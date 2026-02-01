'use client'

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ScoreChartProps {
  scores: Array<{
    date: string;
    score: number;
    par: number;
    courseName: string;
  }>;
}

export default function ScoreChart({ scores }: ScoreChartProps) {
  if (scores.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>At least 2 rounds needed to show trend</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [...scores].reverse().map((score) => ({
    date: score.date,
    score: score.score,
    par: score.par,
    courseName: score.courseName,
    displayDate: new Date(score.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  const totalPar = scores.reduce((sum, s) => sum + s.par, 0);
  const averagePar = totalPar / scores.length;

  const minScore = Math.min(...scores.map(s => s.score));
  const maxScore = Math.max(...scores.map(s => s.score));
  const yAxisMin = Math.floor(Math.min(minScore, averagePar) - 5);
  const yAxisMax = Math.ceil(Math.max(maxScore, averagePar) + 5);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const scoreDiff = data.score - data.par;
      const diffText = scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'E' : `${scoreDiff}`;
      const diffColor = scoreDiff > 0 ? 'text-red-600' : scoreDiff === 0 ? 'text-gray-600' : 'text-green-600';

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm">{data.courseName}</p>
          <p className="text-xs text-gray-600">{new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="font-medium">Score:</span> {data.score}
            </p>
            <p className="text-sm">
              <span className="font-medium">Par:</span> {data.par}
            </p>
            <p className={`text-sm font-semibold ${diffColor}`}>
              {diffText}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Score Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
              dataKey="displayDate"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[yAxisMin, yAxisMax]}
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={averagePar}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: 'Avg Par', position: 'right', fontSize: 11, fill: '#6b7280' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
