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
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  UserPlus, 
  Trophy,
  Loader2,
  Lock,
  Key
} from 'lucide-react';
import { joinSeason } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

// Form validation schema
const seasonFormSchema = z.object({
  seasonCode: z.string().min(4, 'Season code must be at least 4 characters').max(20, 'Season code is too long'),
});

type SeasonFormValues = z.infer<typeof seasonFormSchema>;

interface JoinSeasonFormProps {
  onReturn: () => void;
}

export default function JoinSeasonForm({ onReturn }: JoinSeasonFormProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [seasonError, setSeasonError] = useState<string | null>(null);

  const form = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      seasonCode: '',
    },
  });

  // Clear error when user changes the season code
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'seasonCode' && seasonError) {
        setSeasonError(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, seasonError]);

  const handleSubmit = async (values: SeasonFormValues) => {
    if (!user) {
      toast.error("Authentication error", {
        description: "You must be logged in to join a season."
      });
      return;
    }
    
    setIsSubmitting(true);
    setSeasonError(null);
    
    try {
      // Normalize the season code (uppercase and trim spaces)
      const normalizedCode = values.seasonCode.toUpperCase().trim();
      
      // Try to join the season
      await joinSeason(normalizedCode, user.id);
      
      // Show success state
      setIsSuccess(true);
      toast.success("Successfully joined season", {
        description: "You've been added to the season. You can now participate in games."
      });
      
      // Reset form
      form.reset();
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        onReturn();
      }, 3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Season join error:", {
        error,
        message: error.message || "No error message",
      });
      
      // Set specific error messages based on the error type
      if (error.message?.includes("duplicate key")) {
        setSeasonError("You've already joined this season");
        toast.error("Already joined", {
          description: "You've already joined this season."
        });
      } else if (error.message?.includes("not found")) {
        setSeasonError("Season code not found. Please check and try again");
        toast.error("Season not found", {
          description: "Season code not found. Please check and try again."
        });
      } else {
        setSeasonError("Failed to join season. Please check the code and try again");
        toast.error("Failed to join season", {
          description: "Please check the code and try again."
        });
      }
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
          <Trophy className="h-8 w-8" />
          Join Season
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
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Badge className="bg-white/20 hover:bg-white/30 text-white mb-2 border-none">
                <Calendar className="h-3 w-3 mr-1" /> Season Registration
              </Badge>
              <CardTitle className="text-xl font-bold">
                Join a Golf Season
              </CardTitle>
              <CardDescription className="text-green-100 mt-1">
                Access tournaments, track scores, and compete with friends
              </CardDescription>
            </div>
            <div className="hidden sm:flex h-16 w-16 bg-white/10 rounded-full items-center justify-center">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {isSuccess ? (
            <div className="text-center py-8 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">Joined Successfully!</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                You have been added to the season. You can now view events, submit scores, and compete with other players.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={onReturn} 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                  Return to Dashboard
                </Button>
                <p className="text-sm text-gray-500">
                  You&apos;ll be redirected automatically in a few seconds...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 p-5 rounded-xl border border-green-100 flex gap-4">
                <div className="hidden sm:flex h-10 w-10 bg-green-100 rounded-full flex-shrink-0 items-center justify-center">
                  <Key className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800 mb-1">How to join a season</h3>
                  <p className="text-sm text-green-700 leading-relaxed">
                    Enter the unique season code provided by your administrator or league organizer. 
                    Each code gives you access to a specific season&apos;s tournaments, leaderboards and events.
                  </p>
                </div>
              </div>

              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="seasonCode" className="block text-sm font-medium text-gray-700">
                    Season Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      {...form.register('seasonCode')}
                      id="seasonCode"
                      className={`pl-10 text-center text-xl uppercase tracking-widest font-medium py-6 
                        ${seasonError ? 'border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200'} transition-all`}
                      placeholder="ENTER CODE"
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                  
                  {form.formState.errors.seasonCode && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.seasonCode.message}
                    </p>
                  )}
                  
                  {seasonError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 font-medium mt-2 bg-red-50 p-3 rounded-lg border border-red-100">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      {seasonError}
                    </div>
                  )}
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <span>You only need to join a season once. After joining, you&apos;ll have access to all rounds and events in that season.</span>
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-medium transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Joining Season...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Join Season
                    </div>
                  )}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}