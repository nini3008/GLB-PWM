"use client"

// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Session, 
  User, 
  AuthError, 
  AuthChangeEvent 
} from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/postgrest-js';
import { supabase, getUserProfile } from '../lib/supabase/client';

// User profile type that matches the structure from Supabase
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

// Custom error type that can be either AuthError or PostgrestError
type AppError = AuthError | PostgrestError | Error;

// Authentication context type
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AppError | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: AppError | null }>;
  signOut: () => Promise<{ error: AppError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: AppError | null }>;
  resetPassword: (email: string) => Promise<{ error: AppError | null }>; // Add this line
}

// Create the auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use a ref to track tab activation time
  const lastTabActivationRef = useRef(0);

  // Add a visibility change listener to detect when the tab becomes active again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Record timestamp when tab becomes visible
        lastTabActivationRef.current = Date.now();
        console.log("Tab became visible at:", lastTabActivationRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
  
    const initializeAuth = async () => {
      if (!mounted) return;
      
      // Only set loading if not yet initialized
      if (!isInitialized) {
        setIsLoading(true);
      }
      
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            // Get user profile
            const profileData = await getUserProfile(session.user.id);
            if (!mounted) return;
            
            setProfile(profileData as UserProfile);
            setIsAdmin(profileData.is_admin);
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };
  
    initializeAuth();
  
    // Auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      
      // Check if this auth event happened within 3 seconds of tab activation
      // Using a slightly longer window to catch delayed auth events
      const isRecentTabActivation = 
        lastTabActivationRef.current > 0 && 
        (Date.now() - lastTabActivationRef.current < 3000);
      
      console.log("Auth event:", event, "Recent tab activation:", isRecentTabActivation, "Time since activation:", Date.now() - lastTabActivationRef.current, "ms");
      
      // Always update session and user
      setSession(session);
      setUser(session?.user || null);
      
      // Skip loading indicator for background events or events after tab activation
      const skipLoading = 
        isRecentTabActivation || 
        event === 'TOKEN_REFRESHED' || 
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION';
            
      // Only show loading for explicit user actions, not system-triggered events
      if (isInitialized && event === 'SIGNED_IN' && !skipLoading) {
        setIsLoading(true);
        try {
          if (session?.user) {
            // Get user profile
            const profileData = await getUserProfile(session.user.id);
            if (!mounted) return;
            
            setProfile(profileData as UserProfile);
            setIsAdmin(profileData.is_admin);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          if (mounted) setIsLoading(false);
        }
      } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || 
                 (event === 'SIGNED_IN' && skipLoading)) && session?.user) {
        // For background events, still update the profile but don't show loading
        try {
          // Only fetch profile if this is not a tab activation event or we need a fresh copy
          if (!isRecentTabActivation || !profile) {
            const profileData = await getUserProfile(session.user.id);
            if (!mounted) return;
            
            setProfile(profileData as UserProfile);
            setIsAdmin(profileData.is_admin);
          }
        } catch (error) {
          console.error('Error updating user profile:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsAdmin(false);
      }
    });
  
    // Cleanup subscription and prevent state updates after unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialized]);


  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ error: AppError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: err as AppError };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string): Promise<{ error: AppError | null }> => {
    try {
      // Create the user in Supabase Auth
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      return { error };
    } catch (err) {
      return { error: err as AppError };
    }
  };

  // Sign out
  const signOut = async (): Promise<{ error: AppError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err as AppError };
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: AppError | null }> => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (!error && profile) {
        // Update local state
        setProfile({ ...profile, ...updates });
      }
      
      return { error };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { error: err as AppError };
    }
  };

  // Inside your AuthProvider component, add this function:
const resetPassword = async (email: string): Promise<{ error: AppError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err) {
      console.error('Error resetting password:', err);
      return { error: err as AppError };
    }
  };

  // Auth context value
  const value: AuthContextType = {
    session,
    user,
    profile,
    isAdmin,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword, 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}