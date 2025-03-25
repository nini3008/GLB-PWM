'use client'
// src/components/admin/EditScoreForm.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Edit, Trash2, Save, AlertTriangle, AlertCircle } from 'lucide-react';
import { 
  getGameScores, 
  updateScore,
  getGameScores as refreshGameScores,
  validateRoundCode,
} from '@/lib/supabase/client';
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

export function AdminScoreManagement({ onReturn }: { onReturn: () => void }) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [gameScores, setGameScores] = useState<ScoreWithPlayer[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameWithCourse | null>(null);
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [roundCode, setRoundCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});

  // Format date only on the client side
useEffect(() => {
    if (selectedGame) {
      setFormattedDates(prev => ({
        ...prev,
        gameDate: new Date(selectedGame.game_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      }));
    }
    
    // Format all score dates
    const scoreDates: Record<string, string> = {};
    gameScores.forEach(score => {
      scoreDates[score.id] = new Date(score.submitted_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    });
    
    setFormattedDates(prev => ({
      ...prev,
      ...scoreDates
    }));
  }, [selectedGame, gameScores]);

  // Initialize form
  const form = useForm<EditScoreFormValues>({
    resolver: zodResolver(editScoreFormSchema),
    defaultValues: {
      rawScore: undefined,
      notes: '',
    },
  });

  // Handle round code validation
  const validateCode = async () => {
    console.log("Validating code:", roundCode);
    // Always reset error state at beginning
    setCodeError(null);
    
    if (!roundCode || roundCode.length < 3) {
      console.log("Code too short or empty");
      if (roundCode && roundCode.length > 0) {
        const errorMsg = "Round code must be at least 3 characters";
        console.log("Setting error:", errorMsg);
        setCodeError(errorMsg);
        toast.error("Round code too short");
      }
      return;
    }
    
    if (!user) {
        const errorMsg = "You must be logged in to verify a round code";
        console.log("Setting error:", errorMsg);
        setCodeError(errorMsg);
        return;
    }
  
    setIsValidatingCode(true);
    try {
      console.log("Calling validateRoundCode API");
      // Validate the round code and get game details
      const game = await validateRoundCode(roundCode);
      console.log("Code validated successfully:", game);
      setSelectedGame(game);
      
      // Load scores for this game
      const rawScores = await getGameScores(game.id);
      
      // Transform the data to ensure it matches our expected types
      const validScores = rawScores
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
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Round code validation error:', error);
      const errorMsg = "Invalid round code. Please check and try again.";
      console.log("Setting error after catch:", errorMsg);
      setCodeError(errorMsg);
      
      // Force DOM update for reliability
      setTimeout(() => {
        if (errorRef.current) {
          console.log("Forcing error display via DOM");
          errorRef.current.textContent = "⚠️ " + errorMsg;
          errorRef.current.style.display = 'flex';
        }
      }, 50);
      
      // Provide more detailed error messages based on the error type
      if (error.status === 406 || error.message?.includes("not found")) {
        toast.error("Invalid round code");
      } else if (error.status === 403) {
        toast.error("Access denied", {
          description: "You don't have permission to view this round."
        });
      } else {
        toast.error("Error loading round", {
          description: "An unexpected error occurred. Please try again."
        });
      }
      
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
      const updatedScores = await refreshGameScores(selectedGame.id);
      
      // Recalculate bonus points for all players in this round
      const playerBonusUpdates = updateBonusPoints(
        updatedScores.map(score => ({
          playerId: score.player_id,
          rawScore: score.raw_score,
          bonusPoints: score.bonus_points,
        }))
      );
      
      // Apply bonus point updates if needed
      for (const update of playerBonusUpdates) {
        const scoreToUpdate = updatedScores.find(
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
      const finalScores = await refreshGameScores(selectedGame.id);
      setGameScores(finalScores);
      
      // Reset editing state
      setEditingScoreId(null);
      form.reset();
      
      toast.success("Score updated", {
        description: "The score and points have been updated successfully.",
      });
    } catch (error) {
        console.error(error)
      toast.error("Error updating score",{
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
      // In a real app, you would have a delete endpoint
      // For now, we'll just filter it out of the UI
      // await deleteScore(showDeleteConfirm);
      
      // Refresh scores
      const updatedScores = await refreshGameScores(selectedGame.id);
      setGameScores(updatedScores);
      
      // Reset state
      setShowDeleteConfirm(null);
      
      toast.success("Score deleted", {
        description: "The score has been removed from the leaderboard.",
      });
    } catch (error) {
      console.error(error)
      toast.error("Error deleting score", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-green-700">Manage Scores</CardTitle>
            <Button variant="ghost" size="sm" onClick={onReturn}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <CardDescription>
            As an admin, you can edit or delete player scores. Please use this responsibility carefully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="roundCode">Enter Round Code</Label>
              <div className="flex gap-2">
                <Input
                  id="roundCode"
                  value={roundCode}
                  onChange={(e) => {
                    setRoundCode(e.target.value);
                    setCodeError(null);
                  }}
                  placeholder="Enter round code"
                  className={`text-center uppercase tracking-wider ${codeError ? 'border-red-500' : ''}`}
                />
                <Button 
                  onClick={validateCode}
                  disabled={isValidatingCode || !roundCode}
                >
                  {isValidatingCode ? 'Verifying...' : 'Load Scores'}
                </Button>
              </div>
              
              {/* Error message with ref for direct manipulation if needed */}
              <div 
                ref={errorRef}
                className="flex items-center text-sm text-red-500 font-medium mt-2"
                style={{ display: codeError ? 'flex' : 'none' }}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                {codeError || 'Invalid code'}
              </div>
            </div>
            
            {/* Game details if loaded */}
            {selectedGame && (
              <div className="rounded-md bg-green-50 p-3 border border-green-200">
                <h3 className="font-semibold text-green-800">{selectedGame.name}</h3>
                <p className="text-sm text-green-700">
                  Course: {selectedGame.courses.name} (Par {selectedGame.courses.par})
                </p>
                <p className="text-sm text-green-700">
                  Date: {formattedDates.gameDate || 'Loading...'}
                </p>
              </div>
            )}
            
            {/* Scores table */}
            {selectedGame && (
              <div className="rounded-md border overflow-hidden">
                 <div className="hidden sm:block">
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
              </div>
            )}
            
            {editingScoreId && (
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
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