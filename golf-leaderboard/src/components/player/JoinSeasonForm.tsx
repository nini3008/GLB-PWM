'use client'

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { useNavigation } from '@/hooks/useNavigation';
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
  Key,
  Users,
  Camera
} from 'lucide-react';
import { joinSeason, getUserSeasons } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import QRScanner from '@/components/ui/QRScanner';

// Form validation schema
const seasonFormSchema = z.object({
  seasonCode: z.string().min(4, 'Season code must be at least 4 characters').max(20, 'Season code is too long'),
});

type SeasonFormValues = z.infer<typeof seasonFormSchema>;

export default function JoinSeasonForm() {
  const { user } = useUser();
  const nav = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userSeasons, setUserSeasons] = useState<any[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const form = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      seasonCode: '',
    },
  });

  // Fetch user's seasons on component mount
  useEffect(() => {
    const fetchUserSeasons = async () => {
      if (!user) return;
      
      try {
        setIsLoadingSeasons(true);
        const seasons = await getUserSeasons(user.id);
        setUserSeasons(seasons);
      } catch (error) {
        console.error("Error fetching user seasons:", error);
      } finally {
        setIsLoadingSeasons(false);
      }
    };

    fetchUserSeasons();
  }, [user]);

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
      // Get the normalized season code from the form
      // It should already be uppercase from our onChange handler
      const normalizedCode = String(values.seasonCode || '').trim().toUpperCase();
      console.log("Joining season with code:", normalizedCode);
      
      // Try to join the season
      await joinSeason(normalizedCode, user.id);
      
      // Update the user's seasons list
      const seasons = await getUserSeasons(user.id);
      setUserSeasons(seasons);
      
      // Show success state
      setIsSuccess(true);
      toast.success("Successfully joined season", {
        description: "You've been added to the season. You can now participate in games."
      });
      
      // Reset form
      form.reset();
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        nav.goToDashboard();
      }, 3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
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

  // Render the join form
  const renderContent = () => {
    if (isLoadingSeasons) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-10 w-10 text-green-500 animate-spin mb-4" />
          <p className="text-gray-600">Checking your season memberships...</p>
        </div>
      );
    }

    if (isSuccess) {
      return (
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
              onClick={nav.goToDashboard} 
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              Return to Dashboard
            </Button>
            <p className="text-sm text-gray-500">
              You&apos;ll be redirected automatically in a few seconds...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Show current seasons if user has any */}
        {userSeasons.length > 0 && (
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-blue-700" />
              <h3 className="font-medium text-blue-800">
                Your Joined Seasons ({userSeasons.length})
              </h3>
            </div>
            <div className="space-y-2">
              {userSeasons.map(season => (
                <div key={season.id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                  <span className="text-blue-900 font-medium">{season.name}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      {season.code}
                    </code>
                    {season.isActive ? (
                      <Badge className="bg-green-600 text-white text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-3">
              You can join additional seasons by entering a new season code below.
            </p>
          </div>
        )}

        <div className="bg-green-50 p-5 rounded-xl border border-green-100 flex gap-4">
          <div className="hidden sm:flex h-10 w-10 bg-green-100 rounded-full flex-shrink-0 items-center justify-center">
            <Key className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h3 className="font-medium text-green-800 mb-1">
              {userSeasons.length > 0 ? 'Join Another Season' : 'How to join a season'}
            </h3>
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
                {...form.register('seasonCode', {
                  onChange: (e) => {
                    // Normalize to uppercase in real-time as user types
                    const value = e.target.value.toUpperCase();
                    e.target.value = value;
                    form.setValue('seasonCode', value);
                  }
                })}
                id="seasonCode"
                className={`pl-10 text-center text-xl uppercase tracking-widest font-medium py-6
                  ${seasonError ? 'border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200'} transition-all`}
                placeholder="ENTER CODE"
                autoFocus
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQRScanner(true)}
              className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-green-50 hover:text-green-700"
            >
              <Camera className="h-4 w-4" />
              Scan QR Code
            </Button>

            {showQRScanner && (
              <QRScanner
                onScan={(value) => {
                  form.setValue('seasonCode', value.toUpperCase());
                  setShowQRScanner(false);
                }}
                onClose={() => setShowQRScanner(false)}
              />
            )}
            
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
              <span>
                {userSeasons.length > 0
                  ? "You can join multiple seasons. All your previous season data remains accessible."
                  : "You only need to join a season once. After joining, you'll have access to all rounds and events in that season."}
              </span>
            </p>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-medium transition-all"
            disabled={isSubmitting}
            onClick={() => {
              // Normalize the code one last time before submission
              const currentCode = form.getValues().seasonCode;
              const normalizedCode = String(currentCode || '').trim().toUpperCase();
              form.setValue('seasonCode', normalizedCode);
            }}
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
    );
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
          onClick={nav.goToDashboard} 
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
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}