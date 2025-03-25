'use client'

import React, { useState, useEffect } from 'react';
import { LockKeyhole } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ResetPasswordPageProps {
  onComplete: () => void;
}

export default function ResetPasswordPage({ onComplete }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Verify that we have a valid reset token in the URL
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        setDebugInfo(prev => prev + '\nChecking session...');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setDebugInfo(prev => prev + `\nSession error: ${error.message}`);
          setError(`Invalid session: ${error.message}`);
          return;
        }
        
        console.log('Session data:', data);
        setDebugInfo(prev => prev + `\nSession found: ${data.session ? 'Yes' : 'No'}`);
        
        if (!data.session) {
          setError('Invalid or expired password reset link. Please request a new reset link.');
        }
      } catch (err) {
        console.error('Session check exception:', err);
        setDebugInfo(prev => prev + `\nSession check exception: ${String(err)}`);
        setError('An error occurred while verifying your session.');
      }
    };

    checkSession();
  }, []);

  // Handle redirection after successful reset with visible countdown
  useEffect(() => {
    if (!success) return;
    
    console.log('Starting redirect countdown...');
    setDebugInfo(prev => prev + '\nStarting redirect countdown...');
    
    // Create countdown effect
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Actual redirect
    const redirectTimer = setTimeout(() => {
      console.log('Executing redirect now!');
      setDebugInfo(prev => prev + '\nExecuting redirect now!');
      // Force navigation to home
      window.location.href = '/';
    }, 3000);
    
    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [success, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo('Password reset started...');

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setDebugInfo(prev => prev + '\nPassword too short');
      setIsLoading(false);
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setDebugInfo(prev => prev + '\nPasswords don\'t match');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Updating password...');
      setDebugInfo(prev => prev + '\nUpdating password with Supabase...');
      
      // Additional check to ensure session exists
      const sessionCheck = await supabase.auth.getSession();
      if (!sessionCheck.data.session) {
        setError('No active session found. Please request a new reset link.');
        setDebugInfo(prev => prev + '\nNo active session for password update');
        setIsLoading(false);
        return;
      }
      
      // Check what user we're updating for
      setDebugInfo(prev => prev + `\nUser ID: ${sessionCheck.data.session?.user?.id || 'unknown'}`);
      
      // Try the update
      const { data, error } = await supabase.auth.updateUser({ password });
      
      console.log('Update response:', { data, error });
      setDebugInfo(prev => prev + 
        `\nUpdate response: ${error ? 'Error: ' + error.message : 'Success'}`);

      if (error) {
        console.error('Password update error:', error);
        setError(error.message);
      } else {
        console.log('Password updated successfully!');
        setDebugInfo(prev => prev + '\nPassword updated successfully! Setting success state...');
        
        // Force a slight delay to ensure state is updated
        setTimeout(() => {
          setSuccess(true);
          setDebugInfo(prev => prev + '\nSuccess state set to TRUE');
        }, 100);
      }
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Password update exception:', err);
      setDebugInfo(prev => prev + `\nPassword update exception: ${err?.message || String(err)}`);
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Emergency redirect function
  const forceRedirect = () => {
    console.log('Force redirecting to home...');
    window.location.href = '/';
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold text-center mb-6 text-green-700">
        <LockKeyhole className="inline mr-2 mb-1" />
        Reset Your Password
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {success ? (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
          <p className="font-medium">Your password has been successfully reset!</p>
          <p className="mt-2">Redirecting to home page in {countdown} seconds...</p>
          <div className="w-full bg-gray-200 h-1 mt-4 rounded overflow-hidden">
            <div 
              className="bg-green-500 h-full" 
              style={{ 
                animation: 'progressAnim 3s linear forwards',
                width: '0%' 
              }}
            ></div>
          </div>
          <style jsx>{`
            @keyframes progressAnim {
              0% { width: 0; }
              100% { width: 100%; }
            }
          `}</style>
          <button
            onClick={forceRedirect}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition duration-200"
          >
            Go to Home Page Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              New Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition duration-200 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Reset Password'
            )}
          </button>
          
          {isLoading && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              This may take a moment...
            </p>
          )}
          
          <div className="mt-4">
            <button
              type="button"
              onClick={forceRedirect}
              className="w-full text-green-600 hover:text-green-800 text-sm py-2"
            >
              Cancel and return to login
            </button>
          </div>
        </form>
      )}
      
      {/* Debug information - remove in production */}
      <div className="mt-8 border-t pt-4 text-xs font-mono text-gray-500 whitespace-pre-wrap">
        <details>
          <summary className="cursor-pointer">Debug Info</summary>
          {debugInfo || 'No debug information available'}
        </details>
      </div>
    </div>
  );
}