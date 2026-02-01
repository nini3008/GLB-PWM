'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, updatePlayerHandicap } from '@/lib/supabase/client';
import { useNavigation } from '@/hooks/useNavigation';
import { toast } from 'sonner';

export default function RecalculateHandicaps() {
  const nav = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });

  const recalculateAll = async () => {
    setIsProcessing(true);
    setResults({ success: 0, failed: 0, errors: [] });

    try {
      // Get all player IDs
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username');

      if (error) throw error;

      const total = profiles.length;
      setProgress({ current: 0, total });

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Recalculate each player's handicap
      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        try {
          const newHandicap = await updatePlayerHandicap(profile.id);
          console.log(`${profile.username}: Handicap updated to ${newHandicap}`);
          successCount++;
          toast.success(`${profile.username}: ${newHandicap}`, { duration: 1500 });
        } catch (error) {
          failedCount++;
          const errorMsg = `${profile.username}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`Failed to update ${profile.username}:`, error);
        }
        setProgress({ current: i + 1, total });
        setResults({ success: successCount, failed: failedCount, errors });
      }

      toast.success('Handicap recalculation complete!', {
        description: `${successCount} players updated successfully`
      });
    } catch (error) {
      console.error('Error recalculating handicaps:', error);
      toast.error('Failed to recalculate handicaps', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
          <RefreshCw className="h-8 w-8" />
          Recalculate Handicaps
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={nav.goToDashboard}
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardTitle>Recalculate All Player Handicaps</CardTitle>
          <CardDescription className="text-green-100">
            This will recalculate handicaps for all players using the current USGA formula
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">What this does:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Fetches all player scores from database</li>
              <li>Calculates handicap using USGA system (best 8 of all rounds)</li>
              <li>Updates each player&apos;s profile with new handicap</li>
              <li>Shows progress and results</li>
            </ul>
          </div>

          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Processing... {progress.current} of {progress.total}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">{results.success} Success</span>
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">{results.failed} Failed</span>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded border border-red-200 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {results.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!isProcessing && progress.total > 0 && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Complete!</h3>
              <p className="text-green-800">
                Successfully updated {results.success} player handicaps
              </p>
              {results.failed > 0 && (
                <p className="text-red-600 mt-2">
                  {results.failed} players failed to update
                </p>
              )}
            </div>
          )}

          <Button
            onClick={recalculateAll}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recalculate All Handicaps
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
