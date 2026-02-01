'use client'
// src/components/admin/ManageSeasonsView.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Trophy
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Season {
  id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  participant_count?: number;
}

interface ManageSeasonsViewProps {
  onReturn: () => void;
}

export default function ManageSeasonsView({ onReturn }: ManageSeasonsViewProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingSeasonId, setUpdatingSeasonId] = useState<string | null>(null);

  // Fetch all seasons
  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    setIsLoading(true);
    try {
      // Get all seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

      if (seasonsError) throw seasonsError;

      // Get participant counts for each season
      const seasonsWithCounts = await Promise.all(
        (seasonsData || []).map(async (season) => {
          const { count, error } = await supabase
            .from('season_participants')
            .select('*', { count: 'exact', head: true })
            .eq('season_id', season.id);

          if (error) {
            console.error('Error fetching participant count:', error);
            return { ...season, participant_count: 0 };
          }

          return { ...season, participant_count: count || 0 };
        })
      );

      setSeasons(seasonsWithCounts);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      toast.error('Failed to load seasons', {
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle season active status
  const toggleSeasonStatus = async (seasonId: string, currentStatus: boolean) => {
    setUpdatingSeasonId(seasonId);
    try {
      const { error } = await supabase
        .from('seasons')
        .update({ is_active: !currentStatus })
        .eq('id', seasonId);

      if (error) throw error;

      // Update local state
      setSeasons(seasons.map(season =>
        season.id === seasonId
          ? { ...season, is_active: !currentStatus }
          : season
      ));

      toast.success(
        !currentStatus ? 'Season activated' : 'Season deactivated',
        {
          description: !currentStatus
            ? 'Players can now join and submit scores.'
            : 'Season is now archived. Players can still view data.',
        }
      );
    } catch (error) {
      console.error('Error updating season:', error);
      toast.error('Failed to update season', {
        description: 'Please try again.',
      });
    } finally {
      setUpdatingSeasonId(null);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Manage Seasons
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={onReturn}
          className="flex items-center gap-2 transition-all hover:bg-green-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardTitle className="text-xl font-bold">
            All Seasons
          </CardTitle>
          <CardDescription className="text-green-100 mt-1">
            View and manage season status (active/inactive)
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : seasons.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-xl font-medium text-gray-700">No seasons yet</h3>
              <p className="text-gray-500 mt-2">
                Create your first season using the &quot;Create Season&quot; feature.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {seasons.map((season) => (
                <div
                  key={season.id}
                  className={`p-5 rounded-lg border-2 transition-all ${
                    season.is_active
                      ? 'bg-green-50 border-green-200 hover:border-green-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {season.name}
                        </h3>
                        {season.is_active ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Code:</span>
                          <code className="bg-white px-2 py-1 rounded border text-xs font-mono">
                            {season.code}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{season.participant_count || 0} players</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {formatDate(season.start_date)}</span>
                        </div>
                        {season.end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>End: {formatDate(season.end_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => toggleSeasonStatus(season.id, season.is_active)}
                        disabled={updatingSeasonId === season.id}
                        variant={season.is_active ? 'outline' : 'default'}
                        className={
                          season.is_active
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }
                      >
                        {updatingSeasonId === season.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : season.is_active ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && seasons.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Active seasons</strong> allow players to join and submit scores.
                <strong> Inactive seasons</strong> are archived but data remains accessible.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
