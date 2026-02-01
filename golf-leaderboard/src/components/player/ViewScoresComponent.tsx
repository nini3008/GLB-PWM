'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from '@/components/ui/table';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, AlertCircle, ChevronDown, Calendar, Flag, ClipboardCheck } from 'lucide-react';
import {
  getGameScores,
  validateRoundCode,
} from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

// Types
interface ScoreWithPlayer {
  id: string;
  player_id: string;
  raw_score: number;
  points: number;
  bonus_points: number;
  notes: string | null;
  submitted_at: string;
  profiles: {
    username: string;
    profile_image_url: string | null;
  };
}

interface GameWithCourse {
  id: string;
  name: string;
  game_date: string;
  courses: {
    id: string;
    name: string;
    par: number;
  };
}

export default function ViewScoresComponent({ onReturn }: { onReturn: () => void }) {
  const { user } = useUser();
  const [gameScores, setGameScores] = useState<ScoreWithPlayer[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameWithCourse | null>(null);
  const [roundCode, setRoundCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
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

  // Clear code error when user changes the round code
  useEffect(() => {
    if (codeError && roundCode) {
      setCodeError(null);
    }
  }, [roundCode, codeError]);

  // Handle round code validation
  const validateCode = async () => {
    // Standardize the input format
    const formattedCode = String(roundCode || '').trim().toUpperCase();
    
    if (!formattedCode || formattedCode.length < 3) {
      if (formattedCode && formattedCode.length > 0 && formattedCode.length < 3) {
        setCodeError("Round code must be at least 3 characters");
      }
      return;
    }
    
    if (!user) {
      setCodeError("You must be logged in to access this feature");
      return;
    }

    setIsValidatingCode(true);
    setCodeError(null);
    
    try {
      // Ensure the round code is in the correct format before validation
      setRoundCode(formattedCode);
      
      // Validate the round code and get game details
      const game = await validateRoundCode(formattedCode);
      setSelectedGame(game);
      
      // Load scores for this game
      const scores = await getGameScores(game.id);
      
      // Transform scores to match expected format
      const validScores = scores
        .filter(score => score.id && score.player_id) // Filter out any invalid entries
        .map(score => ({
          id: score.id,
          player_id: score.player_id,
          raw_score: score.raw_score,
          points: score.points,
          bonus_points: score.bonus_points,
          notes: score.notes,
          submitted_at: score.submitted_at,
          profiles: {
            username: score.profiles?.username || 'Unknown Player',
            profile_image_url: score.profiles?.profile_image_url
          }
        }));
      
      setGameScores(validScores);
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; details?: string };
      if (process.env.NODE_ENV !== 'production') {
        console.error("Round code validation error:", error);
      }

      // Check for specific error types
      if (err.message?.includes("no rows") ||
          err.message?.includes("multiple (or no) rows") ||
          err.details?.includes("contains 0 rows")) {
        setCodeError("Round code not found. Please check and try again");
      } else if (err.status === 403) {
        setCodeError("You don't have permission to access this round");
      } else {
        setCodeError("Invalid round code. Please check and try again");
      }
      
      // Clear any previously set game details and scores
      setSelectedGame(null);
      setGameScores([]);
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Toggle expanded notes
  const toggleNotes = (scoreId: string) => {
    if (expandedNotes === scoreId) {
      setExpandedNotes(null);
    } else {
      setExpandedNotes(scoreId);
    }
  };

  // Format date only on the client side
  useEffect(() => {
    if (selectedGame) {
      setFormattedDates(prev => ({
        ...prev,
        gameDate: formatDate(selectedGame.game_date)
      }));
    }

    // Format all score dates
    const scoreDates: Record<string, string> = {};
    gameScores.forEach(score => {
      scoreDates[score.id] = formatDate(score.submitted_at);
    });

    setFormattedDates(prev => ({
      ...prev,
      ...scoreDates
    }));
  }, [selectedGame, gameScores]);

  // Render mobile score card
  const renderMobileScoreCard = (score: ScoreWithPlayer) => {
    return (
      <Card key={score.id} className="mb-4">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="font-medium">{score.profiles.username}</h3>
            <p className="text-xs text-gray-500">Submitted: {formattedDates[score.id] || 'Loading...'}</p>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">Score</div>
                <div className="font-bold text-lg">{score.raw_score}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">Points</div>
                <div className="font-bold text-lg">{score.points}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">Total</div>
                <div className="font-bold text-lg text-green-700">{score.points + score.bonus_points}</div>
              </div>
            </div>
            
            {score.bonus_points > 0 && (
              <Badge className="bg-green-100 text-green-800 border-green-200 mt-1">
                +{score.bonus_points} Bonus Point
              </Badge>
            )}
            
            {score.notes && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="flex items-center text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      View Notes
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="text-sm p-3 bg-gray-50 rounded-md mt-1">
                    {score.notes}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Card className="w-full shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl text-green-700 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              View Round Scores
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Enter a round code to view all player scores.
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
          <div className="space-y-6">
            {/* Round code input */}
            <div className="space-y-2 max-w-md mx-auto sm:mx-0">
              <Label htmlFor="roundCode">Enter Round Code</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="roundCode"
                  value={roundCode}
                  onChange={(e) => {
                    // Normalize to uppercase in real-time as user types
                    const value = e.target.value.toUpperCase();
                    setRoundCode(value);
                    if (codeError) setCodeError(null);
                  }}
                  placeholder="Enter round code"
                  className={`text-center uppercase tracking-wider ${codeError ? 'border-red-500' : ''}`}
                />
                <Button 
                  onClick={() => {
                    // Format the code before validation
                    const formattedCode = String(roundCode || '').trim().toUpperCase();
                    setRoundCode(formattedCode);
                    validateCode();
                  }}
                  disabled={isValidatingCode || !roundCode}
                  className="w-full sm:w-auto"
                >
                  {isValidatingCode ? 'Verifying...' : 'View Scores'}
                </Button>
              </div>
              
              {/* Error message display */}
              <div
                className="flex items-center text-sm text-red-500 font-medium mt-2"
                style={{ display: codeError ? 'flex' : 'none' }}
              >
                <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>{codeError || 'Invalid code'}</span>
              </div>
            </div>
            
            {/* Game details if loaded */}
            {selectedGame && (
              <div className="rounded-md bg-green-50 p-3 border border-green-200">
                <h3 className="font-semibold text-green-800">{selectedGame.name}</h3>
                <div className="flex flex-col sm:flex-row sm:gap-4 mt-1">
                  <p className="text-sm text-green-700 flex items-center">
                    <Flag className="h-3.5 w-3.5 mr-1" />
                    {selectedGame.courses.name} (Par {selectedGame.courses.par})
                  </p>
                  <p className="text-sm text-green-700 flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {formattedDates.gameDate || 'Loading...'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Scores display */}
            {selectedGame && (
              <>
                {/* Mobile view (cards) */}
                {isMobile ? (
                  <div className="space-y-1">
                    {gameScores.length === 0 ? (
                      <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                        <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No scores have been submitted for this round yet.</p>
                      </div>
                    ) : (
                      gameScores.map(score => renderMobileScoreCard(score))
                    )}
                  </div>
                ) : (
                  /* Desktop view (table) */
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Player</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                          <TableHead className="text-right">Bonus</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gameScores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No scores have been submitted for this round yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          gameScores.map((score) => (
                            <TableRow key={score.id}>
                              <TableCell className="font-medium">
                                {score.profiles.username}
                                {score.notes && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs ml-1 text-gray-500"
                                    onClick={() => toggleNotes(score.id)}
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Notes
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {score.raw_score}
                              </TableCell>
                              <TableCell className="text-right">
                                {score.points}
                              </TableCell>
                              <TableCell className="text-right">
                                {score.bonus_points}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {score.points + score.bonus_points}
                              </TableCell>
                              <TableCell className="text-right text-gray-500 text-sm">
                                {formattedDates[score.id] || 'Loading...'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
            
            {/* Notes expansion in desktop view */}
            {!isMobile && expandedNotes && gameScores.length > 0 && (
              <div className="space-y-2 p-4 border rounded-md bg-gray-50">
                {(() => {
                  const score = gameScores.find(s => s.id === expandedNotes);
                  return score ? (
                    <>
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Notes for {score.profiles.username}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setExpandedNotes(null)}
                        >
                          Close
                        </Button>
                      </div>
                      <p className="text-sm">{score.notes || 'No notes available.'}</p>
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}