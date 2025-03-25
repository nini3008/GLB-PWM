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

  // Verify that we have a valid reset token in the URL
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setError('Invalid or expired password reset link. Please request a new reset link.');
      }
    };

    checkSession();
  }, []);

  // Handle redirection after successful reset
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    
    if (success) {
      redirectTimer = setTimeout(() => {
        console.log('Redirecting after password reset...');
        onComplete();
      }, 3000);
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [success, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Updating password...');
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error('Password update error:', error);
        setError(error.message);
      } else {
        console.log('Password updated successfully!');
        setSuccess(true);
        // We now handle redirection in the useEffect above
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Password update exception:', err);
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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
          <p className="mt-2">Redirecting to login page...</p>
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
        </form>
      )}
    </div>
  );
}