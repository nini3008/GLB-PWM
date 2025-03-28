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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Flag, 
  RefreshCw, 
  ClipboardCheck, 
  Trophy,
  Loader2,
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase, createGame } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Form validation schema
const createGameSchema = z.object({
  name: z.string().min(3, 'Game name must be at least 3 characters').max(50, 'Game name is too long'),
  courseId: z.string().min(1, 'Please select a course'),
  seasonId: z.string().min(1, 'Please select a season'),
  gameDate: z.string().min(1, 'Please select a date'),
  roundCode: z.string().min(4, 'Round code must be at least 4 characters').max(10, 'Round code is too long'),
});

type CreateGameFormValues = z.infer<typeof createGameSchema>;

interface Course {
  id: string;
  name: string;
  location: string | null;
  par: number;
}

interface Season {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export default function CreateGameForm({ onReturn }: { onReturn: () => void }) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [submittedCode, setSubmittedCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  const form = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      name: '',
      courseId: '',
      seasonId: '',
      gameDate: new Date().toISOString().split('T')[0], // Default to today
      roundCode: '',
    },
  });

  // Update form progress based on filled fields
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      let filledFields = 0;
      
      if (values.name) filledFields++;
      if (values.courseId) filledFields++;
      if (values.seasonId) filledFields++;
      if (values.gameDate) filledFields++;
      if (values.roundCode) filledFields++;
      
      setFormProgress((filledFields / 5) * 100);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Load courses and seasons
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        // Load courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, name, location, par')
          .order('name');
        
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
        
        // Load active seasons
        const { data: seasonsData, error: seasonsError } = await supabase
          .from('seasons')
          .select('id, name, code, is_active')
          .eq('is_active', true)
          .order('name');
        
        if (seasonsError) throw seasonsError;
        setSeasons(seasonsData || []);
        
      } catch (error) {
        console.error('Error loading options:', error);
        toast.error("Failed to load data", {
          description: "Could not load courses and seasons. Please try again."
        });
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // Generate a random round code
  const generateRoundCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    form.setValue('roundCode', result);
  };

  // Set default round code on first load
  useEffect(() => {
    generateRoundCode();
  }, []);

  // Handle form submission
  const handleSubmit = async (values: CreateGameFormValues) => {
    if (!user) {
      toast.error("Authentication error", {
        description: "You must be logged in as an admin to create a game."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the round code - normalize it to uppercase
      const roundCode = values.roundCode.toUpperCase();
      
      // Create the game
      const gameData = await createGame({
        name: values.name,
        course_id: values.courseId,
        season_id: values.seasonId,
        round_code: roundCode,
        game_date: values.gameDate,
        created_by: user.id,
        status: 'active' 
      });

      setSubmittedCode(gameData.round_code);
      
      // Show success state
      setIsSuccess(true);
      toast.success("Game created successfully", {
        description: "Players can now join this round using the code."
      });
      
      // Reset form
      form.reset({
        name: '',
        courseId: '',
        seasonId: '',
        gameDate: new Date().toISOString().split('T')[0],
        roundCode: '',
      });
      
      // Generate new round code
      generateRoundCode();
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        onReturn();
      }, 5000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Handle specific errors
      if (error.message?.includes("duplicate key")) {
        toast.error("Round code already exists", {
          description: "Please generate a new round code and try again."
        });
      } else {
        toast.error("Failed to create game", {
          description: "Please check your inputs and try again."
        });
      }
      console.error('Error creating game:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected course par
  const getSelectedCoursePar = () => {
    const courseId = form.watch('courseId');
    const selectedCourse = courses.find(course => course.id === courseId);
    return selectedCourse?.par;
  };

  // Copy round code to clipboard
  const copyCodeToClipboard = () => {
    if (!submittedCode) return;
    
    navigator.clipboard.writeText(submittedCode)
      .then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
        toast.success("Code copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy code");
      });
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
          <Flag className="h-8 w-8" />
          Create Game
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
        {/* Progress indicator */}
        {!isSuccess && (
          <div className="w-full bg-gray-100">
            <Progress value={formProgress} className="h-1 bg-gray-200" />
          </div>
        )}

        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Badge className="bg-white/20 hover:bg-white/30 text-white mb-2 border-none">
                <Flag className="h-3 w-3 mr-1" /> Administrator Action
              </Badge>
              <CardTitle className="text-xl font-bold">
                {isSuccess ? "Game Created Successfully" : "Create New Golf Round"}
              </CardTitle>
              <CardDescription className="text-green-100 mt-1">
                {isSuccess 
                  ? "Players can now join this round and submit scores" 
                  : "Set up details for a new golf round in your season"
                }
              </CardDescription>
            </div>
            <div className="hidden sm:flex h-16 w-16 bg-white/10 rounded-full items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-3">Game Ready to Play!</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Your new game has been created successfully and is ready for players to join.
                Share the round code with players so they can submit their scores.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-xl mb-8 max-w-md mx-auto">
                <p className="text-sm text-gray-500 mb-2">Round Code</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-3xl font-bold tracking-widest text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                    {submittedCode}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyCodeToClipboard}
                    className="flex items-center gap-2"
                  >
                    {codeCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {codeCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={onReturn} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  Return to Dashboard
                </Button>
                <p className="text-sm text-gray-500">
                  You&apos;ll be redirected automatically in a few seconds...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="bg-green-50 p-5 rounded-xl border border-green-100 mb-4">
                <div className="flex gap-3">
                  <ClipboardCheck className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-800 mb-1">Creating a new game</h3>
                    <p className="text-sm text-green-700">
                      Fill in the details below to create a new golf round. Once created, players can use the 
                      round code to submit their scores. Be sure to select the correct course and season.
                    </p>
                  </div>
                </div>
              </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Game Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">Game Name</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="2025 Season Week 1"
                    disabled={isLoadingOptions || isSubmitting}
                    className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                {/* Game Date */}
                <div className="space-y-2">
                  <Label htmlFor="gameDate" className="text-gray-700">Game Date</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="gameDate"
                      type="date"
                      {...form.register('gameDate')}
                      disabled={isSubmitting}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
                    />
                  </div>
                  {form.formState.errors.gameDate && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.gameDate.message}
                    </p>
                  )}
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Selection */}
                <div className="space-y-2">
                  <Label htmlFor="courseId" className="text-gray-700">Select Course</Label>
                  <Select
                    onValueChange={(value) => form.setValue('courseId', value)}
                    defaultValue={form.watch('courseId')}
                    disabled={isLoadingOptions || isSubmitting}
                  >
                    <SelectTrigger 
                      id="courseId" 
                      className={`w-full border-gray-300 ${isLoadingOptions ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <SelectValue placeholder={isLoadingOptions ? "Loading courses..." : "Select a course"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.length === 0 ? (
                        <SelectItem value="none" disabled>No courses available</SelectItem>
                      ) : (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id} className="py-3">
                            <div>
                              <div className="font-medium">{course.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {course.location || 'No location'} • Par {course.par}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.courseId && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.courseId.message}
                    </p>
                  )}
                  {form.watch('courseId') && (
                    <div className="flex items-center gap-1 mt-1 bg-green-50 px-2 py-1 rounded text-sm text-green-700">
                      <Flag className="h-3 w-3" />
                      Selected course par: {getSelectedCoursePar()}
                    </div>
                  )}
                </div>
                
                {/* Season Selection */}
                <div className="space-y-2">
                  <Label htmlFor="seasonId" className="text-gray-700">Select Season</Label>
                  <Select
                    onValueChange={(value) => form.setValue('seasonId', value)}
                    defaultValue={form.watch('seasonId')}
                    disabled={isLoadingOptions || isSubmitting}
                  >
                    <SelectTrigger 
                      id="seasonId" 
                      className={`w-full border-gray-300 ${isLoadingOptions ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <SelectValue placeholder={isLoadingOptions ? "Loading seasons..." : "Select a season"} />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.length === 0 ? (
                        <SelectItem value="none" disabled>No active seasons available</SelectItem>
                      ) : (
                        seasons.map((season) => (
                          <SelectItem key={season.id} value={season.id} className="py-3">
                            <div>
                              <div className="font-medium">{season.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                Season Code: {season.code}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.seasonId && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.seasonId.message}
                    </p>
                  )}
                </div>
              </div>
              
              <Separator className="my-2" />
              
              {/* Round Code */}
              <div className="space-y-2">
                <Label htmlFor="roundCode" className="text-gray-700">Round Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="roundCode"
                    {...form.register('roundCode')}
                    className="text-center uppercase tracking-wider font-medium text-lg border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={generateRoundCode}
                    disabled={isSubmitting}
                    className="flex-shrink-0 border-gray-300 hover:bg-green-50 hover:text-green-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
                {form.formState.errors.roundCode && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {form.formState.errors.roundCode.message}
                  </p>
                )}
                <div className="text-sm text-amber-600 flex items-center gap-1 mt-2 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>Players will use this code to submit scores. Make sure to share it with all participants.</span>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-medium transition-all"
                disabled={isSubmitting || isLoadingOptions}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Game...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Flag className="h-5 w-5" />
                    Create Golf Round
                  </div>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}