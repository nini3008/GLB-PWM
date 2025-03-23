'use client'
// src/components/leaderboard/LeaderboardTable.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Trophy, Medal, ArrowLeft, Users, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSeasonLeaderboard, supabase } from '@/lib/supabase/client';

// Types for leaderboard data
interface LeaderboardPlayer {
    player_id: string;
    username: string;
    profile_image_url: string | null;
    games_played: number;
    total_points: number;
    avg_score: number;
  }

interface Season {
    id: string;
    name: string;
    code: string;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
  }

interface LeaderboardProps {
  seasonId?: string;
  onReturn: () => void;
}

export function LeaderboardTable({ seasonId, onReturn }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(seasonId);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check viewport size on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch seasons list from supabase
  useEffect(() => {
    const fetchSeasons = async () => {
      setLoadingSeasons(true);
      try {
        // Get active seasons from Supabase
        const { data, error } = await supabase
          .from('seasons')
          .select('id, name, code, start_date, end_date, is_active')
          .order('start_date', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSeasons(data);
          // Set the first season as default if none provided
          if (!selectedSeason) {
            setSelectedSeason(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
      } finally {
        setLoadingSeasons(false);
      }
    };

    fetchSeasons();
  }, []);

  // Fetch leaderboard data when season changes
  useEffect(() => {
    if (!selectedSeason) return;
    
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const rawData = await getSeasonLeaderboard(selectedSeason);
        
        // Filter out any entries with null player_id and transform the data
        const validData = rawData
          .filter(item => item.player_id !== null)
          .map(item => ({
            player_id: item.player_id as string, // Type assertion since we filtered nulls
            username: item.username || 'Unknown Player',
            profile_image_url: item.profile_image_url,
            games_played: item.games_played || 0,
            total_points: item.total_points || 0,
            avg_score: item.avg_score || 0
          }));
        
        // Explicitly sort the data by total_points in descending order to ensure correct ranking
        const sortedData = validData.sort((a, b) => b.total_points - a.total_points);
        setLeaderboardData(sortedData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchLeaderboard();
  }, [selectedSeason]);

  // Get rank badge/icon
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-400 text-white">
            <Trophy className="h-4 w-4" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 text-white">
            <Medal className="h-4 w-4" />
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-700 text-white">
            <Medal className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700">
            <span className="font-semibold">{rank}</span>
          </div>
        );
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Mobile card view for leaderboard
  const renderMobileLeaderboard = () => {
    if (loading) {
      return Array(5).fill(0).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg mb-3 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="flex justify-between mt-3 text-sm text-gray-500">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ));
    }

    if (leaderboardData.length === 0) {
      return (
        <div className="text-center p-8 border rounded-lg">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No data available for this season</p>
        </div>
      );
    }

    return leaderboardData.map((player, index) => (
      <div 
        key={player.player_id} 
        className={`p-4 border rounded-lg mb-3 ${index < 3 ? "bg-green-50 border-green-100" : "bg-white"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getRankDisplay(index + 1)}
            <Avatar>
              <AvatarImage 
                src={player.profile_image_url || undefined} 
                alt={player.username} 
              />
              <AvatarFallback className="bg-green-100 text-green-700">
                {getInitials(player.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{player.username}</p>
              {index === 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 mt-1">
                  Leader
                </Badge>
              )}
            </div>
          </div>
          <span className="text-lg font-bold">{player.total_points}</span>
        </div>
        <div className="flex justify-between mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {player.games_played} games
          </span>
          <span>Avg: {player.avg_score.toFixed(1)}</span>
        </div>
      </div>
    ));
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            See who's leading the competition
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReturn}
          className="self-start sm:self-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </CardHeader>
      
      <CardContent className="px-3 sm:px-6">
        {/* Season selector */}
        <div className="mb-6">
          <Select
            value={selectedSeason}
            onValueChange={(value) => setSelectedSeason(value)}
            disabled={loadingSeasons}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingSeasons ? "Loading seasons..." : "Select a season"} />
            </SelectTrigger>
            <SelectContent>
              {seasons.length === 0 ? (
                <SelectItem value="none" disabled>No seasons available</SelectItem>
              ) : (
                seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Mobile view */}
        {isMobile ? (
          <div className="space-y-1">
            {renderMobileLeaderboard()}
          </div>
        ) : (
          /* Desktop table view */
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="text-right">Avg. Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : leaderboardData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No data available for this season
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboardData.map((player, index) => (
                    <TableRow 
                      key={player.player_id}
                      className={index < 3 ? "bg-green-50" : undefined}
                    >
                      <TableCell>{getRankDisplay(index + 1)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage 
                              src={player.profile_image_url || undefined} 
                              alt={player.username} 
                            />
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {getInitials(player.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.username}</p>
                            {index === 0 && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Leader
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {player.total_points}
                      </TableCell>
                      <TableCell className="text-right">
                        {player.games_played}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {player.avg_score.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {!loading && leaderboardData.length > 0 && (
          <div className="flex items-center justify-center mt-4 text-xs text-gray-500 px-2">
            <Info className="h-3 w-3 mr-1 flex-shrink-0" />
            <p className="text-center">
              Points are calculated based on your scores relative to par. 
              The lower your score, the more points you earn.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}