// src/components/admin/ManageGamesView.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { supabase, updateGameStatus } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Flag, Ticket, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// Define interface for game data
interface Game {
  id: string;
  name: string;
  game_date: string;
  round_code: string;
  status: 'active' | 'completed';
  courses: {
    name: string;
  };
  seasons: {
    name: string;
  };
}

export default function ManageGamesView({ onReturn }: { onReturn: () => void }) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
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

  // Move the updateGameStatus function out of the useEffect
  const handleGameStatusUpdate = async (gameId: string, status: 'active' | 'completed') => {
    try {
      // Show loading state
      toast.loading("Updating game status...");
      await updateGameStatus(gameId, status);
      // Refresh the games list
      loadGames();
      toast.success("Game status updated");
    } catch (error) {
      toast.error("Failed to update game status");
      console.error(error);
    }
  };

  const loadGames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          id, name, game_date, round_code, status,
          courses(name),
          seasons(name)
        `)
        .order('game_date', { ascending: false });
        
      if (error) {
        console.error('Error loading games:', error);
        throw error;
      }
      
      setGames(data as Game[] || []);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadGames();
  }, []);

  // Status badge render helper
  const renderStatusBadge = (status: 'active' | 'completed') => {
    return status === 'active' ? (
      <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
        Completed
      </Badge>
    );
  };

  // Mobile card view
  const renderMobileGameCard = (game: Game) => {
    return (
      <Card key={game.id} className="mb-4 overflow-hidden">
        <div className={`h-1 w-full ${game.status === 'active' ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium text-base">{game.name}</h3>
              <p className="text-sm text-gray-500">{game.courses.name}</p>
            </div>
            {renderStatusBadge(game.status)}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
              <span>{new Date(game.game_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Flag className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
              <span>{game.seasons.name}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <div className="flex items-center">
              <Ticket className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              <span className="font-mono font-bold">{game.round_code}</span>
            </div>
            
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGameStatusUpdate(
                  game.id, 
                  game.status === 'active' ? 'completed' : 'active'
                )}
                className="h-8 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {game.status === 'active' ? 'Complete' : 'Reactivate'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading skeleton for mobile view
  const renderMobileLoadingSkeleton = () => {
    return Array(3).fill(0).map((_, i) => (
      <Card key={i} className="mb-4">
        <div className="h-1 w-full bg-gray-200"></div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </CardContent>
      </Card>
    ));
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl sm:text-2xl text-green-700 flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Manage Games & Codes
          </CardTitle>
          <CardDescription className="text-sm mt-1 hidden sm:block">
            View and manage your golf rounds and access codes
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
        {loading ? (
          isMobile ? (
            renderMobileLoadingSkeleton()
          ) : (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-t-4 border-b-4 border-green-500 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading games...</p>
            </div>
          )
        ) : games.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Flag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No games have been created yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile view (cards) */}
            {isMobile ? (
              <div>
                {games.map(game => renderMobileGameCard(game))}
              </div>
            ) : (
              /* Desktop view (table) */
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Round Code</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map(game => (
                      <TableRow key={game.id} className="hover:bg-gray-50">
                        <TableCell>{new Date(game.game_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{game.name}</TableCell>
                        <TableCell>{game.courses.name}</TableCell>
                        <TableCell>{game.seasons.name}</TableCell>
                        <TableCell className="font-mono font-bold">{game.round_code}</TableCell>
                        <TableCell>
                          {renderStatusBadge(game.status)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGameStatusUpdate(
                                game.id, 
                                game.status === 'active' ? 'completed' : 'active'
                              )}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              {game.status === 'active' ? 'Complete' : 'Reactivate'}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}