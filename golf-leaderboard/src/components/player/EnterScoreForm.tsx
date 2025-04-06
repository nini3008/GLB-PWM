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
  CardFooter,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertCircle, 
  Check, 
  ArrowLeft, 
  ClipboardCheck, 
  Shield, 
  BadgeCheck, 
  Flag,
  Medal,
  Loader2
} from 'lucide-react';
import { 
  validateRoundCode, 
  hasUserSubmittedScore, 
  isUserInSeason,
  submitScore,
  getGameScores,
  updateScoreBonusPoints
} from '@/lib/supabase/client';
import { calculateFullScore, updateBonusPoints } from '@/lib/utils/scoring';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Form validation schema
const scoreFormSchema = z.object({
  roundCode: z.string().min(1, 'Round code is required'),
  rawScore: z
    .number()
    .min(50, 'Score must be at least 50')
    .max(150, 'Score cannot be more than 150'),
  notes: z.string().optional(),
});

type ScoreFormValues = z.infer<typeof scoreFormSchema>;

// Game details type
interface GameDetails {
  id: string;
  name: string;
  season_id: string;
  courses: {
    id: string;
    name: string;
    par: number;
  };
}

export default function EnterScoreForm({ onReturn }: { onReturn: () => void }) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [calculatedScore, setCalculatedScore] = useState<{
    rawScore: number;
    overPar: number;
    points: number;
    bonusPoints: number;
    totalPoints: number;
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<'code' | 'score'>('code');

  const form = useForm<ScoreFormValues>({
    resolver: zodResolver(scoreFormSchema),
    defaultValues: {
      roundCode: '',
      rawScore: undefined,
      notes: '',
    },
  });

  // Clear code error when user changes the round code
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'roundCode' && codeError) {
        setCodeError(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, codeError]);

  // Handle round code validation
  const validateCode = async (roundCode: string) => {
    // Standardize the input format
    const formattedCode = String(roundCode || '').trim().toUpperCase();
    
    console.log("Validating code:", formattedCode);
    
    if (!formattedCode || formattedCode.length < 3) {
      if (formattedCode && formattedCode.length > 0 && formattedCode.length < 3) {
        setCodeError("Round code must be at least 3 characters");
      }
      return;
    }
    
    if (!user) {
      setCodeError("You must be logged in to verify a round code");
      return;
    }
  
    setIsValidatingCode(true);
    setCodeError(null);
    
    try {
      // Update the form value to ensure it's in the correct format
      form.setValue('roundCode', formattedCode);
      
      // Validate the round code and get game details
      const game = await validateRoundCode(formattedCode);
      
      // Check if the user is part of this season
      const userInSeason = await isUserInSeason(game.season_id, user.id);
      if (!userInSeason) {
        setCodeError("You need to join this season before submitting scores");
        toast.error("Not in this season",{
          description: "You need to join this season before submitting scores.",
        });
        return;
      }
      
      // Check if the user has already submitted a score for this game
      const alreadySubmitted = await hasUserSubmittedScore(game.id, user.id);
      if (alreadySubmitted) {
        setCodeError("You have already submitted a score for this round");
        toast.error("Score already submitted", {
          description: "You have already submitted a score for this round.",
        });
        return;
      }
      
      // Set the game details in state
      setGameDetails(game);
      setFormStep('score');
      toast.success("Round code valid", {
        description: `Ready to submit score for ${game.name} at ${game.courses.name}`,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Round code validation error:", {
          error,
          message: error.message || "No error message",
          status: error.status,
          details: error.details || error.error_description,
        });
      }
      
      // Check for "no rows" type errors which mean invalid code
      if (error.message?.includes("no rows") || 
          error.message?.includes("multiple (or no) rows") ||
          error.details?.includes("contains 0 rows")) {
        setCodeError("Round code not found. Please check and try again");
      } else if (error.status === 403) {
        setCodeError("You don't have permission to access this round");
      } else {
        setCodeError("Invalid round code. Please check and try again");
      }
      
      toast.error("Invalid round code", {
        description: "Please check the code and try again.",
      });
    } finally {
      // Always reset the validating state regardless of outcome
      setIsValidatingCode(false);
    }
  };

  // Calculate score and show confirmation dialog
  const handleScoreCalculation = async (values: ScoreFormValues) => {
    if (!gameDetails || !user) return;
    
    try {
      // Get all existing scores for this game to determine if this is the lowest score
      const allScores = await getGameScores(gameDetails.id);
      const rawScores = allScores.map(score => score.raw_score);
      
      // Calculate points based on the scoring system
      const calculatedScore = calculateFullScore(
        {
          rawScore: values.rawScore,
          coursePar: gameDetails.courses.par,
          playerId: user.id,
          gameId: gameDetails.id,
          notes: values.notes,
        },
        rawScores
      );
      
      setCalculatedScore(calculatedScore);
      setShowConfirmation(true);
    } catch (error) {
      console.log(error)
      toast.error("Error calculating score", {
        description: "Please try again.",
      });
    }
  };

  // Submit score after confirmation
  const handleSubmitConfirmed = async () => {
    if (!gameDetails || !calculatedScore || !user) return;
    
    setIsSubmitting(true);
    try {
      // First, get all existing scores for this game (before our new score is added)
      const existingScores = await getGameScores(gameDetails.id);
      
      // Submit the new score
      const newScore = await submitScore({
        game_id: gameDetails.id,
        player_id: user.id,
        raw_score: calculatedScore.rawScore,
        points: calculatedScore.points,
        bonus_points: calculatedScore.bonusPoints,
        notes: form.getValues().notes,
      });
      
      // Create a combined array of all scores (existing + new score) 
      // This saves us from having to fetch all scores again
      const allScores = [
        ...existingScores,
        {
          id: newScore.id,
          player_id: user.id,
          raw_score: calculatedScore.rawScore,
          points: calculatedScore.points,
          bonus_points: calculatedScore.bonusPoints
        }
      ];
      
      // Prepare data for bonus point calculation
      const scoresForBonusUpdate = allScores.map(score => ({
        playerId: score.player_id,
        rawScore: score.raw_score,
        bonusPoints: score.bonus_points
      }));
      
      // Calculate which players should have bonus points
      const bonusUpdates = updateBonusPoints(scoresForBonusUpdate);
    
      
      // Update bonus points in the database for all players if needed
      for (const update of bonusUpdates) {
        const shouldHaveBonus = update.shouldHaveBonus ? 1 : 0;
        const scoreToUpdate = allScores.find(score => score.player_id === update.playerId);
        
        
        if (scoreToUpdate && scoreToUpdate.bonus_points !== shouldHaveBonus) {
            try {
              await updateScoreBonusPoints(scoreToUpdate.id, shouldHaveBonus);
            } catch (error) {
              console.error(`Failed to update bonus points for score ${scoreToUpdate.id}:`, error);
            }
          } else {
            console.log(`No update needed for player ${update.playerId} (current=${scoreToUpdate?.bonus_points}, should=${shouldHaveBonus})`);
          }
      }
      
      toast.success("Score submitted successfully!", {
        description: `You earned ${calculatedScore.totalPoints} points for this round.`,
      });
      
      // Reset form and state
      form.reset();
      setGameDetails(null);
      setCalculatedScore(null);
      setShowConfirmation(false);
      setFormStep('code');
      
      // Redirect back to dashboard after short delay
      setTimeout(() => {
        onReturn();
      }, 2000);
    } catch (error) {
      console.error("Error submitting score:", error);
      toast.error("Error submitting score", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset code and go back to code input
  const handleResetCode = () => {
    setGameDetails(null);
    setFormStep('code');
  };

  return (
    <>
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
            <Flag className="h-8 w-8" />
            Enter Score
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

        <Card className="shadow-lg border-0 overflow-hidden">
          {/* Progress indicator for form steps */}
          <div className="w-full bg-gray-100">
            <Progress 
              value={formStep === 'code' ? 33 : 66} 
              className="h-1 bg-gray-200" 
            />
          </div>

          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-green-800">
                  {formStep === 'code' ? 'Step 1: Enter Round Code' : 'Step 2: Submit Your Score'}
                </CardTitle>
                <CardDescription className="text-green-700 mt-1">
                  {formStep === 'code' 
                    ? 'Enter the round code provided by your event administrator'
                    : `Submitting score for ${gameDetails?.name || 'your round'}`
                  }
                </CardDescription>
              </div>
              
              {gameDetails && (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                  <Flag className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{gameDetails.courses.name}</p>
                    <p className="text-xs text-gray-500">Par {gameDetails.courses.par}</p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form className="space-y-6">
              {formStep === 'code' ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-amber-800 text-sm flex items-start gap-3">
                    <ClipboardCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Round codes are unique to each event</p>
                      <p className="mt-1">Your event administrator will provide you with a unique code for each round you play.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="roundCode" className="text-gray-700">Round Code</Label>
                    <div className="flex gap-2">
                      <Input
                        {...form.register('roundCode', {
                          onChange: (e) => {
                            // Normalize to uppercase in real-time as user types
                            const value = e.target.value.toUpperCase();
                            e.target.value = value;
                            form.setValue('roundCode', value);
                          }
                        })}
                        id="roundCode"
                        placeholder="Enter round code"
                        className={`text-center uppercase tracking-wider text-lg font-medium ${codeError ? 'border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200'} transition-all`}
                        autoComplete="off"
                      />
                      <Button 
                        type="button" 
                        onClick={() => {
                          const code = form.getValues().roundCode;
                          console.log("Button clicked with code:", code);
                          validateCode(code);
                        }}
                        disabled={isValidatingCode}
                        className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                      >
                        {isValidatingCode ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Verify Code
                          </div>
                        )}
                      </Button>
                    </div>
                    
                    {form.formState.errors.roundCode && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {form.formState.errors.roundCode.message}
                      </p>
                    )}
                    
                    {codeError && (
                      <div className="flex items-center gap-2 text-sm text-red-500 font-medium mt-2 bg-red-50 p-2 rounded border border-red-100">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        {codeError}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 shadow-sm">
                    <div className="w-full sm:w-2/3">
                      <Label htmlFor="rawScore" className="text-green-800 font-medium mb-1 block">Your Score</Label>
                      <Input
                        {...form.register('rawScore', { 
                          valueAsNumber: true 
                        })}
                        id="rawScore"
                        type="number"
                        placeholder="Enter your score"
                        className="text-center text-xl font-bold h-14 bg-white/80 border-green-300 focus:border-green-500 focus:ring focus:ring-green-200"
                      />
                    </div>
                    <div className="w-full sm:w-1/3 bg-white/60 p-3 rounded-lg flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-600">Course Par</p>
                      <p className="text-2xl font-bold text-green-700">{gameDetails?.courses.par || '-'}</p>
                    </div>
                  </div>
                  
                  {form.formState.errors.rawScore && (
                    <div className="flex items-center gap-2 text-sm text-red-500 font-medium bg-red-50 p-2 rounded border border-red-100">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      {form.formState.errors.rawScore.message}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-gray-700">Notes (Optional)</Label>
                    <Textarea
                      {...form.register('notes')}
                      id="notes"
                      placeholder="Add any notes about your round, weather conditions, memorable shots..."
                      rows={3}
                      className="resize-none border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <p>Once submitted, your score can only be edited by an administrator.</p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex justify-between items-center p-6 bg-gray-50 border-t">
            {formStep === 'code' ? (
              <div className="w-full flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => {
                    const code = form.getValues().roundCode;
                    console.log("Proceed button clicked with code:", code);
                    // Make sure the code is formatted correctly before validation
                    const formattedCode = String(code || '').trim().toUpperCase();
                    form.setValue('roundCode', formattedCode);
                    validateCode(formattedCode);
                  }}
                  disabled={isValidatingCode || !form.getValues().roundCode}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isValidatingCode ? 'Verifying...' : 'Proceed to Enter Score →'}
                </Button>
              </div>
            ) : (
              <div className="w-full flex flex-col sm:flex-row gap-3 sm:justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleResetCode}
                  className="order-2 sm:order-1"
                >
                  ← Back to Round Code
                </Button>
                <Button 
                  type="button" 
                  onClick={form.handleSubmit(handleScoreCalculation)}
                  disabled={!gameDetails || isSubmitting || !form.watch('rawScore')}
                  className="bg-green-600 hover:bg-green-700 order-1 sm:order-2"
                >
                  <BadgeCheck className="mr-2 h-5 w-5" />
                  Calculate & Preview Score
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-[85vw] w-full max-h-[90vh] overflow-y-auto sm:max-w-md border-0 shadow-xl">
          <DialogHeader className="bg-gradient-to-r from-green-600 to-emerald-500 -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Medal className="h-6 w-6" />
              Score Confirmation
            </DialogTitle>
            <DialogDescription className="text-green-50">
              Please review your score details before final submission
            </DialogDescription>
          </DialogHeader>
          
          {calculatedScore && gameDetails && (
            <div className="py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 text-center p-3 sm:p-5 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Your Score</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{calculatedScore.rawScore}</p>
                  <div className="mt-1 text-xs sm:text-sm text-gray-500">
                    {calculatedScore.overPar > 0 ? `+${calculatedScore.overPar}` : calculatedScore.overPar} to par
                  </div>
                </div>
                <div className="flex-1 text-center p-3 sm:p-5 bg-green-50 rounded-lg shadow-sm border border-green-100">
                  <p className="text-xs sm:text-sm text-green-700 mb-1">Total Points</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-800">{calculatedScore.totalPoints}</p>
                  <div className="mt-1 flex justify-center items-center gap-1">
                    <span className="inline-block px-2 py-0.5 bg-green-200 text-green-800 text-xs font-medium rounded">
                      Base: {calculatedScore.points}
                    </span>
                    {calculatedScore.bonusPoints > 0 && (
                      <span className="inline-block px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded">
                        Bonus: +{calculatedScore.bonusPoints}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">Course</span>
                    <span className="font-medium">{gameDetails.courses.name}</span>
                  </div>
                  <Separator className="my-1.5 sm:my-2" />
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">Par</span>
                    <span className="font-medium">{gameDetails.courses.par}</span>
                  </div>
                  <Separator className="my-1.5 sm:my-2" />
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">Event</span>
                    <span className="font-medium">{gameDetails.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-xs sm:text-sm text-amber-700 bg-amber-50 p-2 sm:p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>Once submitted, this score cannot be modified by you. Only administrators can make changes to submitted scores.</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-2 sm:mt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-sm order-2 sm:order-1 py-1.5 px-3 sm:py-2 sm:px-4"
            >
              Go Back & Edit
            </Button>
            <Button
              type="button"
              onClick={handleSubmitConfirmed}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-sm order-1 sm:order-2 py-1.5 px-3 sm:py-2 sm:px-4"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  Confirm & Submit Score
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}