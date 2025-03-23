// src/hooks/useUser.ts
'use client'

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

// Define types for user profile
interface UserProfile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  handicap: number | null;
  bio: string | null;
  profile_image_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export function useUser() {
  // Get auth data from context
  const { user: authUser, profile: authProfile, isAdmin } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Sync with auth context
  useEffect(() => {
    setUser(authUser);
    setProfile(authProfile as UserProfile | null);
    setIsLoading(false);
  }, [authUser, authProfile]);

  // Function to update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      if (profile) {
        setProfile({ ...profile, ...updates });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };



  const updateProfileImage = async (imageFile: File) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

     // Add the file validation here
    if (imageFile.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be under 2MB');
    }
    
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
        throw new Error('Only JPEG, PNG and WebP images are allowed');
    }
  
    setIsLoading(true);
    try {
      console.log("Starting image upload for user:", user.id);
      
      // Create a safer file path
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log("Uploading to path:", filePath);
      
      // Upload the image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });
  
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
  
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
  
      const imageUrl = data.publicUrl;
      console.log("Image uploaded, URL:", imageUrl);
  
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: imageUrl })
        .eq('id', user.id);
  
      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }
  
      console.log("Profile updated successfully");
      return { success: true, imageUrl };
    } catch (error) {
      console.error('Error updating profile image:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's joined seasons
  const getUserSeasons = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('season_participants')
        .select(`
          id,
          joined_at,
          seasons:season_id (
            id,
            name,
            code,
            start_date,
            end_date,
            is_active
          )
        `)
        .eq('player_id', user.id);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user seasons:', error);
      throw error;
    }
  };

  // Get user's recent scores
  const getUserScores = async (limit = 10) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          raw_score,
          points,
          bonus_points,
          submitted_at,
          games:game_id (
            id,
            name,
            game_date,
            courses:course_id (
              name,
              par
            )
          )
        `)
        .eq('player_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user scores:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    isAdmin,
    isLoading,
    updateUserProfile,
    updateProfileImage,
    getUserSeasons,
    getUserScores,
  };
}