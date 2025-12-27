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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Save, Calendar, Flag, Award, TrendingUp, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserRecentScores, getUserSeasonScores, getUserSeasons, getUserAchievements, getUserSeasonRank, updatePlayerHandicap } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { checkAndAwardAchievements } from '@/lib/utils/achievements';
import { formatHandicap, getHandicapCategory } from '@/lib/utils/handicap';
import BadgesDisplay from './BadgesDisplay';

// Form validation schema
const profileFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username is too long'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  handicap: z.number().min(0, 'Handicap cannot be negative').max(54, 'Handicap cannot be more than 54').optional(),
  bio: z.string().max(500, 'Bio cannot be longer than 500 characters').optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface RecentScore {
  id: string;
  raw_score: number;
  points: number;
  bonus_points: number;
  submitted_at: string;
  games: {
    name: string;
    game_date: string;
    courses: {
      name: string;
      par: number;
    };
  };
}

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
}

interface UserAchievement {
  id: string;
  earned_at: string;
  season_id: string | null;
  metadata: unknown;
  achievements: Achievement;
  seasons?: {
    name: string;
  } | null;
}

export default function ProfileForm({ onReturn }: { onReturn: () => void }) {
  const { user, profile } = useUser();
  const { updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentScores, setRecentScores] = useState<RecentScore[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);
  const [seasonRank, setSeasonRank] = useState<{ rank: number; totalPlayers: number } | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profile?.username || '',
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      email: profile?.email || '',
      handicap: profile?.handicap || undefined,
      bio: profile?.bio || '',
    },
  });

  // Update form when profile data changes
  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.username,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email,
        handicap: profile.handicap || undefined,
        bio: profile.bio || '',
      });
      
      // Format member since date
      if (profile.created_at) {
        setFormattedDates(prev => ({
          ...prev,
          memberSince: new Date(profile.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        }));
      }
    }
  }, [profile, form]);

  // Load user's seasons
  useEffect(() => {
    const loadSeasons = async () => {
      if (!user) return;

      try {
        const userSeasons = await getUserSeasons(user.id);
        setSeasons(userSeasons);
      } catch (error) {
        console.error('Error loading seasons:', error);
      }
    };

    loadSeasons();
  }, [user]);

  // Load achievements
  useEffect(() => {
    const loadAchievements = async () => {
      if (!user) return;

      setIsLoadingAchievements(true);
      try {
        const achievements = await getUserAchievements(user.id);
        setUserAchievements(achievements);

        // Check for new achievements
        if (selectedSeason !== 'all') {
          await checkAndAwardAchievements(user.id, selectedSeason);
        } else {
          await checkAndAwardAchievements(user.id);
        }
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoadingAchievements(false);
      }
    };

    loadAchievements();
  }, [user, selectedSeason]);

  // Load scores based on selected season
  useEffect(() => {
    const loadScores = async () => {
      if (!user) return;

      setIsLoadingScores(true);
      try {
        let scores;
        if (selectedSeason === 'all') {
          scores = await getUserRecentScores(user.id);
          // Calculate and update handicap when viewing all scores
          await updatePlayerHandicap(user.id);
        } else {
          scores = await getUserSeasonScores(user.id, selectedSeason);
        }

        setRecentScores(scores);

        // Format game dates for all scores
        const gameDates: Record<string, string> = {};
        scores.forEach((score: RecentScore) => {
          gameDates[score.id] = new Date(score.games.game_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        });

        setFormattedDates(prev => ({
          ...prev,
          ...gameDates
        }));

        // Get season rank if season is selected
        if (selectedSeason !== 'all') {
          const rank = await getUserSeasonRank(user.id, selectedSeason);
          setSeasonRank(rank);
        } else {
          setSeasonRank(null);
        }
      } catch (error) {
        console.error('Error loading scores:', error);
      } finally {
        setIsLoadingScores(false);
      }
    };

    loadScores();
  }, [user, selectedSeason]);

  // Calculate average score
  const averageScore = recentScores.length > 0
    ? (recentScores.reduce((sum, score) => sum + score.raw_score, 0) / recentScores.length).toFixed(1)
    : 'N/A';

  // Calculate total points
  const totalPoints = recentScores.length > 0
    ? recentScores.reduce((sum, score) => sum + score.points + score.bonus_points, 0)
    : 0;

  // Handle form submission
  const handleSubmit = async (values: ProfileFormValues) => {
    console.log("Form submitted with values:", values);
    if (!user) {
      toast.error("Authentication error", {
        description: "You must be logged in to update your profile."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        console.log("Attempting to update profile...");
        
        // Use the AuthContext's updateProfile function directly
        const { error } = await updateProfile({
          username: values.username,
          first_name: values.first_name || null,
          last_name: values.last_name || null,
          email: values.email,
          handicap: values.handicap || null,
          bio: values.bio || null,
        });
        
        if (error) {
          throw error;
        }
        
        console.log("Profile update successful");
        toast.success("Profile updated", {
          description: "Your profile has been successfully updated."
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error("Failed to update profile", {
          description: "Please try again later."
        });
      } finally {
        setIsSubmitting(false);
      }
  };



  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
          <User className="h-8 w-8" />
          My Profile
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

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-500 rounded-xl p-6 shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center sm:text-left text-white">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {profile?.first_name && profile?.last_name 
                ? `${profile.first_name} ${profile.last_name}` 
                : profile?.username || 'Golf Player'}
            </h2>
            <p className="opacity-80 flex items-center justify-center sm:justify-start gap-1 mt-1">
              <Calendar className="h-4 w-4" />
              Member since {formattedDates.memberSince || 'N/A'}
            </p>
            
            {profile?.handicap && (
              <Badge className="mt-3 bg-white/20 hover:bg-white/30 text-white border-none">
                Handicap: {profile.handicap}
              </Badge>
            )}
          </div>
          
          <div className="flex-1 hidden md:flex justify-end">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-center">
                <Award className="h-6 w-6 mx-auto mb-1 text-yellow-300" />
                <p className="text-white text-sm">Total Points</p>
                <p className="text-2xl font-bold text-white">{totalPoints}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-center">
                <Flag className="h-6 w-6 mx-auto mb-1 text-white" />
                <p className="text-white text-sm">Avg. Score</p>
                <p className="text-2xl font-bold text-white">{averageScore}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards (Mobile) */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 mx-auto mb-1 text-amber-500" />
            <p className="text-amber-800 text-sm font-medium">Total Points</p>
            <p className="text-2xl font-bold text-amber-700">{totalPoints}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4 text-center">
            <Flag className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
            <p className="text-emerald-800 text-sm font-medium">Avg. Score</p>
            <p className="text-2xl font-bold text-emerald-700">{averageScore}</p>
          </CardContent>
        </Card>
      </div>

      {/* Season Filter */}
      <Card className="border-none shadow-md mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <Label htmlFor="season-select" className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by Season
              </Label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger id="season-select" className="w-full sm:w-64">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Seasons</SelectItem>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {seasonRank && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3 rounded-lg border border-yellow-200">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-600">Season Rank</p>
                  <p className="text-lg font-bold text-yellow-700">
                    #{seasonRank.rank} <span className="text-sm font-normal text-gray-600">of {seasonRank.totalPlayers}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="profile" className="text-base font-medium">
            Profile
          </TabsTrigger>
          <TabsTrigger value="scores" className="text-base font-medium">
            Scores
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-base font-medium">
            Achievements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-gray-700">First Name</Label>
                    <Input
                      id="first_name"
                      {...form.register('first_name')}
                      placeholder="Your first name"
                      className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-gray-700">Last Name</Label>
                    <Input
                      id="last_name"
                      {...form.register('last_name')}
                      placeholder="Your last name"
                      className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700">Username</Label>
                    <Input
                      id="username"
                      {...form.register('username')}
                      placeholder="Your username"
                      required
                      className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
                    />
                    {form.formState.errors.username && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      placeholder="Your email address"
                      required
                      className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="handicap" className="text-gray-700">Handicap</Label>
                  <Input
                    id="handicap"
                    type="number"
                    step="0.1"
                    {...form.register('handicap', { valueAsNumber: true })}
                    placeholder="Your golf handicap"
                    className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
                  />
                  {form.formState.errors.handicap && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.handicap.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-700">Bio</Label>
                  <Textarea
                    id="bio"
                    {...form.register('bio')}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all resize-none"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Share a bit about yourself with the community</span>
                    <span>{form.watch('bio')?.length || 0}/500</span>
                  </div>
                  {form.formState.errors.bio && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.bio.message}
                    </p>
                  )}
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving Changes
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scores">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Performance
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoadingScores ? (
                <div className="space-y-4 py-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentScores.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-xl font-medium text-gray-700">No scores recorded yet</h3>
                  <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    Start recording your scores to track your progress and earn points.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  <div className="bg-gray-50 p-4 rounded-lg hidden sm:grid grid-cols-12 font-medium text-gray-500 text-sm">
                    <div className="col-span-3">Date</div>
                    <div className="col-span-5">Course</div>
                    <div className="col-span-2 text-right">Score</div>
                    <div className="col-span-2 text-right">Points</div>
                  </div>
                  
                  <div className="space-y-3">
                    {recentScores.map((score) => (
                      <div 
                        key={score.id} 
                        className="rounded-lg border border-gray-100 hover:border-green-100 hover:bg-green-50 transition-all p-4 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center space-y-2 sm:space-y-0"
                      >
                        {/* Mobile View */}
                        <div className="flex items-center justify-between sm:hidden">
                          <div className="text-gray-600 text-sm">
                            {formattedDates[score.id] || 'Loading...'}
                          </div>
                          <div className="font-bold text-green-700">
                            {score.points + score.bonus_points} pts
                            {score.bonus_points > 0 && (
                              <span className="text-xs ml-1 text-yellow-600">+{score.bonus_points}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:hidden">
                          <div className="font-medium">{score.games.courses.name}</div>
                          <div className="font-medium">
                            {score.raw_score} <span className="text-gray-500 text-sm">
                              ({score.raw_score - score.games.courses.par > 0 ? '+' : ''}
                              {score.raw_score - score.games.courses.par})
                            </span>
                          </div>
                        </div>
                        
                        {/* Desktop View */}
                        <div className="hidden sm:block col-span-3 text-gray-600">
                          {formattedDates[score.id] || 'Loading...'}
                        </div>
                        <div className="hidden sm:block col-span-5 font-medium">
                          {score.games.courses.name}
                        </div>
                        <div className="hidden sm:block col-span-2 text-right font-medium">
                          {score.raw_score} <span className="text-gray-500 text-sm">
                            ({score.raw_score - score.games.courses.par > 0 ? '+' : ''}
                            {score.raw_score - score.games.courses.par})
                          </span>
                        </div>
                        <div className="hidden sm:block col-span-2 text-right font-bold text-green-700">
                          {score.points + score.bonus_points}
                          {score.bonus_points > 0 && (
                            <span className="text-xs ml-1 text-yellow-600">+{score.bonus_points}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <BadgesDisplay
            userAchievements={userAchievements}
            isLoading={isLoadingAchievements}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}