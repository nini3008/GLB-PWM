// src/components/admin/ManageScoresView.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { ArrowLeft, Edit, Trash2, Save, AlertTriangle, AlertCircle, ChevronDown, Calendar, Flag, ClipboardCheck } from 'lucide-react';
import {
  getGameScores,
  updateScore,
  validateRoundCode,
  deleteScore
} from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { calculatePoints, updateBonusPoints } from '@/lib/utils/scoring';

// Form validation schema
const editScoreFormSchema = z.object({
  rawScore: z
    .number()
    .min(50, 'Score must be at least 50')
    .max(150, 'Score cannot be more than 150'),
  notes: z.string().optional(),
});

type EditScoreFormValues = z.infer<typeof editScoreFormSchema>;

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

export default function ManageScoresView({ onReturn }: { onReturn: () => void }) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [gameScores, setGameScores] = useState<ScoreWithPlayer[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameWithCourse | null>(null);
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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

  // Initialize form
  const form = useForm<EditScoreFormValues>({
    resolver: zodResolver(editScoreFormSchema),
    defaultValues: {
      rawScore: undefined,
      notes: '',
    },
  });

  // Clear code error when user changes the round code
  useEffect(() => {
    if (codeError && roundCode) {
      setCodeError(null);
    }
  }, [roundCode, codeError]);

  // Handle round code validation
  const validateCode = async () => {
    if (!roundCode || roundCode.length < 3) {
      if (roundCode && roundCode.length > 0 && roundCode.length < 3) {
        setCodeError("Round code must be at least 3 characters");
        toast.error("Round code too short");
      }
      return;
    }
    
    if (!user) {
      setCodeError("You must be logged in as an admin to access this feature");
      return;
    }

    setIsValidatingCode(true);
    setCodeError(null);
    
    try {
      // Validate the round code and get game details
      const game = await validateRoundCode(roundCode);
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
      
      toast.success("Round loaded", {
        description: `Viewing scores for ${game.name} at ${game.courses.name}`,
      });
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; details?: string; error_description?: string };
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
      
      toast.error("Invalid round code", {
        description: "Please check the code and try again.",
      });
      
      // Clear any previously set game details and scores
      setSelectedGame(null);
      setGameScores([]);
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Start editing a score
  const startEditing = (score: ScoreWithPlayer) => {
    setEditingScoreId(score.id);
    form.reset({
      rawScore: score.raw_score,
      notes: score.notes || '',
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingScoreId(null);
    form.reset();
  };

  // Save edited score
  const saveEditedScore = async (values: EditScoreFormValues) => {
    if (!editingScoreId || !selectedGame || !user) return;
    
    setIsLoading(true);
    try {
      // Recalculate points based on new raw score
      const points = calculatePoints(values.rawScore, selectedGame.courses.par);
      
      // Update the score
      await updateScore(editingScoreId, {
        raw_score: values.rawScore,
        points,
        edited_by: user.id,
        edited_at: new Date().toISOString(),
        notes: values.notes,
      });
      
      // Refresh all scores for this game
      const updatedScores = await getGameScores(selectedGame.id);
      
      // Transform the updated scores
      const validUpdatedScores = updatedScores
        .filter(score => score.id && score.player_id)
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
      
      // Recalculate bonus points for all players in this round
      const playerBonusUpdates = updateBonusPoints(
        validUpdatedScores.map(score => ({
          playerId: score.player_id,
          rawScore: score.raw_score,
          bonusPoints: score.bonus_points,
        }))
      );
      
      // Apply bonus point updates if needed
      for (const update of playerBonusUpdates) {
        const scoreToUpdate = validUpdatedScores.find(
          score => score.player_id === update.playerId
        );
        
        if (scoreToUpdate && scoreToUpdate.bonus_points !== (update.shouldHaveBonus ? 1 : 0)) {
          await updateScore(scoreToUpdate.id, {
            bonus_points: update.shouldHaveBonus ? 1 : 0,
            edited_by: user.id,
            edited_at: new Date().toISOString(),
          });
        }
      }
      
      // Refresh scores again after all updates
      const finalScores = await getGameScores(selectedGame.id);
      
      // Transform the final scores
      const validFinalScores = finalScores
        .filter(score => score.id && score.player_id)
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
      
      setGameScores(validFinalScores);
      
      // Reset editing state
      setEditingScoreId(null);
      form.reset();
      
      toast.success("Score updated", {
        description: "The score and points have been updated successfully.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Error updating score", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a score
  const confirmDeleteScore = (scoreId: string) => {
    setShowDeleteConfirm(scoreId);
  };

  const handleDeleteScore = async () => {
    if (!showDeleteConfirm || !selectedGame || !user) return;
    
    setIsLoading(true);
    try {
      // Delete the score
      await deleteScore(showDeleteConfirm);
      
      // Refresh scores
      const updatedScores = await getGameScores(selectedGame.id);
      
      // Transform the updated scores
      const validUpdatedScores = updatedScores
        .filter(score => score.id && score.player_id)
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
      
      setGameScores(validUpdatedScores);
      
      // Reset state
      setShowDeleteConfirm(null);
      
      toast.success("Score deleted", {
        description: "The score has been removed from the leaderboard.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Error deleting score", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
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
          {editingScoreId !== score.id && (
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => startEditing(score)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-500"
                onClick={() => confirmDeleteScore(score.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          {editingScoreId === score.id ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rawScore">Score</Label>
                <Input
                  id="rawScore"
                  {...form.register('rawScore', { valueAsNumber: true })}
                  type="number"
                  className="w-full mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Add any notes about this score..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={cancelEditing}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={form.handleSubmit(saveEditedScore)}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
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
          )}
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
              Manage Scores
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Edit or delete player scores as needed.
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
                    setRoundCode(e.target.value.toUpperCase());
                    if (codeError) setCodeError(null);
                  }}
                  placeholder="Enter round code"
                  className={`text-center uppercase tracking-wider ${codeError ? 'border-red-500' : ''}`}
                />
                <Button 
                  onClick={validateCode}
                  disabled={isValidatingCode || !roundCode}
                  className="w-full sm:w-auto"
                >
                  {isValidatingCode ? 'Verifying...' : 'Load Scores'}
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
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gameScores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
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
                                {editingScoreId === score.id ? (
                                  <Input
                                    {...form.register('rawScore', { valueAsNumber: true })}
                                    type="number"
                                    className="w-20 text-right ml-auto"
                                  />
                                ) : (
                                  score.raw_score
                                )}
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
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {editingScoreId === score.id ? (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={cancelEditing}
                                        disabled={isLoading}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        onClick={form.handleSubmit(saveEditedScore)}
                                        disabled={isLoading}
                                      >
                                        <Save className="h-4 w-4 mr-1" />
                                        Save
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => startEditing(score)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-red-500"
                                        onClick={() => confirmDeleteScore(score.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
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
            
            {/* Edit form in desktop view */}
            {!isMobile && editingScoreId && (
              <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                <h3 className="font-semibold">Edit Notes</h3>
                <Textarea
                  {...form.register('notes')}
                  placeholder="Add any notes about this score..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Score Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this score? This action cannot be undone and will
              recalculate the leaderboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isLoading} className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteScore}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete Score"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}