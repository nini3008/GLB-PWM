'use client'
// src/components/admin/CreateSeasonForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
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
import { ArrowLeft, Calendar, CheckCircle2, Code, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

// Form validation schema
const seasonFormSchema = z.object({
  name: z.string().min(3, 'Season name must be at least 3 characters').max(100, 'Season name is too long'),
  code: z.string().min(4, 'Season code must be at least 4 characters').max(20, 'Season code is too long').regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
});

type SeasonFormValues = z.infer<typeof seasonFormSchema>;

interface CreateSeasonFormProps {
  onReturn: () => void;
}

interface ExistingSeason {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export default function CreateSeasonForm({ onReturn }: CreateSeasonFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdSeasonCode, setCreatedSeasonCode] = useState<string>('');
  const [existingSeasons, setExistingSeasons] = useState<ExistingSeason[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);

  const form = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      name: '',
      code: '',
      start_date: '',
      end_date: '',
    },
  });

  // Fetch existing seasons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const { data, error } = await supabase
          .from('seasons')
          .select('id, name, code, is_active')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setExistingSeasons(data || []);
      } catch (error) {
        console.error('Error fetching seasons:', error);
      } finally {
        setIsLoadingSeasons(false);
      }
    };

    fetchSeasons();
  }, []);

  // Auto-generate season code from name
  const generateCodeFromName = (name: string) => {
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 20);
    form.setValue('code', code);
  };

  const handleSubmit = async (values: SeasonFormValues) => {
    if (!user) {
      toast.error("Authentication error", {
        description: "You must be logged in to create a season."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the season in Supabase
      const { data, error } = await supabase
        .from('seasons')
        .insert({
          name: values.name,
          code: values.code.toUpperCase(),
          start_date: values.start_date,
          end_date: values.end_date || null,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        // Check for duplicate code error
        if (error.message?.includes('duplicate key') || error.code === '23505') {
          throw new Error('This season code already exists. Please choose a different code.');
        }
        throw error;
      }

      setCreatedSeasonCode(data.code);
      setIsSuccess(true);

      toast.success("Season created successfully!", {
        description: `Season code: ${data.code}`,
        duration: 5000,
      });

      // Reset form
      form.reset();

      // Redirect to dashboard after delay
      setTimeout(() => {
        onReturn();
      }, 5000);
    } catch (error: any) {
      console.error("Error creating season:", error);
      toast.error("Failed to create season", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-lg border-0">
          <CardContent className="pt-12 pb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">Season Created!</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Your new season has been created successfully. Share the season code with players so they can join.
              </p>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 max-w-sm mx-auto">
                <p className="text-sm text-green-700 mb-2 font-medium">Season Code</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-3xl font-bold text-green-800 tracking-widest">
                    {createdSeasonCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdSeasonCode);
                      toast.success('Code copied to clipboard!');
                    }}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Copy
                  </Button>
                </div>
              </div>

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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Create Season
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

      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <Badge className="bg-white/20 hover:bg-white/30 text-white mb-2 border-none w-fit">
            <Sparkles className="h-3 w-3 mr-1" /> Admin Only
          </Badge>
          <CardTitle className="text-xl font-bold">
            Create a New Golf Season
          </CardTitle>
          <CardDescription className="text-green-100 mt-1">
            Set up a new season for your golf league
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Existing Seasons Info */}
          {!isLoadingSeasons && existingSeasons.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-700" />
                <h3 className="font-semibold text-blue-900">Existing Seasons</h3>
              </div>
              <div className="space-y-2">
                {existingSeasons.map((season) => (
                  <div
                    key={season.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-blue-800">{season.name}</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200">
                        {season.code}
                      </code>
                      {season.is_active ? (
                        <Badge className="bg-green-600 text-white text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-3">
                💡 Use &quot;Manage Seasons&quot; to activate/deactivate seasons
              </p>
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Season Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Season Name
              </Label>
              <Input
                {...form.register('name', {
                  onChange: (e) => {
                    // Auto-generate code as user types name
                    if (!form.formState.dirtyFields.code) {
                      generateCodeFromName(e.target.value);
                    }
                  }
                })}
                id="name"
                placeholder="e.g., Virginia 2026, Spring League 2026"
                className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Season Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="code" className="text-gray-700 font-medium">
                  Season Code
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => generateCodeFromName(form.getValues('name'))}
                  className="text-green-600 hover:text-green-700 text-xs"
                >
                  <Code className="h-3 w-3 mr-1" />
                  Auto-generate
                </Button>
              </div>
              <Input
                {...form.register('code', {
                  onChange: (e) => {
                    // Force uppercase
                    const value = e.target.value.toUpperCase();
                    e.target.value = value;
                    form.setValue('code', value);
                  }
                })}
                id="code"
                placeholder="VIRGINIA2026"
                className="uppercase font-mono text-lg tracking-wider border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
                maxLength={20}
              />
              <p className="text-xs text-gray-500">
                Players will use this code to join the season. Must be uppercase letters and numbers only.
              </p>
              {form.formState.errors.code && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-gray-700 font-medium">
                Start Date
              </Label>
              <Input
                {...form.register('start_date')}
                id="start_date"
                type="date"
                className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
              />
              {form.formState.errors.start_date && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>

            {/* End Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-gray-700 font-medium">
                End Date <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Input
                {...form.register('end_date')}
                id="end_date"
                type="date"
                className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
              />
              <p className="text-xs text-gray-500">
                Leave empty if the season is ongoing or has no set end date.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                💡 After creating the season, share the season code with players so they can join using the &quot;Join Season&quot; feature.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-medium transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Season...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Create Season
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
