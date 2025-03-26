'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { recalculateBonusPoints, validateRoundCode, getGameScores } from '@/lib/supabase/client';

// Define types to match exact API response structure
type GameDetails = {
  id: string;
  name: string;
  courses: {
    id: string;
    name: string;
    par: number;
  };
};

// Type definition for the actual shape returned by getGameScores
type ApiScore = {
  id: string;
  game_id: string;
  player_id: string;
  raw_score: number;
  points: number;
  bonus_points: number;
  notes: string | null;
  submitted_at: string;
  profiles?: {
    username: string;
    profile_image_url: string | null;
  };
};

type UpdatedScore = {
  id: string;
  rawScore: number;
  oldBonus: number;
  newBonus: number;
};

type FailedUpdate = {
  id: string;
  error: string;
};

type RecalculationResult = {
  success: boolean;
  updatedScores: UpdatedScore[];
  failedUpdates: FailedUpdate[];
  message: string;
};

type BonusPointRecalculationProps = {
  onReturn: () => void;
};

export default function BonusPointRecalculation({ onReturn }: BonusPointRecalculationProps) {
  const [roundCode, setRoundCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [scores, setScores] = useState<ApiScore[]>([]);
  const [results, setResults] = useState<RecalculationResult | null>(null);

  // Step 1: Validate the round code and load current scores
  const handleValidateRoundCode = async () => {
    if (!roundCode) {
      toast.error('Please enter a round code');
      return;
    }

    setIsLoading(true);
    try {
      // Validate the round code and get game details
      const game = await validateRoundCode(roundCode);
      setGameDetails(game);
      
      // Load current scores - using type assertion to ensure compatibility
      const currentScores = await getGameScores(game.id);
      setScores(currentScores as ApiScore[]);
      
      toast.success('Round code validated', {
        description: `Found ${currentScores.length} scores for ${game.name}`
      });
    } catch (error: any) {
      toast.error('Error validating round code', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Recalculate bonus points
  const handleRecalculateBonusPoints = async () => {
    if (!gameDetails) {
      toast.error('Please validate a round code first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await recalculateBonusPoints(gameDetails.id);
      setResults(result);
      
      // Reload scores after recalculation
      const updatedScores = await getGameScores(gameDetails.id);
      setScores(updatedScores as ApiScore[]);
      
      if (result.success) {
        toast.success('Bonus points recalculated successfully', {
          description: `Updated ${result.updatedScores.length} scores`
        });
      } else {
        toast.error('Some updates failed', {
          description: `${result.updatedScores.length} succeeded, ${result.failedUpdates.length} failed`
        });
      }
    } catch (error: any) {
      toast.error('Error recalculating bonus points', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-700">Bonus Point Recalculation</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReturn} 
          className="flex items-center gap-2 transition-all hover:bg-green-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-green-800">Recalculate Bonus Points</CardTitle>
          <CardDescription>
            Fix bonus point assignments for a round - ensure only the lowest score gets the bonus point
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Step 1: Enter round code */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={roundCode}
                onChange={(e) => setRoundCode(e.target.value)}
                placeholder="Enter round code"
                className="uppercase font-medium"
              />
              <Button 
                onClick={handleValidateRoundCode}
                disabled={isLoading || !roundCode}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Validate Code
              </Button>
            </div>
            
            {gameDetails && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="font-medium text-blue-800">{gameDetails.name}</p>
                <p className="text-sm text-blue-600">
                  Course: {gameDetails.courses.name} (Par {gameDetails.courses.par})
                </p>
              </div>
            )}
          </div>
          
          {/* Current scores */}
          {scores.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Current Scores</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raw Score</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scores.sort((a, b) => a.raw_score - b.raw_score).map((score) => (
                      <tr key={score.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {score.profiles?.username || score.player_id}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {score.raw_score}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {score.points}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            score.bonus_points ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {score.bonus_points}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {score.points + score.bonus_points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Results after recalculation */}
          {results && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-800">Recalculation Results</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="text-sm text-gray-700">Updated {results.updatedScores.length} scores</p>
                </div>
                {results.failedUpdates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{results.failedUpdates.length} updates failed</p>
                  </div>
                )}
              </div>
              
              {results.updatedScores.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700">Updated Scores</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    {results.updatedScores.map((update, index) => (
                      <li key={index}>
                        Score {update.rawScore}: Bonus changed from {update.oldBonus} to {update.newBonus}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-gray-50 p-4 border-t">
          <Button
            onClick={handleRecalculateBonusPoints}
            disabled={isLoading || !gameDetails}
            className="ml-auto bg-green-600 hover:bg-green-700"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Recalculate Bonus Points
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}